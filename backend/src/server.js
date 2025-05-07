import http from "http";
import { Server } from "socket.io";
import express from "express";
import connectDB from "./config/db.js";
import { getPriceFromCache } from "./utils/cryptoPrices.js";
import { Bet, Player, Round, Transaction } from "./models/index.js";
import baseRouter from "./routes/base.routes.js";
import { createRound } from "./utils/createRound.js";
import cors from "cors";
import crypto from "crypto";

const PORT = process.env.PORT || 3000;
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  })
);
app.use(express.json());
app.use("/", baseRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
await connectDB();

const m = 0.1;
let currentRound = null;

// constantly check for client data and update it every 100ms
setInterval(async () => {
  const now = Date.now();
  if (!currentRound || currentRound.status === "crashed") {
    currentRound = await createRound();
    // console.log("round_create", currentRound);
    io.emit("round_create", {
      round_id: currentRound._id,
      start_time: currentRound.start_time,
      seed_hash: currentRound.seed_hash,
    });
  }
  // take bets
  if (currentRound.status === "waiting" && now >= currentRound.start_time) {
    currentRound.status = "running";
    await currentRound.save();
    // console.log("round_start: ", currentRound);
    io.emit("round_start", { round_id: currentRound._id });
  }

  if (currentRound.status === "running") {
    const timePassed = (now - currentRound.start_time) / 1000;
    const multiplier = Math.exp(m * timePassed);

    io.emit("multiplier_update", {
      multiplier,
      round_id: currentRound._id,
    });

    if (multiplier >= currentRound.crash_point) {
      currentRound.status = "crashed";
      await currentRound.save();

      io.emit("round_crash", {
        round_id: currentRound._id,
        crash_point: currentRound.crash_point,
        server_seed: currentRound.server_seed,
      });

      await Bet.updateMany(
        { round_id: currentRound._id, status: "placed" }, // those who didnt cashed_out, all lost
        { status: "lost" }
      );
    }
  }
}, 100); // There will always be some error in the crash_point

const processCashOut = async (playerId, roundId) => {
  const player = await Player.findById(playerId).lean();
  if (!player) return;

  const round = await Round.findById(roundId).lean();
  if (!round || round.status !== "running") return;
  // console.log("playerId", playerId);
  // console.log("roundId", roundId);

  const bet = await Bet.findOne({
    player_id: playerId,
    round_id: roundId,
    status: "placed",
  });
  if (!bet) return;

  const now = Date.now();
  const timePassed = (now - round.start_time) / 1000;
  const multiplier = Math.exp(m * timePassed);
  if (multiplier >= round.crash_point) return;

  const payout = bet.crypto_amount * multiplier;
  await Player.updateOne(
    {
      _id: playerId,
    },
    {
      $inc: { [`wallets.${bet.crypto_currency}`]: payout },
    }
  );
  const playerBalance = await Player.findById(playerId);
  if (!playerBalance) return;

  const balances = {};
  const cryptoPrices = await getPriceFromCache();
  for (const [crypto, amount] of Object.entries(player.wallets)) {
    balances[crypto] = {
      crypto: amount,
      usd: amount * cryptoPrices[crypto],
    };
  }

  await Bet.updateOne(
    {
      player_id: playerId,
      round_id: roundId,
      status: "placed",
    },
    {
      $set: {
        cashout_multiplier: multiplier,
        cashout_crypto_amount: payout,
        status: "cashed_out",
      },
    }
  );

  const price = cryptoPrices[bet.crypto_currency]; // fetched from the live api
  const usdPayout = price * payout;

  await Transaction.create({
    player_id: playerId,
    crypto_amount: payout,
    usd_amount: usdPayout,
    crypto_currency: bet.crypto_currency,
    transaction_type: "cashout",
    transaction_hash: crypto.randomBytes(32).toString("hex"),
    price_at_time: price,
    timestamp: new Date(),
  });

  // console.log("player_cashout done", usdPayout);
  io.emit("player_cashout", {
    player_id: playerId,
    crypto_payout: payout,
    usd_payout: usdPayout,
    balances: balances,
  });
};

io.on("connection", (socket) => {
  socket.emit("welcome", { start_time: currentRound?.start_time });

  socket.on("cashout", async ({ player_id, round_id }) => {
    await processCashOut(player_id, round_id);
  });
});

server.listen(PORT, () =>
  console.log(`Server listening at http://localhost:${PORT}`)
);
