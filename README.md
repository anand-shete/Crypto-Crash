# 💥 Crypto Crash

Crypto Crash is a real-time betting game where players wager USD amounts converted to BTC or ETH, aiming to cash out before a randomly determined crash point. Built with a modern tech stack, it features a provably fair algorithm, live cryptocurrency prices, and WebSocket-driven multiplayer updates.

## 🌐 Webpage Demo

Check out the demo of the frontend page below:

![Demo](https://i.imgur.com/Pt5Xq5b.png)

## ✨ Features

- **Real-Time Gameplay**: Lightning-fast rounds with live multiplier updates via WebSocket, keeping players on edge.
- **Provably Fair**: Cryptographically secure crash points ensure transparency, verifiable by players.
- **Live Crypto Prices**: Seamless USD-to-BTC/ETH conversions using CoinGecko, cached smartly every 10 seconds for performance.
- **Event Logs**: Detailed logs of each event such as Starting of New Round, Displaying the secure hash keys for verification.
- **Robust Backend**: MongoDB powers persistent storage of players, bets, and rounds, with Redis for ultra-fast price access.
- **Multiplayer Magic**: Cashout notifications broadcast instantly to all players, creating a dynamic, competitive vibe.

## 📬 Postman Collection

To import the Postman collection and start interacting with the API endpoints:

1. Open **Postman** and click on **Import**.
2. Download the Postman collection file from the project:
   - [Download Postman Collection JSON](./backend/postman.json)
3. Select the **Upload Files** option and choose the downloaded collection JSON file.
4. After importing, you can now interact with all the API endpoints.

## 🛠️ Installation Steps

### Prerequisites

- Node.js (v20+) - Download from [Node](https://nodejs.org/en/download).
- MongoDB (local instance).
- Redis (local or hosted) - For [Windows](https://redis.io/docs/latest/operate/oss_and_stack/install/archive/install-redis/install-redis-on-windows/) and for Mac/Linux click [here](https://redis.io/docs/latest/operate/oss_and_stack/install/install-stack/).
- CoinGecko API - Please get your key from [here](https://docs.coingecko.com/reference/setting-up-your-api-key).

### Local Development

1. Clone the Repository:

```bash
git clone https://github.com/anand-shete/Crypto-Crash
cd Crypto-Crash
```

2. Install dependencies  
   For `backend` directory:

```bash
cd backend
npm install
```

For `frontend` directory:

```bash
cd ../frontend
npm install
```

3. Ensure Redis is running (default at `redis://localhost:6379`)

4. Add the environment variables  
   In the `backend` directory, rename the `.env.example` to `.env` and add:

```bash
PORT=3000
MONGO_URL=mongodb://localhost:27017/crypto-crash
COINGECKO_API=your_COINGECKO_API
```

5. Start the frontend and backend

```
cd ../backend
npm run start       # To start the backend server

cd ../frontend
npm run dev         # To start the frontend
```

6. Go to `http://localhost:5173` and you should see this:  
   ![Demo](https://i.imgur.com/Pt5Xq5b.png)

### Sample Data Set

To populate the database with test data (3 players, 2 past rounds):

1. Run the seed script in `backend` directory:

```
node seed.js
```

2. Creates:

- **Players** (each with \$1000 equivalent, split differently):  
  Player 1: \$100 BTC, \$900 ETH  
  Player 2: \$400 BTC, \$600 ETH  
  Player 3: \$700 BTC, \$300 ETH  
  Balances use CoinGecko prices at runtime (e.g., \$1000 ≈ 0.016667 BTC at \$60,000/BTC).
- **Rounds**: 2 past rounds with sample bets (e.g., \$10 bets, some cashed out at 2x, some lost).

## 🎮 Game Mechanics

- Rounds: Start 10 seconds after a crash, with a waiting phase for bets.
- Multiplier: Grows exponentially (e^(0.1 \* time)), crashes at a provably fair point.
- Betting: Players bet in USD, converted to BTC/ETH using CoinGecko prices cached every 10 seconds (via Redis).
- Cashout: Players can cash out during the running phase, receiving crypto payouts (displayed as USD in UI).
- Provably Fair: Crash point derived from a hashed server seed, verifiable via /verify_crash. You can also use the verify.js

## 🧪 Testing

**API**: Use Postman to test endpoints:

- Healthcheck: GET `/`
- Create a player: POST `/create-player`
- Verfify Player: GET `/verify/:playerId`
- Check balance: GET `/balance/:player_id`
- Place bet: POST `/bet`
- Verify crash: GET `/verify_crash/:round_id`

**WebSocket**: Use the frontend to interact with game events (bet, cashout, see multiplier updates).

## Further Improvements

- Containerize the entire application using Docker
