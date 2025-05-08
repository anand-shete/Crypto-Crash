import Redis from "ioredis";

let redis;

try {
  redis = new Redis({
    host: "127.0.0.1",
    port: 6379,
    db: 0,
    connectTimeout: 5000,
  });

  redis.on("connect", () => console.log("Redis connected successfully"));
  redis.on("error", () => console.log("Redis connection error", error));
} catch (error) {
  console.log("Failed to initalize Redis: ", error);
}

export default redis;
