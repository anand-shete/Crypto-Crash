import mongoose from "mongoose";

const betSchema = new mongoose.Schema({
  player_id: { type: mongoose.Schema.Types.ObjectId, ref: "player" },
  round_id: { type: mongoose.Schema.Types.ObjectId, ref: "round" },
  usd_amount: Number,
  crypto_currency: String,
  crypto_amount: Number,
  cashout_multiplier: Number,
  cashout_crypto_amount: Number,
  status: { type: String, enum: ["placed", "cashed_out", "lost"] },
});

const Bet = mongoose.model("Bet", betSchema);
export default Bet;
