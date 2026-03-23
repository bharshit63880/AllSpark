import "dotenv/config";
import { Kafka } from "kafkajs";
import {publishToRedisPubSub} from "./redisPublisher.js";

const KAFKA_INSTANCE_IP = process.env.KAFKA_INSTANCE_IP || "localhost";

const kafka = new Kafka({
  clientId: "fake-consumer",
  brokers: [`${KAFKA_INSTANCE_IP}:9092`],
});


const group = process.argv[2];

async function init() {
  try {

    const consumer = kafka.consumer({ groupId: group });
    await consumer.connect();

    await consumer.subscribe({ topics: ["request"], });

    await consumer.run({
      eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
        console.log(
          `${group}: [${topic}]: PART:${partition}:`,
          message.value.toString()
        );

        const info = JSON.parse(message.value);
        const { data, metadata } = info;
        
        metadata.updatedAt = (new Date()).toISOString();
        
        // Publish the Final Response to the Redis Pub/Sub and Then Redis Pub/Sub & Websocket will handle the delivery of the final result to the respective client
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));

      },
    });
  } catch (error) {
    console.log("Error: ", error);
    console.log("Something went wrong while consuming the Creating event....");
  }
}

init();