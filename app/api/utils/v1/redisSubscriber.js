import { redis } from "../../config/v1/redis.js";


const createRedisPubSubSubscribers = (channels, onMessage) => {
    try {
        const subscriber = redis.duplicate();

        subscriber.subscribe(...channels, (err, count) => {
            if (err) {
                console.log("Error: ", err);
                console.log("Something went wrong while subscribing channels to the Redis Pub/Sub....");

            } else {
                console.log(`Successfully subscribed to ${count} channels via Redis Pub/Sub: `, channels);
            }
        });

        subscriber.on("message", (channel, message) => {
            onMessage(channel, message);
        });

    } catch (error) {
        console.log("Error: ", error);
        console.log("Something went wrong while subscribing to the Redis Pub/Sub....");

    }
};


export { createRedisPubSubSubscribers };