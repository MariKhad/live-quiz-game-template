import { Game } from '../types.js';
import { getPlayer, players } from '../storage/players.js';
import { OUTGOING_MESSAGES } from '../utils/consts.js';
import { broadcastToGame } from '../utils/broadcast.js';
import { startTimer, stopTimer } from './timer-handler.js';
import { finishGame } from './game-handler.js';
import { calculatePoints } from '../utils/score-calculator.js';

export function getQuestionResults(game: Game) {
    const currentQuestion = game.questions[game.currentQuestion];
    
    return game.players.map(p => {
        const player = getPlayer(p.index);
        const answered = player?.hasAnswered || false;
        const correct = player?.answeredCorrectly || false;
        const pointsEarned = correct ? calculatePoints(
            player?.answerTime ? (currentQuestion.timeLimitSec * 1000 - (player.answerTime - (game.questionStartTime || 0))) : 0,
            currentQuestion.timeLimitSec
        ) : 0;
        
        return {
            name: p.name,
            answered,
            correct,
            pointsEarned,
            totalScore: p.score
        };
    });
}

export function finalizeQuestion(game: Game): void {

    const currentQuestion = game.questions[game.currentQuestion];
    if (!currentQuestion) return;
    
    const correctIndex = currentQuestion.correctIndex;
    const timeLimitSec = currentQuestion.timeLimitSec;
    const questionStartTime = game.questionStartTime || Date.now();
    
    const playerResults = [];
    
    for (const player of game.players) {
        const answer = game.playerAnswers.get(player.index);
        const hasAnswered = !!answer;
        
        let pointsEarned = 0;
        let isCorrect = false;
        
        if (hasAnswered && answer) {
            isCorrect = answer.answerIndex === correctIndex;
            
            if (isCorrect) {
                const timeSpent = answer.timestamp - questionStartTime;
                pointsEarned = calculatePoints(timeSpent, timeLimitSec);
            }
        }

        player.score += pointsEarned;

        playerResults.push({
            name: player.name,
            answered: hasAnswered,
            correct: isCorrect,
            pointsEarned: pointsEarned,
            totalScore: player.score
        });
    }


    broadcastToGame(game.id, {
        type: OUTGOING_MESSAGES.QUESTION_RESULT,
        data: {
            questionIndex: game.currentQuestion,
            correctIndex: correctIndex,
            playerResults: playerResults
        },
        id: 0
    });
    
    game.playerAnswers.clear();
    
    game.currentQuestion++;
    
    if (game.currentQuestion < game.questions.length) {
        setTimeout(() => {
            sendNextQuestion(game);
        }, 5000);
    } else {
    setTimeout(() => {
        finishGame(game);
    }, 5000);
    }
}

export function sendNextQuestion(game: Game): void {

    for (const p of game.players) {
        console.log(`  - ${p.name}: hasAnswered=${p.hasAnswered}, score=${p.score}, ws=${!!p.ws}`);
    }

    if (game.currentQuestion >= game.questions.length) {
        console.log(`[Game] No more questions, finishing game ${game.id}`);
        finishGame(game);
        return;
    }
    
    const currentQuestion = game.questions[game.currentQuestion];
    if (!currentQuestion) return;
    
    for (const player of game.players) {
        player.hasAnswered = false;
        player.answerTime = undefined;
        player.answeredCorrectly = false;
    }
    
    for (const p of game.players) {
        console.log(`  - ${p.name}: hasAnswered=${p.hasAnswered}, score=${p.score}, ws=${!!p.ws}`);
    }
    
    for (const [index, p] of players.entries()) {
        const inGame = game.players.some(gp => gp.index === index);
        if (inGame) {
            console.log(`  - ${p.name}: hasAnswered=${p.hasAnswered}, ws=${!!p.ws}`);
        }
    }
    
    game.playerAnswers.clear();
    
    broadcastToGame(game.id, {
        type: OUTGOING_MESSAGES.QUESTION,
        data: {
            questionNumber: game.currentQuestion + 1,
            totalQuestions: game.questions.length,
            text: currentQuestion.text,
            options: currentQuestion.options,
            timeLimitSec: currentQuestion.timeLimitSec
        },
        id: 0
    });
    
    
    startTimer(game, (game) => {
        console.log(`[Timer] Time's up for game ${game.id}, question ${game.currentQuestion}`);
        finalizeQuestion(game);
    });
    
}
