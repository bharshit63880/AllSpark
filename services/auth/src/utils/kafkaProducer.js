/**
 * Kafka Event Producer - Sends events to topics
 * Manages a single producer instance for the service
 * Includes exponential backoff retry logic for resilience
 */
import { kafka } from "./kafkaClient.js";

const DEFAULT_PARTITIONS = process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS || 4;
const producer = kafka.producer();
let isProducerConnected = false;

/**
 * Calculate exponential backoff delay
 */
const exponentialBackoff = (attempt) => {
  return Math.min(3000 * Math.pow(2, attempt), 30000); // 3s, 6s, 12s, 24s, 30s (max)
};

/**
 * Connect producer to Kafka with exponential backoff retry
 */
const connectProducer = async (maxRetries = 5) => {
  try {
    if (isProducerConnected) return;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`[Auth/Kafka] Producer connection attempt ${attempt + 1}/${maxRetries}...`);
        await producer.connect();
        isProducerConnected = true;
        console.log("[Auth/Kafka] Producer Connected Successfully! ✓");
        return;
      } catch (error) {
        if (attempt < maxRetries - 1) {
          const delayMs = exponentialBackoff(attempt);
          console.warn(
            `[Auth/Kafka] Producer connection failed (attempt ${attempt + 1}/${maxRetries}). ` +
            `Retrying in ${delayMs / 1000}s... Error: ${error.message}`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    isProducerConnected = false;
    console.error("[Auth/Kafka] Failed to connect producer after all retries:", error.message);
    console.warn("[Auth/Kafka] WARNING: Kafka is not available. Event publishing will not work.");
    console.warn("[Auth/Kafka] The service will continue running. Connection will be retried on next event publish.");
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
    if (!isProducerConnected) {
      console.log("[Auth/Kafka] Producer not connected, attempting reconnect...");
      await connectProducer(3); // Attempt 3 retries for send-time connections
    }

    if (!isProducerConnected) {
      console.warn(`[Auth/Kafka] WARNING: Cannot send event to topic '${topic}' - Kafka is not available`);
      return { success: false, message: "Kafka unavailable" };
    }

    await producer.send({
      topic,
      messages: [
        {
          partition: partition || Math.floor(Math.random() * DEFAULT_PARTITIONS),
          value: JSON.stringify({ data, metadata }),
        },
      ],
    });

    console.log("[Auth/Kafka] Event published:", { topic, partition });
    return { success: true };
  } catch (error) {
    console.error("[Auth/Kafka] Error sending event:", error.message);
    isProducerConnected = false;
    return { success: false, error: error.message };
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
      console.log("[Auth/Kafka] Producer disconnected ✓");
    }
  } catch (error) {
    console.error("[Auth/Kafka] Error disconnecting producer:", error);
  }
};

export { connectProducer, sendEvent, disconnectProducer };
