export const BASE_POINTS = 1000;

export function calculatePoints(timeRemainingMs: number, timeLimitSec: number): number {
    const timeLimitMs = timeLimitSec * 1000;
    if (timeRemainingMs <= 0) return 0;
    
    const remaining = Math.min(timeRemainingMs, timeLimitMs);
    
    return Math.floor(BASE_POINTS * (remaining / timeLimitMs));
}

export function calculatePointsByAnswerTime(answerTimeMs: number, timeLimitSec: number): number {
    const timeLimitMs = timeLimitSec * 1000;
    const timeRemaining = Math.max(0, timeLimitMs - answerTimeMs);
    
    return calculatePoints(timeRemaining, timeLimitSec);
}