import { WebSocket } from 'ws';
import { WSMessage } from '../types.js';
import { INCOMING_MESSAGES } from '../utils/consts.js';
import { handleRegister } from './reg-handler.js';
import { handleAnswer, handleCreateGame, handleJoinGame, handleStartGame } from './game-handler.js';


export function handleMessage(ws: WebSocket, message: WSMessage): void {
    const { type, data } = message;
    
    console.log(`[Handler] Received message type: ${type}`);
    
    switch (type) {
        case INCOMING_MESSAGES.REG:
            handleRegister(ws, message);
            break;
            
        case INCOMING_MESSAGES.CREATE_GAME:
            handleCreateGame(ws, message);
            break;
            
        case INCOMING_MESSAGES.JOIN_GAME:
            handleJoinGame(ws, message);
            break;
            
        case INCOMING_MESSAGES.START_GAME:
            handleStartGame(ws, message);
            break;
            
        case INCOMING_MESSAGES.ANSWER:
            handleAnswer(ws, message);
            break;
            
        default:
            console.log(`[Handler] Unknown message type: ${type}`);
    }
}