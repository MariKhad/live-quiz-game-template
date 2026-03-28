import { WebSocket } from 'ws';
import { Player } from '../types.js';

export const players = new Map<string, Player>();
const gamePlayers = new Map<string, Set<string>>();

export function getPlayer(playerId: string): Player | undefined {
  return players.get(playerId);
}

export function savePlayer(player: Player): void {
  players.set(player.index, player);
}

export function updatePlayerSocket(playerId: string, ws: WebSocket): void {
  const player = players.get(playerId);
  if (player) {
    player.ws = ws;
  }
}

export function updatePlayerScore(playerId: string, points: number): void {
  const player = players.get(playerId);
  if (player) {
    player.score += points;
  }
}

export function resetPlayerAnswerState(playerId: string): void {
  const player = players.get(playerId);
  if (player) {
    player.hasAnswered = false;
    player.answerTime = undefined;
    player.answeredCorrectly = false;
  }
}

export function setPlayerAnswer(playerId: string, answerTime: number, isCorrect: boolean): void {
  const player = players.get(playerId);
  if (player) {
    player.hasAnswered = true;
    player.answerTime = answerTime;
    player.answeredCorrectly = isCorrect;
  }
}

export function addPlayerToGame(playerId: string, gameId: string): void {
  if (!gamePlayers.has(gameId)) {
    gamePlayers.set(gameId, new Set());
  }
  gamePlayers.get(gameId)!.add(playerId);
}

export function getPlayersInGame(gameId: string): Player[] {
  const playerIds = gamePlayers.get(gameId);
  if (!playerIds) return [];
  
  return Array.from(playerIds)
    .map(id => players.get(id))
    .filter((player): player is Player => player !== undefined);
}

export function removePlayerFromAllGames(playerId: string): string[] {
    const affectedGames: string[] = [];
    
    for (const [gameId, playerIds] of gamePlayers.entries()) {
        if (playerIds.has(playerId)) {
            playerIds.delete(playerId);
            affectedGames.push(gameId);
            
            if (playerIds.size === 0) {
                gamePlayers.delete(gameId);
            }
        }
    }
    
    return affectedGames;
}

export function removePlayer(playerId: string): void {
  removePlayerFromAllGames(playerId);
  players.delete(playerId);
}