import Redis from "ioredis";

const REDIS_URL = String(process.env.REDIS_URL || "redis://redis:6379").trim();

console.log("[redisCacheManager] Using REDIS_URL =", REDIS_URL);

const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: false,
  reconnectOnError: () => true,
});

redisClient.on("connect", () => {
  console.log("[redisCacheManager] Redis connected");
});

redisClient.on("ready", () => {
  console.log("[redisCacheManager] Redis ready");
});

redisClient.on("error", (err) => {
  console.error("[redisCacheManager] Redis error:", err.message);
});

redisClient.on("close", () => {
  console.warn("[redisCacheManager] Redis disconnected");
});

const DEFAULT_TTL_SECONDS = Number(process.env.REDIS_CACHE_TTL_SECONDS || 300);

const buildKey = (key) => String(key || "").trim();

const getFromCache = async (key) => {
  try {
    const cacheKey = buildKey(key);
    if (!cacheKey) return null;

    const value = await redisClient.get(cacheKey);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error("[redisCacheManager] getFromCache error:", error.message);
    return null;
  }
};

const setToCache = async (key, value, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  try {
    const cacheKey = buildKey(key);
    if (!cacheKey) return false;

    const serializedValue =
      typeof value === "string" ? value : JSON.stringify(value);

    if (ttlSeconds && Number(ttlSeconds) > 0) {
      await redisClient.set(cacheKey, serializedValue, "EX", Number(ttlSeconds));
    } else {
      await redisClient.set(cacheKey, serializedValue);
    }

    return true;
  } catch (error) {
    console.error("[redisCacheManager] setToCache error:", error.message);
    return false;
  }
};

const deleteFromCache = async (key) => {
  try {
    const cacheKey = buildKey(key);
    if (!cacheKey) return false;

    await redisClient.del(cacheKey);
    return true;
  } catch (error) {
    console.error("[redisCacheManager] deleteFromCache error:", error.message);
    return false;
  }
};

const publishToChannel = async (channel, message) => {
  try {
    const channelName = String(channel || "").trim();
    if (!channelName) return false;

    await redisClient.publish(channelName, typeof message === "string" ? message : JSON.stringify(message));
    return true;
  } catch (error) {
    console.error("[redisCacheManager] publishToChannel error:", error.message);
    return false;
  }
};

export {
  redisClient,
  getFromCache,
  setToCache,
  deleteFromCache,
  publishToChannel,
};
