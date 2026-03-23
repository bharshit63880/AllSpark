import { redisClient } from "./redisCacheManager.js";

const publishToRedisPubSub = async (channel, message) => {
    try {
        const payload = typeof message === "string" ? message : JSON.stringify(message);
        await redisClient.publish(channel, payload);
    } catch (error) {
        console.error("Error publishing to Redis PubSub:", error);
    }
};

export { publishToRedisPubSub };
