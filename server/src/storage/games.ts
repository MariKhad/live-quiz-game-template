import { Game, Player } from '../types.js';
import { GAME_STATUSES } from '../utils/consts.js';

export const games = new Map<string, Game>();

export function saveGame(game: Game): void {
    games.set(game.id, game);
}

export function getGame(id: string): Game | undefined {
    return games.get(id);
}

export function findGameByCode(code: string): Game | undefined {
    for (const game of games.values()) {
        if (game.code === code) {
            return game;
        }
    }
    return undefined;
}

export function updateGameStatus(id: string, status: Game['status']): boolean {
    const game = games.get(id);
    if (!game) return false;
    
    game.status = status;
    return true;
}

export function getPlayersInGame(gameId: string): Player[] {
    const game = games.get(gameId);
    return game ? [...game.players] : [];
}

export function getPlayerCount(gameId: string): number {
    const game = games.get(gameId);
    return game ? game.players.length : 0;
}

export function removePlayerFromAllGames(playerIndex: string): string[] {
    const affectedGames: string[] = [];
    
    for (const [gameId, game] of games.entries()) {
        const hadPlayer = game.players.some(p => p.index === playerIndex);
        
        if (hadPlayer) {
            game.players = game.players.filter(p => p.index !== playerIndex);
            affectedGames.push(gameId);
            
            if (game.status === GAME_STATUSES.IN_PROGRESS && game.players.length === 0) {
                game.status = GAME_STATUSES.FINISHED;
            }
        }
    }
    
    return affectedGames;
}
