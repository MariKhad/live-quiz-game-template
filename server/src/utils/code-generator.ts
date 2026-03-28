import { games } from '../storage/games.js';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 10;

function generateRandomCode(): string {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
        const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
        code += CODE_CHARS[randomIndex];
    }
    return code;
}

function isCodeUnique(code: string): boolean {
    for (const game of games.values()) {
        if (game.code === code) {
            return false;
        }
    }
    return true;
}

export function generateRoomCode(): string {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const code = generateRandomCode();
        
        if (isCodeUnique(code)) {
            console.log(`[CodeGenerator] Generated unique code: ${code}`);
            return code;
        }
        
        console.log(`[CodeGenerator] Collision for code: ${code}, retrying...`);
    }
    
    throw new Error('Failed to generate unique code');
}

