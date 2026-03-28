import { WebSocketServer, WebSocket } from 'ws';
import { WSMessage, Player } from './types.js';
import {
    players, 
    removePlayerFromAllGames,
    getPlayersInGame
} from './storage/players.js';
import { broadcastToGame } from './utils/broadcast.js';
import { handleMessage } from './handlers/message-handler.js';
import { games } from './storage/games.js';
import { GAME_STATUSES, OUTGOING_MESSAGES } from './utils/consts.js';


export function setupWebSocketServer(wss: WebSocketServer): void {
    console.log('[Server] Setting up WebSocket server...');

    wss.on('connection', (ws: WebSocket) => {
        handleConnection(ws, wss);
    });
}


function handleConnection(ws: WebSocket, wss: WebSocketServer): void {
    console.log(`[Connection] New client connected. Total: ${wss.clients.size}`);

    ws.on('message', (data: Buffer) => {
        handleIncomingMessage(ws, data);
    });

    ws.on('close', () => {
        handleDisconnect(ws);
    });

    ws.on('error', (error: Error) => {
        console.error('[WebSocket Error]', error.message);
    });

    ws.send(JSON.stringify({
        type: 'welcome',
        data: {
            message: 'Connected to Live Quiz Game Server',
            timestamp: Date.now()
        },
        id: 0
    }));
}


function handleIncomingMessage(ws: WebSocket, data: Buffer): void {
    try {
        const messageStr = data.toString();
        console.log(`[Message] Received: ${messageStr}`);

        const message = JSON.parse(messageStr) as WSMessage;

        if (!message.type || message.id !== 0) {
            throw new Error('Invalid message format: missing type or id !== 0');
        }

        handleMessage(ws, message);

    } catch (error) {
        console.error('[Message Error]', error);

        ws.send(JSON.stringify({
            type: OUTGOING_MESSAGES.ERROR,
            data: {
                error: true,
                errorText: error instanceof Error ? error.message : 'Invalid message format'
            },
            id: 0
        }));
    }
}


function handleDisconnect(ws: WebSocket): void {
    let disconnectedPlayer: Player | undefined;
    for (const player of players.values()) {
        if (player.ws === ws) {
            disconnectedPlayer = player;
            break;
        }
    }

    if (!disconnectedPlayer) {
        console.log('[Disconnect] Unregistered client disconnected');
        return;
    }

    console.log(`[Disconnect] Player disconnected: ${disconnectedPlayer.name} (${disconnectedPlayer.index})`);

    const affectedGames = removePlayerFromAllGames(disconnectedPlayer.index);
    console.log(`[Disconnect] Player removed from ${affectedGames.length} game(s)`);

    for (const gameId of affectedGames) {
        const remainingPlayers = getPlayersInGame(gameId);
        
        broadcastToGame(gameId, {
            type: OUTGOING_MESSAGES.UPDATE_PLAYERS,
            data: remainingPlayers.map(p => ({
                name: p.name,
                index: p.index,
                score: p.score
            })),
            id: 0
        });

        console.log(`[Disconnect] Sent update_players to game ${gameId}, remaining: ${remainingPlayers.length}`);
    }

    disconnectedPlayer.ws = undefined;
    
    for (const game of games.values()) {
        if (game.hostId === disconnectedPlayer.index && game.status === 'in_progress') {
            console.log(`[Disconnect] Host disconnected during game ${game.id}, finishing game`);
            game.status = GAME_STATUSES.FINISHED;
            
            broadcastToGame(game.id, {
                type: OUTGOING_MESSAGES.GAME_FINISHED,
                data: {
                    scoreboard: game.players.map(p => ({
                        name: p.name,
                        score: p.score,
                        rank: 1 
                    }))
                },
                id: 0
            });
        }
    }

    console.log(`[Disconnect] Cleanup completed for player: ${disconnectedPlayer.name}`);
}