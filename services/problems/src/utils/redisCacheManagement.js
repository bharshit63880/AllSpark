import { redisClient } from "./redisCacheManager.js";

/**
 * Get value from cache
 * Returns object with isValueFound and value properties
 */
const getFromCache = async (key) => {
  let isValueFound = false;
  let value;
  try {
    const result = await redisClient.get(key);
    if (result) {
      value = JSON.parse(result);
      isValueFound = true;
    }
    return { isValueFound, value };
  } catch (error) {
    console.error(`[Cache] Error getting ${key}:`, error.message);
    return { isValueFound, value };
  }
};

/**
 * Set value in cache with TTL
 */
const setToCache = async (key, value, ttl) => {
  try {
    await redisClient.set(key, JSON.stringify(value), "EX", ttl);
    return true;
  } catch (error) {
    console.error(`[Cache] Error setting ${key}:`, error.message);
    return false;
  }
};

/**
 * Delete value from cache
 */
const deleteFromCache = async (key) => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`[Cache] Error deleting ${key}:`, error.message);
    return false;
  }
};

export { getFromCache, setToCache, deleteFromCache };
