
import { WebSocket } from 'ws';
import { RegData, Player, User, WSMessage } from '../types.js';
import { 
    players, 
    savePlayer, 
} from '../storage/players.js';
import { OUTGOING_MESSAGES } from '../utils/consts.js';
import { getUserByName, saveUser } from '../storage/users.js';

function generatePlayerIndex(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${random}`;
}

function sendSuccessResponse(ws: WebSocket, name: string, index: string): void {
    const response = {
        type: OUTGOING_MESSAGES.REG,
        data: {
            name: name,
            index: index,
            error: false,
            errorText: ''
        },
        id: 0
    };
    
    ws.send(JSON.stringify(response));
    console.log(`[Registration] Success response sent for ${name}`);
}

export function sendErrorResponse(ws: WebSocket, errorText: string): void {
    const response = {
        type: OUTGOING_MESSAGES.ERROR,
        data: {
            error: true,
            errorText: errorText
        },
        id: 0
    };
    
    ws.send(JSON.stringify(response));
    console.log(`[Registration] Error response sent: ${errorText}`);
}

export function handleRegister(ws: WebSocket, message: WSMessage): void {
    const { name, password } = message.data;
    
    console.log(`[Registration] Attempt - Name: ${name}`);

    if (!name || name.trim() === '') {
        sendErrorResponse(ws, 'Name is required');
        return;
    }
    
    if (!password || password.trim() === '') {
        sendErrorResponse(ws, 'Password is required');
        return;
    }

    const trimmedName = name.trim();

    
    const existingUser = getUserByName(trimmedName);
    
    if (existingUser) {
        if (existingUser.ws && existingUser.ws.readyState === WebSocket.OPEN) {
            console.log(`[Registration] User ${trimmedName} already connected`);
            sendErrorResponse(ws, 'User already logged in from another connection');
            return;
        }
        
        if (existingUser.password !== password) {
            sendErrorResponse(ws, 'Invalid password');
            return;
        }
        
        existingUser.ws = ws;
        
        let existingPlayer = players.get(existingUser.index);
        
        if (!existingPlayer) {
            const newPlayer: Player = {
                name: trimmedName,
                index: existingUser.index,
                score: 0,
                ws: ws,
                hasAnswered: false,
                answerTime: undefined,
                answeredCorrectly: false
            };
            savePlayer(newPlayer);
        } else {
            existingPlayer.ws = ws;
            existingPlayer.hasAnswered = false;
            existingPlayer.answerTime = undefined;
            existingPlayer.answeredCorrectly = false;
        }
        
        sendSuccessResponse(ws, trimmedName, existingUser.index);
        return;
    }

    const playerIndex = generatePlayerIndex();

    const newUser: User = {
        name: trimmedName,
        password: password,
        index: playerIndex,
        ws: ws
    };
    
    saveUser(newUser);

    const newPlayer: Player = {
        name: trimmedName,
        index: playerIndex,
        score: 0,
        ws: ws,
        hasAnswered: false,
        answerTime: undefined,
        answeredCorrectly: false
    };
    
    savePlayer(newPlayer);

    sendSuccessResponse(ws, trimmedName, playerIndex);
}