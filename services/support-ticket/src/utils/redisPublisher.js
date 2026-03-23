import { redis } from "../../config/v1/redis.js";

const publishToRedisPubSub = async (channel, message) => {
  try {
    await redis.publish(channel, message);
  } catch (error) {
    console.log("Something went wrong while publishing to Redis Pub/Sub....", error);
  }
};

export { publishToRedisPubSub };
