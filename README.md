# Live Quiz Game - WebSocket Server
Real-time multiplayer quiz game backend with WebSocket support. Players can join games, answer questions in real-time, and compete for points based on answer speed.
## Tech Stack
- Node.js 24.x
- TypeScript
- WebSocket (ws library)
- In-memory storage
- React frontend (provided in template)
## Getting Started
### Prerequisites
- Node.js 24.10.0 or higher
- npm
### Installation
```bash
git clone <your-repository>
cd live-quiz-game-template
npm run install:all
```
### Running the Application

```bash
# Development mode (both client and server with hot reload)
npm run dev
# Production mode
npm run build
npm start
```

After running, the application will be available at:

- Client: `http://localhost:5173`
    
- WebSocket Server: `ws://localhost:3000
    

### Running Only Server or Client

```bash
# Server only
npm run start:server
# Client only
npm run start:client
```
## Features

### Core Functionality

- ✅ **Player Registration/Login** — Users can register with a name and password
    
- ✅ **Game Creation** — Host creates a quiz with questions (4 options each, time limit per question)
    
- ✅ **Room Code Generation** — 6-character alphanumeric code for each game
    
- ✅ **Join Game** — Players join using the room code
    
- ✅ **Game Start** — Only the host can start the game
    
- ✅ **Real-time Questions** — Questions broadcast to all players without the correct answer
    
- ✅ **Answer Submission** — Players submit answers within time limit
    
- ✅ **Speed-based Scoring** — `1000 × (timeRemaining / timeLimit)` points for correct answers
    
- ✅ **Server-side Timer** — Questions auto-complete when time expires
    
- ✅ **Question Results** — Broadcast with correct answer and per-player results
    
- ✅ **Final Scoreboard** — Ranks players by final score
    
- ✅ **Disconnect Handling** — Players removed from game, remaining players get updated list
    

## WebSocket Commands

All messages must have `"id": 0`.

### Register / Login
```json
{
  "type": "reg",
  "data": { "name": "Alice", "password": "123" },
  "id": 0
}
```
Response:
```json
{
  "type": "reg",
  "data": { "name": "Alice", "index": "123456789_abc123", "error": false, "errorText": "" },
  "id": 0
}
```
### Create Game
```json
{
  "type": "create_game",
  "data": {
    "questions": [
      {
        "text": "What is 2 + 2?",
        "options": ["3", "4", "5", "6"],
        "correctIndex": 1,
        "timeLimitSec": 10
      }
    ]
  },
  "id": 0
}
```

Response:
```json
{
  "type": "game_created",
  "data": { "gameId": "game_123", "code": "ABC123" },
  "id": 0
}
```
### Join Game
```json
{
  "type": "join_game",
  "data": { "code": "ABC123" },
  "id": 0
}
```
### Start Game
```json
{
  "type": "start_game",
  "data": { "gameId": "game_123" },
  "id": 0
}
```

### Submit Answer
```json
{
  "type": "answer",
  "data": { "gameId": "game_123", "questionIndex": 0, "answerIndex": 2 },
  "id": 0
}
```

## Known Limitations

### Client Message Handling

The client application may not always process messages in time when receiving multiple rapid messages (e.g., `question_result` followed by `game_finished`). This is a client-side limitation and does not affect server functionality.

### Duplicate Join Requests

Clicking "Join Game" multiple times may send duplicate requests. The server handles this by checking if the player is already in the game and returns an appropriate error. Please avoid double-clicking the join button.

## Running on Local Network

To play with multiple devices on the same Wi-Fi network:

1. **Find your local IP address:**
    
    - Windows: `ipconfig`
        
    - Mac/Linux: `ifconfig` or `ip addr`
        
2. **Update client environment variables** (create `client/.env` file):
    

```env
VITE_WS_URL=ws://255.255.255.0:3000
VITE_API_URL=http://255.255.255.0:5173
```

Replace `255.255.255.0` with your actual IP address.

3. **Start the application:**
```bash
npm run dev
```

4. **Access the game** from other devices using your IP address:
    
    - Open browser at `http://192.168.1.103:5173`
        

## Project Structure

```text
live-quiz-game-template/
├── client/                 # React frontend (provided)
│   ├── src/
│   └── package.json
├── server/                 # WebSocket server
│   ├── src/
│   │   ├── index.ts        # Entry point
│   │   ├── server.ts       # WebSocket server setup
│   │   ├── storage/
│   │   │   ├── games.ts    # Games storage
│   │   │   ├── players.ts  # Players storage
│   │   │   └── users.ts    # Users storage
│   │   ├── handlers/
│   │   │   ├── message-handler.ts # Message dispatcher
│   │   │   ├── reg-handler.ts     # Registration handler
│   │   │   ├── game-handler.ts    # Game management handlers
│   │   │   └── question-handler.ts # Question flow handlers
│   │   ├── utils/
│   │   │   ├── broadcast.ts       # Message broadcasting
│   │   │   ├── code-generator.ts  # Room code generation
│   │   │   ├── score-calculator.ts # Points calculation
│   │   │   ├── timer-handler.ts   # Timer management
│   │   │   └── consts.ts          # Constants
│   │   └── types.ts        # TypeScript interfaces
│   └── package.json
├── package.json            # Root package.json with workspaces
└── README.md
```

## Scoring Formula

Points for a correct answer:

```javascript
points = floor(1000 × (timeRemaining / timeLimit))
```

- Maximum: 1000 points (instant answer)
    
- Minimum: 0 points (wrong or no answer)
   
## Game Flow

1. **Host** registers and creates a game with questions
    
2. Server generates a 6-character room code
    
3. **Players** join using the room code
    
4. **Host** starts the game
    
5. Server broadcasts first question (no correct answer)
    
6. **Players** submit answers within time limit
    
7. Server calculates points based on answer speed
    
8. Server broadcasts question results with correct answer
    
9. Repeat steps 5-8 for each question
    
10. After last question, server broadcasts final scoreboard with ranks
    

## Error Handling

The server validates all incoming messages and returns appropriate error responses:

```json
{
  "type": "error",
  "data": { "error": true, "errorText": "Error description" },
  "id": 0
}
```

### Common errors:

- `Name is required` / `Password is required`
    
- `Player with this name already exists`
    
- `Invalid password`
    
- `Game not found`
    
- `Already in this game`
    
- `Only host can start the game`
    
- `Time is up` / `Already answered this question`
    

## License

ISC