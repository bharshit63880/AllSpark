import { redis as redisClient } from "../../config/v1/redis.js";

/**
 * Publish event to Redis Pub/Sub channel
 */
const publishToRedisPubSub = async (channel, message) => {
  try {
    await redisClient.publish(channel, message);
    console.log(`[Redis Pub/Sub] Published to ${channel}`);
  } catch (error) {
    console.error(`[Redis Pub/Sub] Error publishing to ${channel}:`, error.message);
    throw error;
  }
};

export { publishToRedisPubSub };
