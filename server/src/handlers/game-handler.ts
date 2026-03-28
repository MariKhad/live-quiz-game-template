import { WebSocket } from 'ws';
import { WSMessage, Question, Game, Player } from '../types.js';
import { players, getPlayer } from '../storage/players.js';
import { games } from '../storage/games.js';
import { GAME_STATUSES, OUTGOING_MESSAGES } from '../utils/consts.js';
import { broadcastToGame, sendToPlayer } from '../utils/broadcast.js';
import { finalizeQuestion, sendNextQuestion } from './question-handler.js';
import { generateRoomCode } from '../utils/code-generator.js';
import { startTimer, stopTimer } from './timer-handler.js';
import { calculatePoints } from '../utils/score-calculator.js';
import { sendErrorResponse } from './reg-handler.js';

export function handleCreateGame(ws: WebSocket, message: WSMessage): void {
    const data = message.data as { questions: Question[] };
    const { questions } = data;
    
    let host: Player | undefined;
    for (const player of players.values()) {
        if (player.ws === ws) {
            host = player;
            break;
        }
    }
    
    if (!host) return;
    
    const gameCode = generateRoomCode();
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const newGame: Game = {
        id: gameId,
        code: gameCode,
        hostId: host.index,
        questions: questions,
        players: [],
        currentQuestion: -1,
        status: GAME_STATUSES.WAITING,
        playerAnswers: new Map()
    };
    
    games.set(gameId, newGame);
    
    sendToPlayer(ws, {
        type: OUTGOING_MESSAGES.GAME_CREATED,
        data: { gameId, code: gameCode },
        id: 0
    });
}

export function handleJoinGame(ws: WebSocket, message: WSMessage): void {
    const data = message.data as { code: string };
    const { code } = data;
    
    let player: Player | undefined;
    for (const p of players.values()) {
        if (p.ws === ws) {
            player = p;
            break;
        }
    }
    
    if (!player) {
        sendErrorResponse(ws, 'Not registered')
        return
    }
    
    console.log(`[JoinGame] Player: ${player.name} (${player.index})`);

    let targetGame: Game | undefined;
    for (const game of games.values()) {
        if (game.code === code && game.status === GAME_STATUSES.WAITING) {
            targetGame = game;
            break;
        }
    }
    
    if (!targetGame) {
        sendErrorResponse(ws, 'Game not found')
        return;
    }

    const existingIndex = targetGame.players.findIndex(p => p.index === player!.index);
    if (existingIndex !== -1) {
        console.log(`[JoinGame] Player already in game.players, removing old copy`);
        targetGame.players.splice(existingIndex, 1);
    }
    
    targetGame.players.push(player);
    console.log(`[JoinGame] Added player, new total: ${targetGame.players.length}`);
    console.log(`[JoinGame] Players now:`, targetGame.players.map(p => ({ 
        name: p.name, 
        index: p.index,
        hasAnswered: p.hasAnswered 
    })));

    sendToPlayer(ws, {
        type: OUTGOING_MESSAGES.GAME_JOINED,
        data: { gameId: targetGame.id },
        id: 0
    });
    
    broadcastToGame(targetGame.id, {
        type: OUTGOING_MESSAGES.PLAYER_JOINED,
        data: {
            playerName: player.name,
            playerCount: targetGame.players.length
        },
        id: 0
    }, ws);
    
    broadcastToGame(targetGame.id, {
        type: OUTGOING_MESSAGES.UPDATE_PLAYERS,
        data: targetGame.players.map(p => ({
            name: p.name,
            index: p.index,
            score: p.score
        })),
        id: 0
    });
    
}

export function handleStartGame(ws: WebSocket, message: WSMessage): void {
    const data = message.data as { gameId: string };
    const { gameId } = data;
    
    const game = games.get(gameId);
    if (!game) return;
    
    let host: Player | undefined;
    for (const player of players.values()) {
        if (player.ws === ws) {
            host = player;
            break;
        }
    }
    
    if (!host || game.hostId !== host.index) return;
    if (game.status !== 'waiting') return;
    
    game.status = GAME_STATUSES.IN_PROGRESS;
    game.currentQuestion = 0;
    
    for (const player of game.players) {
        const p = getPlayer(player.index);
        if (p) {
            p.hasAnswered = false;
            p.answerTime = undefined;
            p.answeredCorrectly = false;
        }
    }
    
    sendNextQuestion(game);
    startTimer(game, () => finalizeQuestion(game));
}

export function handleAnswer(ws: WebSocket, message: WSMessage): void {
    console.log(`[Answer] Received message:`, JSON.stringify(message, null, 2));

    const data = message.data as { gameId?: string; questionIndex: number; answerIndex: number };
    const { questionIndex, answerIndex } = data;
    
    let player: Player | undefined;
    for (const p of players.values()) {
        if (p.ws === ws) {
            player = p;
            break;
        }
    }
    
    if (!player) {
        console.log(`[Answer] Player not found`);
        return;
    }
    

    let game: Game | undefined;
    for (const g of games.values()) {
        if (g.status === GAME_STATUSES.IN_PROGRESS && g.players.some(p => p.index === player.index)) {
            game = g;
            break;
        }
    }
    
    if (!game) {
        console.log(`[Answer] Game not found for player ${player.name}`);
        return;
    }
    

    if (questionIndex !== game.currentQuestion) {
        console.log(`[Answer] Wrong question index: got ${questionIndex}, expected ${game.currentQuestion}`);
        return;
    }
    
    if (player.hasAnswered) {
        console.log(`[Answer] Player already answered this question`);
        return;
    }

    const currentQuestion = game.questions[game.currentQuestion];
    if (!currentQuestion) {
        console.log(`[Answer] Current question not found`);
        return;
    }
    
    const isCorrect = answerIndex === currentQuestion.correctIndex;
    const answerTime = Date.now();
    const questionStartTime = game.questionStartTime || answerTime;
    const timeSpent = answerTime - questionStartTime;
    
    let pointsEarned = 0;
    
    if (isCorrect) {
        pointsEarned = calculatePoints(timeSpent, currentQuestion.timeLimitSec);
        console.log(`[Answer] Points earned: ${pointsEarned}`);
    }
    
    player.hasAnswered = true;
    player.answerTime = answerTime;
    player.answeredCorrectly = isCorrect;
    player.score += pointsEarned;
    
    const gamePlayer = game.players.find(p => p.index === player.index);
    if (gamePlayer) {
        gamePlayer.hasAnswered = true;
        gamePlayer.answerTime = answerTime;
        gamePlayer.answeredCorrectly = isCorrect;
        gamePlayer.score += pointsEarned;
    }
    
    game.playerAnswers.set(player.index, {
        answerIndex: answerIndex,
        timestamp: answerTime
    });
    
    sendToPlayer(ws, {
        type: OUTGOING_MESSAGES.ANSWER_ACCEPTED,
        data: { questionIndex },
        id: 0
    });
    
    const allAnswered = game.players.every(p => p.hasAnswered === true);
    
    if (allAnswered) {
        
        if (game.questionTimer) {
            clearTimeout(game.questionTimer);
            game.questionTimer = undefined;
        }
        
        finalizeQuestion(game);
    }
}


export function finishGame(game: Game): void {
    game.status = GAME_STATUSES.FINISHED;
    stopTimer(game);
    
    const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
    const scoreboard = sortedPlayers.map((player, index) => ({
        name: player.name,
        score: player.score,
        rank: index + 1
    }));
    
    broadcastToGame(game.id, {
        type: OUTGOING_MESSAGES.GAME_FINISHED,
        data: { scoreboard },
        id: 0
    });

}

export function findGameByHostId(hostId: string): Game | undefined {
    for (const game of games.values()) {
        if (game.hostId === hostId) {
            return game;
        }
    }
    return undefined;
}