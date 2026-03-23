import { kafka } from "./kafkaClient.js";

/**
 * Kafka Producer - Sends events to topics
 * Manages a single producer instance
 */

const DEFAULT_PARTITIONS = process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS || 4;
const producer = kafka.producer();
let isProducerConnected = false;

/**
 * Connect producer
 */
const connectProducer = async () => {
  try {
    if (!isProducerConnected) {
      await producer.connect();
      isProducerConnected = true;
      console.log("Kafka Producer connected successfully");
    }
  } catch (error) {
    console.error("Error connecting Kafka Producer:", error);
    throw error;
  }
};

/**
 * Send event to Kafka topic
 * @param {string} topic
 * @param {number} partition
 * @param {object} data
 * @param {object} metadata
 */
const sendEvent = async (topic, partition, data, metadata) => {
  try {
    await producer.send({
      topic,
      messages: [
        {
          partition: partition || Math.floor(Math.random() * DEFAULT_PARTITIONS),
          value: JSON.stringify({ data, metadata }),
        },
      ],
    });

    console.log("Event published successfully:", {
      topic,
      partition,
      data,
      metadata,
    });
  } catch (error) {
    console.error("Error sending event via Kafka Producer:", error);
    throw error;
  }
};

/**
 * Disconnect producer
 */
const disconnectProducer = async () => {
  try {
    if (isProducerConnected) {
      await producer.disconnect();
      isProducerConnected = false;
      console.log("Kafka Producer disconnected");
    }
  } catch (error) {
    console.error("Error disconnecting Kafka Producer:", error);
  }
};

export { connectProducer, sendEvent, disconnectProducer };
