import Redis from "ioredis";

const REDIS_URL =
  process.env.REDIS_URL ||
  (process.env.REDIS_HOST
    ? `${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
    : "redis:6379");

const redis = new Redis(REDIS_URL);

export { redis };
