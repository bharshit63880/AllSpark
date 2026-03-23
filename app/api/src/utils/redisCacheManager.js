import redisClient from "./redisClient.js";

/**
 * Centralized Redis cache management
 * Provides a consistent interface for all cache operations
 */

const DEFAULT_TTL = 3600; // 1 hour default TTL

/**
 * Get value from cache
 * @param {string} key
 * @returns {Promise<any>}
 */
const getFromCache = async (key) => {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error retrieving cache for key ${key}:`, error);
    return null;
  }
};

/**
 * Set value in cache
 * @param {string} key
 * @param {any} value
 * @param {number} ttl - Time to live in seconds
 */
const setInCache = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    const serialized = JSON.stringify(value);
    await redisClient.setex(key, ttl, serialized);
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
  }
};

/**
 * Delete value from cache
 * @param {string} key
 */
const deleteFromCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error(`Error deleting cache for key ${key}:`, error);
  }
};

/**
 * Clear all cache keys matching a pattern
 * @param {string} pattern - Redis pattern (e.g., "user:*")
 */
const clearCachePattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    console.error(`Error clearing cache pattern ${pattern}:`, error);
  }
};

/**
 * Publish message to Redis channel
 * @param {string} channel
 * @param {any} message
 */
const publishToChannel = async (channel, message) => {
  try {
    const serialized = JSON.stringify(message);
    await redisClient.publish(channel, serialized);
  } catch (error) {
    console.error(`Error publishing to channel ${channel}:`, error);
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
