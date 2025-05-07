import mongoose from "mongoose";

const roundSchema = new mongoose.Schema({
  start_time: Date,
  status: { type: String, enum: ["waiting", "running", "crashed"] },
  crash_point: Number,
  seed_hash: String,
  server_seed: String,
});

const Round = mongoose.model("Round", roundSchema);
export default Round;
