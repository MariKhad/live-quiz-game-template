import type { WebSocket } from 'ws';
import { GAME_STATUSES, INCOMING_MESSAGES, OUTGOING_MESSAGES } from './utils/consts';

export interface Player {
  name: string;
  index: string;
  score: number;
  ws?: WebSocket;
  hasAnswered?: boolean;
  answerTime?: number;
  answeredCorrectly?: boolean;
}

export interface Question {
  text: string;
  options: string[];
  correctIndex: number;
  timeLimitSec: number;
}

export interface Game {
  id: string;
  code: string;
  hostId: string;
  questions: Question[];
  players: Player[];
  currentQuestion: number;
  status: GameStatus;
  questionStartTime?: number;
  questionTimer?: NodeJS.Timeout;
  playerAnswers: Map<string, { answerIndex: number; timestamp: number }>;
}

export interface User {
  name: string;
  password: string;
  index: string;
  ws?: WebSocket;
}

export interface WSMessage {
  type: OutgoingMessageType | IncomingMessageType;
  data: RegData | CreateGameData | JoinGameData | StartGameData | AnswerData | any;
  id: 0;
}

export interface RegData {
  name: string;
  password: string;
}

export interface CreateGameData {
  questions: Question[];
}

export interface JoinGameData {
  code: string;
}

export interface StartGameData {
  gameId: string;
}

export interface AnswerData {
  gameId: string;
  questionIndex: number;
  answerIndex: number;
}

export type IncomingMessageType = typeof INCOMING_MESSAGES[keyof typeof INCOMING_MESSAGES];
export type OutgoingMessageType = typeof OUTGOING_MESSAGES[keyof typeof OUTGOING_MESSAGES];
export type GameStatus = typeof GAME_STATUSES[keyof typeof GAME_STATUSES];
