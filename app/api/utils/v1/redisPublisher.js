import { redis } from "../../config/v1/redis.js";


const publishToRedisPubSub = async (channel, message) => {
  try {

    await redis.publish(channel, message);
    console.log("Published %s to %s Via Redis Pub/Sub....", message, channel);

  } catch (error) {
    console.log("Error: ", error);
    console.log("Something went wrong while publishing to the Redis Pub/Sub....");


  }
};


export { publishToRedisPubSub };