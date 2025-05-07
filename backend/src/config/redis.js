import Redis from "ioredis";

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
  db: 0,
  connectTimeout: 5000,
});

export default redis;
