import { User } from '../types.js';
import { WebSocket } from 'ws';

export const users = new Map<string, User>();

export function saveUser(user: User): void {
    users.set(user.index, user);
}

export function getUser(index: string): User | undefined {
    return users.get(index);
}

export function getUserByName(name: string): User | undefined {
    for (const user of users.values()) {
        if (user.name === name) {
            return user;
        }
    }
    return undefined;
}

export function getUserByWs(ws: WebSocket): User | undefined {
    for (const user of users.values()) {
        if (user.ws === ws) {
            return user;
        }
    }
    return undefined;
}

export function updateUserWebSocket(index: string, ws: WebSocket): void {
    const user = users.get(index);
    if (user) {
        user.ws = ws;
    }
}

export function getAllUsers(): User[] {
    return Array.from(users.values());
}

export function clearUsers(): void {
    users.clear();
}