import crypto from "crypto";

const generateCrashPoint = () => {
  const serverSeed = "";
  const hash = crypto.createHash("sha256").update(serverSeed).digest("hex");

  return {
    serverSeed,
    seedHash: hash,
  };
};
const res = generateCrashPoint();
console.log(res);

// 3dea986a52ca6017dd24acb0d5b7f2fd1e5554824566ff34689beef42f9dd035
