import mongoose from "mongoose";
import axios from "axios";
import "dotenv/config";

async function seedDatabase() {
  await mongoose.connect(process.env.MONGO_URL);

  const Player = mongoose.model(
    "Player",
    new mongoose.Schema({
      wallets: {
        BTC: { type: Number, default: 0 },
        ETH: { type: Number, default: 0 },
      },
    })
  );

  const Round = mongoose.model(
    "Round",
    new mongoose.Schema({
      start_time: Date,
      status: { type: String, enum: ["waiting", "running", "crashed"] },
      crash_point: Number,
      seed_hash: String,
      server_seed: String,
    })
  );

  const Bet = mongoose.model(
    "Bet",
    new mongoose.Schema({
      player_id: { type: mongoose.Schema.Types.ObjectId, ref: "player" },
      round_id: { type: mongoose.Schema.Types.ObjectId, ref: "round" },
      usd_amount: Number,
      crypto_currency: String,
      crypto_amount: Number,
      cashout_multiplier: Number,
      cashout_crypto_amount: Number,
      status: { type: String, enum: ["placed", "cashed_out", "lost"] },
    })
  );

  const Transaction = mongoose.model(
    "Transaction",
    new mongoose.Schema({
      player_id: { type: mongoose.Schema.Types.ObjectId, ref: "player" },
      usd_amount: Number,
      crypto_amount: Number,
      crypto_currency: String,
      transaction_type: { type: String, enum: ["cashout", "bet"] },
      transaction_hash: String,
      price_at_time: Number,
      timestamp: Date,
    })
  );

  // Fetch current crypto prices
  let cryptoPrices;
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
      {
        headers: { "x-cg-demo-api-key": process.env.COINGECKO_API },
      }
    );
    cryptoPrices = {
      BTC: response.data.bitcoin.usd,
      ETH: response.data.ethereum.usd,
    };
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
    cryptoPrices = { BTC: 60000, ETH: 2000 }; // Fallback prices
  }

  await Player.deleteMany({});
  await Round.deleteMany({});
  await Bet.deleteMany({});
  await Transaction.deleteMany({});

  // Create 3 players with $1000 equivalent, split differently
  const players = [
    { wallets: { BTC: 100 / cryptoPrices.BTC, ETH: 900 / cryptoPrices.ETH } },
    { wallets: { BTC: 400 / cryptoPrices.BTC, ETH: 600 / cryptoPrices.ETH } },
    { wallets: { BTC: 700 / cryptoPrices.BTC, ETH: 300 / cryptoPrices.ETH } },
  ];
  const insertedPlayers = await Player.insertMany(players);

  // Create 2 past rounds
  const rounds = [
    {
      start_time: new Date(Date.now() - 2 * 60 * 1000),
      status: "crashed",
      crash_point: 2.5,
      server_seed: "1f6e07563260fb9f2ab899fd29d703ce",
      seed_hash:
        "df8e2f2e89c7f2406f298d87241e7fad060ba0131907d2c7ce5b26e5173376b2",
    },
    {
      start_time: new Date(Date.now() - 1 * 60 * 1000),
      status: "crashed",
      crash_point: 1.8,
      server_seed: "44baf13341523287b072cd4b586006d1",
      seed_hash:
        "0176c8599ef4402b592c9934320d90834e347487a21971772a51bb23a78111e2",
    },
  ];
  const insertedRounds = await Round.insertMany(rounds);

  const bets = [
    // Round 1: Player 1 cashed out, Player 2 lost
    {
      player_id: insertedPlayers[0]._id,
      round_id: insertedRounds[0]._id,
      usd_amount: 10,
      crypto_currency: "BTC",
      crypto_amount: 10 / cryptoPrices.BTC,
      cashout_multiplier: 2,
      cashout_crypto_amount: (10 / cryptoPrices.BTC) * 2,
      status: "cashed_out",
    },
    {
      player_id: insertedPlayers[1]._id,
      round_id: insertedRounds[0]._id,
      usd_amount: 20,
      crypto_currency: "ETH",
      crypto_amount: 20 / cryptoPrices.ETH,
      status: "lost",
    },
    // Round 2: Player 2 cashed out, Player 3 lost
    {
      player_id: insertedPlayers[1]._id,
      round_id: insertedRounds[1]._id,
      usd_amount: 15,
      crypto_currency: "BTC",
      crypto_amount: 15 / cryptoPrices.BTC,
      cashout_multiplier: 1.5,
      cashout_crypto_amount: (15 / cryptoPrices.BTC) * 1.5,
      status: "cashed_out",
    },
    {
      player_id: insertedPlayers[2]._id,
      round_id: insertedRounds[1]._id,
      usd_amount: 25,
      crypto_currency: "ETH",
      crypto_amount: 25 / cryptoPrices.ETH,
      status: "lost",
    },
  ];
  const insertedBets = await Bet.insertMany(bets);

  // Create corresponding transactions
  const transactions = insertedBets
    .map((bet) => ({
      player_id: bet.player_id,
      usd_amount: bet.usd_amount,
      crypto_amount: bet.crypto_amount,
      crypto_currency: bet.crypto_currency,
      transaction_type: "bet",
      transaction_hash: `tx_${bet._id}`,
      price_at_time: cryptoPrices[bet.crypto_currency],
      timestamp: new Date(),
    }))
    .concat(
      insertedBets
        .filter((bet) => bet.status === "cashed_out")
        .map((bet) => ({
          player_id: bet.player_id,
          usd_amount: bet.usd_amount * bet.cashout_multiplier,
          crypto_amount: bet.cashout_crypto_amount,
          crypto_currency: bet.crypto_currency,
          transaction_type: "cashout",
          transaction_hash: `tx_cashout_${bet._id}`,
          price_at_time: cryptoPrices[bet.crypto_currency],
          timestamp: new Date(),
        }))
    );
  await Transaction.insertMany(transactions);

  console.log(
    "Sample data inserted: 3 players, 2 rounds, 4 bets, transactions"
  );
  await mongoose.disconnect();
}

seedDatabase().catch(console.error);
