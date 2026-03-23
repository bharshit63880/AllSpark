import Redis from "ioredis";

const REDIS_URL = String(process.env.REDIS_URL || "redis://redis:6379").trim();

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: false,
  reconnectOnError: () => true,
});

redis.on("connect", () => {
  console.log("[Redis] Connected successfully:", REDIS_URL);
});

redis.on("ready", () => {
  console.log("[Redis] Ready");
});

redis.on("error", (err) => {
  console.error("[Redis] Error:", err.message);
});

redis.on("close", () => {
  console.warn("[Redis] Connection closed");
});

export { redis };
