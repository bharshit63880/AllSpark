import "dotenv/config";
import { kafka } from "../../config/v1/kafka.js";

const defaultNumberOfPartitions = Number(process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS || 3);
const kafkaProducer = kafka.producer();

let isProducerConnected = false;

const connectProducer = async () => {
  try {
    if (isProducerConnected) return;

    await kafkaProducer.connect();
    isProducerConnected = true;
    console.log("Kafka Producer Connected Successfully!");
  } catch (error) {
    isProducerConnected = false;
    console.error("Error connecting Kafka producer:", error);
    throw error;
  }
};

const sendEvent = async (topic, partition, data, metadata) => {
  try {
    if (!isProducerConnected) {
      await connectProducer();
    }

    await kafkaProducer.send({
      topic,
      messages: [
        {
          partition: partition ?? Math.floor(Math.random() * defaultNumberOfPartitions),
          value: JSON.stringify({ data, metadata }),
        },
      ],
    });

    console.log("Event published: ", JSON.stringify({ data, metadata }));
  } catch (error) {
    console.error("Error sending Kafka message:", error);

    const disconnected =
      error?.message?.includes("producer is disconnected");

    if (disconnected) {
      try {
        isProducerConnected = false;
        await connectProducer();

        await kafkaProducer.send({
          topic,
          messages: [
            {
              partition: partition ?? Math.floor(Math.random() * defaultNumberOfPartitions),
              value: JSON.stringify({ data, metadata }),
            },
          ],
        });

        console.log("Event published successfully after reconnect:", JSON.stringify({ data, metadata }));
        return;
      } catch (retryError) {
        console.error("Retry after reconnect failed:", retryError);
        throw retryError;
      }
    }

    throw error;
  }
};

const disconnectProducer = async () => {
  try {
    if (!isProducerConnected) return;
    await kafkaProducer.disconnect();
    isProducerConnected = false;
  } catch (error) {
    console.error("Error disconnecting Kafka producer:", error);
    throw error;
  }
};

export { connectProducer, sendEvent, disconnectProducer };
