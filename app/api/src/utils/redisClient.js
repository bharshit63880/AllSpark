import Redis from "ioredis";

/**
 * Centralized Redis client initialization
 * Manages connection pooling and reconnection logic
 */
// allow connection via a full URL or individual host/port vars
const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || 6379;

let redisClient;
if (REDIS_URL) {
  // ioredis will parse the URL and handle all options itself
  redisClient = new Redis(REDIS_URL);
} else {
  redisClient = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    enableReadyCheck: false,
    enableOfflineQueue: true,
  });
}

redisClient.on("connect", () => {
  console.log("Redis client connected");
});

redisClient.on("error", (err) => {
  console.error("Redis client error:", err);
});

redisClient.on("close", () => {
  console.log("Redis client connection closed");
});

export default redisClient;
