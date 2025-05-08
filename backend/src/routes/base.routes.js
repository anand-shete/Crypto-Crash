import { Router } from "express";
import { Bet, Player, Round, Transaction } from "../models/index.js";
import { getPriceFromCache } from "../utils/cryptoPrices.js";
import crypto from "crypto";

const router = Router();

router.get("/", (req, res) => {
  return res.status(200).json({ message: "API Healthcheck Passed" });
});

router.post("/create-player", async (req, res) => {
  try {
    const { usd, btc_split } = req.body;
    const { BTC, ETH } = await getPriceFromCache();

    if (!BTC || !ETH)
      return res.status(503).json({ message: "Error fetching Live Prices" });

    const safe_btc_split = Math.max(0, Math.min(1, btc_split));
    const eth_split = 1 - safe_btc_split;

    const player = await Player.create({
      wallets: {
        BTC: (usd * safe_btc_split) / BTC,
        ETH: (usd * eth_split) / ETH,
      },
    });
    return res.json({ playerId: player._id });
  } catch (error) {
    // console.error("Error creating player:", error);
    return res.status(500).json({ error: "Could not create player" });
  }
});

router.get("/verify/:playerId", async (req, res) => {
  try {
    const playerId = req.params?.playerId;
    if (!playerId) return res.status(404).json({ message: "Params not found" });

    const player = await Player.findById(playerId);
    if (!player)
      return res.status(404).json({ message: "Player Doesn't Exists" });

    return res.status(200).json({ message: "Player Exists", player });
  } catch (error) {
    // console.log("error getting player", error);
    return res.status(500).json({ message: "Player Doesn't Exists" });
  }
});

// Get the balance of a given player
router.get("/balance/:player_id", async (req, res) => {
  try {
    const player = await Player.findById(req.params.player_id);
    if (!player) return res.status(404).json({ error: "Player not found" });

    const balances = {};

    const cryptoPrices = await getPriceFromCache();
    for (const [crypto, amount] of Object.entries(player.wallets)) {
      balances[crypto] = {
        crypto: amount,
        usd: amount * cryptoPrices[crypto],
      };
    }
    return res.json(balances);
  } catch (error) {
    // console.log("error getting player balance", error);
    return res.status(500).json({ message: "Error Fetching Player's balance" });
  }
});

// User makes a bet
router.post("/bet", async (req, res) => {
  const { player_id, usd_amount, crypto_currency, start_time } = req.body;

  if (!["BTC", "ETH"].includes(crypto_currency))
    return res.status(400).json({ error: "Invalid cryptocurrency" });

  if (usd_amount <= 0)
    return res.status(400).json({ error: "Invalid bet amount" });

  const cryptoPrices = await getPriceFromCache();
  const price = cryptoPrices[crypto_currency];
  if (!price)
    return res.status(503).json({ error: "Crypto prices unavailable" });

  const cryptoAmount = usd_amount / price;
  const player = await Player.findById(player_id);
  if (!player) return res.status(404).json({ error: "Player not found" });

  if (player.wallets[crypto_currency] < cryptoAmount)
    return res.status(400).json({ error: "Insufficient balance" });

  const round = await Round.findOne({ start_time: new Date(start_time) });
  if (!round) return res.status(400).json({ error: "Round Doesn't Exists" });

  await Player.updateOne(
    { _id: player_id },
    { $inc: { [`wallets.${crypto_currency}`]: -cryptoAmount } }
  );

  const bet = await Bet.create({
    player_id,
    round_id: round._id,
    usd_amount,
    crypto_currency,
    crypto_amount: cryptoAmount,
    status: "placed",
  });

  const txHash = crypto.randomBytes(32).toString("hex");
  const transaction = await Transaction.create({
    player_id,
    usd_amount,
    crypto_amount: cryptoAmount,
    crypto_currency,
    transaction_type: "bet",
    transaction_hash: txHash,
    price_at_time: price,
    timestamp: new Date(),
  });
  // console.log("Bet placed: ", bet);
  return res.json({ message: "Bet placed", bet_id: bet._id });
});

//
router.get("/verify_crash/:round_id", async (req, res) => {
  const round = await Round.findById(req.params.round_id);
  if (!round) return res.status(404).json({ error: "Round not found" });
  res.json({
    round_id: round._id,
    crash_point: round.crash_point,
    server_seed: round.server_seed,
    seed_hash: round.seed_hash,
  });
});

export default router;
