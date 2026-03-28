export const GAME_STATUSES = {
    WAITING: 'waiting',
    IN_PROGRESS: 'in_progress',
    FINISHED: 'finished',
} as const;

export const INCOMING_MESSAGES = {
    REG: 'reg',
    CREATE_GAME: 'create_game',
    JOIN_GAME: 'join_game',
    START_GAME: 'start_game',
    ANSWER: 'answer',
} as const;

export const OUTGOING_MESSAGES = {
    REG: 'reg',
    GAME_CREATED: 'game_created',
    GAME_JOINED: 'game_joined',
    PLAYER_JOINED: 'player_joined',
    UPDATE_PLAYERS: 'update_players',
    QUESTION: 'question',
    ANSWER_ACCEPTED: 'answer_accepted',
    QUESTION_RESULT: 'question_result',
    GAME_FINISHED: 'game_finished',
    ERROR: 'error'
} as const;

