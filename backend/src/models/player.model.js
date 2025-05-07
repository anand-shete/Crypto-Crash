import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  wallets: {
    BTC: { type: Number, default: 0 },
    ETH: { type: Number, default: 0 },
  },
});

const Player = mongoose.model("Player", playerSchema);
export default Player;
