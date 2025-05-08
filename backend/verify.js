import crypto from "crypto";

const generateCrashPoint = () => {
  const serverSeed = "e7e01b1d7f06ae94c807d0ebe91d5024  ";
  const hash = crypto.createHash("sha256").update(serverSeed).digest("hex");

  return {
    serverSeed,
    seedHash: hash,
  };
};
const res = generateCrashPoint();
console.log(res);

// 1691cde91d007c70347d1d629b5df45ee17e09fb0bfe5744ad64f06572ba7e50