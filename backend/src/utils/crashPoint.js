import crypto from "crypto";

export const generateCrashPoint = () => {
  const serverSeed = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256").update(serverSeed).digest("hex");

  const seedHash = crypto.createHash("sha256").update(serverSeed).digest("hex");
  const r = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
  const crashPoint = Math.min(100, 1 / (1 - r));
  return {
    crashPoint,
    serverSeed, // show at round end
    seedHash, // show at round start
  };
};
