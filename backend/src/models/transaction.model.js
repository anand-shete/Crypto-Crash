import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  player_id: { type: mongoose.Schema.Types.ObjectId, ref: "player" },
  usd_amount: Number,
  crypto_amount: Number,
  crypto_currency: String,
  transaction_type: { type: String, enum: ["cashout", "bet"] },
  transaction_hash: String,
  price_at_time: Number,
  timestamp: Date,
});

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
