import Redis from "ioredis";

/**
 * Centralized Redis cache management
 * Provides consistent interface for all cache operations
 */

const REDIS_HOST = process.env.REDIS_HOST || "redis";
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableReadyCheck: false,
  enableOfflineQueue: true,
});

redisClient.on("connect", () => console.log("Redis connected"));
redisClient.on("error", (err) => console.error("Redis error:", err));
redisClient.on("close", () => console.log("Redis disconnected"));

const DEFAULT_TTL = 3600;

/**
 * Get value from cache
 */
const getFromCache = async (key) => {
  try {
    const value = await redisClient.get(key);
    if (value == null) {
      return { isValueFound: false, value: null };
    }
    return { isValueFound: true, value: JSON.parse(value) };
  } catch (error) {
    console.error(`Cache get error for ${key}:`, error);
    return { isValueFound: false, value: null };
  }
};

/**
 * Set value in cache
 */
const setInCache = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    const serialized = JSON.stringify(value);
    await redisClient.setex(key, ttl, serialized);
  } catch (error) {
    console.error(`Cache set error for ${key}:`, error);
  }
};

/**
 * Delete from cache
 */
const deleteFromCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error(`Cache delete error for ${key}:`, error);
  }
};

/**
 * Clear cache pattern
 */
const clearCachePattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(...keys);
  } catch (error) {
    console.error(`Cache clear pattern error for ${pattern}:`, error);
  }
};

/**
 * Publish to channel
 */
const publishToChannel = async (channel, message) => {
  try {
    const serialized = JSON.stringify(message);
    await redisClient.publish(channel, serialized);
  } catch (error) {
    console.error(`Publish error for ${channel}:`, error);
  }
};

export {
  getFromCache,
  setInCache,
  deleteFromCache,
  clearCachePattern,
  publishToChannel,
  redisClient,
};
