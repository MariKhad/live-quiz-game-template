import { WebSocket } from 'ws';
import { games, getPlayersInGame } from '../storage/games.js';
import { OUTGOING_MESSAGES } from './consts.js';
import { WSMessage } from '../types.js';
import { players } from '../storage/players.js';

export function sendToPlayer(ws: WebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        console.log(`[Broadcast] Sent to player: ${message.type}`);
    } else {
        console.log(`[Broadcast] Cannot send, connection closed: ${message.type}`);
    }
}

export function broadcastToGame(
    gameId: string, 
    message: WSMessage, 
    excludeWs?: WebSocket
): void {
    const game = games.get(gameId);
    
    if (!game) {
        console.log(`[Broadcast] Game ${gameId} not found`);
        return;
    }

    let sentCount = 0;
    
    for (const player of game.players) {
        if (!player.ws) continue;
        if (excludeWs && player.ws === excludeWs) continue;
        
        if (player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify(message));
            sentCount++;
        }
    }

    const hostPlayer = players.get(game.hostId);
    if (hostPlayer?.ws && hostPlayer.ws !== excludeWs && hostPlayer.ws.readyState === WebSocket.OPEN) {
        hostPlayer.ws.send(JSON.stringify(message));
        sentCount++;
    }
    
    
    console.log(`[Broadcast] Sent ${message.type} to ${sentCount} players in game ${gameId}`);
}

export function broadcastUpdatePlayers(gameId: string): void {
    const playersList = getPlayersInGame(gameId);
    
    broadcastToGame(gameId, {
        type: OUTGOING_MESSAGES.UPDATE_PLAYERS,
        data: playersList.map(p => ({
            name: p.name,
            index: p.index,
            score: p.score
        })),
        id: 0
    });
}