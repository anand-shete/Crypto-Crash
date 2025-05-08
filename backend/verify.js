import crypto from "crypto";

const generateCrashPoint = () => {
  const serverSeed = "44baf13341523287b072cd4b586006d1";
  const hash = crypto.createHash("sha256").update(serverSeed).digest("hex");

  return {
    serverSeed,
    seedHash: hash,
  };
};
const res = generateCrashPoint();
console.log(res);

// 0176c8599ef4402b592c9934320d90834e347487a21971772a51bb23a78111e2