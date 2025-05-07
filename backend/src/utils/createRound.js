import mongoose from "mongoose";
import { Round } from "../models/index.js";
import { generateCrashPoint } from "./crashPoint.js";

export const createRound = async () => {
  const roundId = new mongoose.Types.ObjectId();
  const { crashPoint, serverSeed, seedHash } = generateCrashPoint(roundId);

  return await Round.create({
    start_time: new Date(Date.now() + 10000),
    status: "waiting",
    crash_point: crashPoint,
    seed_hash: seedHash,
    server_seed: serverSeed,
  });
};
