/**
 * Kafka Event Producer - Sends events to topics
 * Manages a single producer instance for the service
 * Includes connection state management and safe send with reconnect logic
 */
import { kafka } from "./kafkaClient.js";

const DEFAULT_PARTITIONS = process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS || 4;
const producer = kafka.producer();
let isProducerConnected = false;
let connectionPromise = null;

/**
 * Connect producer to Kafka
 * Ensures only one connection attempt at a time
 */
const connectProducer = async () => {
  try {
    // If already connecting, wait for that promise
    if (connectionPromise) {
      return connectionPromise;
    }

    if (isProducerConnected) {
      console.log("[Kafka Producer] Already connected");
      return;
    }

    connectionPromise = (async () => {
      try {
        console.log("[Kafka Producer] Attempting to connect...");
        await producer.connect();
        isProducerConnected = true;
        console.log("[Kafka Producer] Successfully connected");
      } catch (error) {
        console.error("[Kafka Producer] Connection error:", error.message);
        isProducerConnected = false;
        throw error;
      } finally {
        connectionPromise = null;
      }
    })();

    return connectionPromise;
  } catch (error) {
    console.error("[Kafka Producer] Error in connectProducer:", error.message);
    throw error;
  }
};

/**
 * Check if producer is connected
 */
const isProducerReady = () => {
  return isProducerConnected;
};

/**
 * Safe reconnect if disconnected
 */
const ensureProducerConnected = async () => {
  if (!isProducerConnected) {
    console.log("[Kafka Producer] Producer disconnected, attempting reconnect...");
    try {
      await connectProducer();
    } catch (error) {
      console.error("[Kafka Producer] Reconnect failed:", error.message);
      throw error;
    }
  }
};

/**
 * Send event to Kafka topic with automatic reconnect
 * @param {string} topic - Topic name
 * @param {number} partition - Partition number (optional)
 * @param {object} data - Event data
 * @param {object} metadata - Event metadata
 */
const sendEvent = async (topic, partition, data, metadata) => {
  try {
    // Ensure producer is connected before sending
    await ensureProducerConnected();

    const partitionToUse = partition ?? Math.floor(Math.random() * DEFAULT_PARTITIONS);

    console.log(`[Kafka Producer] Sending event to topic: ${topic}, partition: ${partitionToUse}`);

    await producer.send({
      topic,
      messages: [
        {
          partition: partitionToUse,
          value: JSON.stringify({ data, metadata }),
        },
      ],
      timeout: 30000, // 30 second timeout
    });

    console.log(`[Kafka Producer] Event published successfully to ${topic}:${partitionToUse}`);
  } catch (error) {
    console.error(`[Kafka Producer] Error sending event to ${topic}:`, error.message);
    
    // If it's a disconnection error, mark producer as disconnected
    if (error.message.includes("disconnected") || error.message.includes("NETWORK_EXCEPTION")) {
      isProducerConnected = false;
      console.log("[Kafka Producer] Producer marked as disconnected due to send error");
    }

    throw error;
  }
};

/**
 * Disconnect producer (should only be called on graceful shutdown)
 */
const disconnectProducer = async () => {
  try {
    if (isProducerConnected) {
      console.log("[Kafka Producer] Disconnecting...");
      await producer.disconnect();
      isProducerConnected = false;
      console.log("[Kafka Producer] Successfully disconnected");
    }
  } catch (error) {
    console.error("[Kafka Producer] Error disconnecting producer:", error.message);
  }
};

export { connectProducer, sendEvent, disconnectProducer, isProducerReady, ensureProducerConnected };
