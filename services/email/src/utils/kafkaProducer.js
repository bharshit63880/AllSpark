import { kafka } from "./kafkaClient.js";

/**
 * Kafka Event Producer - Sends events to topics
 * Manages a single producer instance for the service
 */

const DEFAULT_PARTITIONS = process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS || 4;
const producer = kafka.producer();
let isProducerConnected = false;

/**
 * Connect producer to Kafka
 */
const connectProducer = async () => {
  try {
    if (!isProducerConnected) {
      await producer.connect();
      isProducerConnected = true;
      console.log("Kafka Producer connected");
    }
  } catch (error) {
    console.error("Error connecting Kafka Producer:", error);
    throw error;
  }
};

/**
 * Send event to Kafka topic
 * @param {string} topic - Topic name
 * @param {number} partition - Partition number (optional)
 * @param {object} data - Event data
 * @param {object} metadata - Event metadata
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

    console.log("Event published:", {
      topic,
      partition,
    });
  } catch (error) {
    console.error("Error sending event:", error);
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
    console.error("Error disconnecting producer:", error);
  }
};

export { connectProducer, sendEvent, disconnectProducer };
