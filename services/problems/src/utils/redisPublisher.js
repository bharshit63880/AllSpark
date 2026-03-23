import { redisClient } from "./redisCacheManager.js";

/**
 * Publish event to Redis Pub/Sub channel
 * Used for sending responses back to clients via WebSocket
 */
const publishToRedisPubSub = async (channel, message) => {
  try {
    console.log(`[Redis Pub/Sub] Publishing to channel: ${channel}`);
    await redisClient.publish(channel, message);
    console.log(`[Redis Pub/Sub] Successfully published to ${channel}`);
  } catch (error) {
    console.error(`[Redis Pub/Sub] Error publishing to ${channel}:`, error.message);
    throw error;
  }
};

export { publishToRedisPubSub };
