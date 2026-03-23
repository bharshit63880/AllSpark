import { redis as redisClient } from "../../config/v1/redis.js";

const publishToRedisPubSub = async (channel, message) => {
  try {
    await redisClient.publish(channel, message);
    console.log("Published to %s via Redis Pub/Sub....", channel);
  } catch (error) {
    console.log("Error: ", error);
    console.log("Something went wrong while publishing to the Redis Pub/Sub....");
  }
};

export { publishToRedisPubSub };
