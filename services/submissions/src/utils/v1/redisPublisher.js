import { redis as redisClient } from "../../../config/v1/redis.js";

/**
 * Publish message to Redis Pub/Sub channel
 * @param {string} channel - The channel name
 * @param {string} message - The message to publish (usually stringified JSON)
 */
const publishToRedisPubSub = async (channel, message) => {
  try {
    await redisClient.publish(channel, message);
    console.log(`Published to Redis channel [${channel}]: ${message}`);
  } catch (error) {
    console.error(`Error publishing to Redis channel [${channel}]:`, error);
    throw error;
  }
};

export { publishToRedisPubSub };
