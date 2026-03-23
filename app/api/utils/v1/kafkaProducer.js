import "dotenv/config";
import { kafka } from "../../config/v1/kafka.js";


const defaultNumberOfPartitions = process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS || 4;

const kafkaProducer = kafka.producer();
let isConnected = false;
let connectionAttempt = 0;

// Exponential backoff retry logic
const exponentialBackoff = (attempt) => {
  const delayMs = Math.min(3000 * Math.pow(2, attempt), 30000); // 3s, 6s, 12s, 24s, 30s (max)
  return delayMs;
};

// Function to connect to Kafka with exponential backoff retry
const connectProducer = async (maxRetries = 5) => {
  try {
    if (isConnected) return;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`[Kafka] Connection attempt ${attempt + 1}/${maxRetries}...`);
        await kafkaProducer.connect();
        isConnected = true;
        connectionAttempt = 0;
        console.log("[Kafka] Producer Connected Successfully! ✓");
        return;
      } catch (error) {
        if (attempt < maxRetries - 1) {
          const delayMs = exponentialBackoff(attempt);
          console.warn(
            `[Kafka] Connection failed (attempt ${attempt + 1}/${maxRetries}). ` +
            `Retrying in ${delayMs / 1000}s... Error: ${error.message}`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    isConnected = false;
    console.error("[Kafka] Failed to connect after all retries:", error.message);
    console.warn("[Kafka] WARNING: Kafka is not available. Some features may be limited.");
    console.warn("[Kafka] The application will continue running. Kafka connection will be retried on next event publish.");
  }
};

// Function to send a message using the established connection
const sendEvent = async (topic, partition, data, metadata) => {
  try {
    if (!isConnected) {
      console.log("[Kafka] Producer not connected, attempting reconnect...");
      await connectProducer(3); // Attempt 3 retries for send-time connections
    }
    
    // If still not connected after retries, log warning and throw error
    if (!isConnected) {
      console.warn(`[Kafka] WARNING: Cannot send event to topic '${topic}' - Kafka is not available`);
      console.warn("[Kafka] Event data will not be published. Some reactive features may not work.");
      throw new Error("Kafka unavailable");
    }

    await kafkaProducer.send({
      topic,
      messages: [
        {
          partition: partition || Math.floor(Math.random() * defaultNumberOfPartitions),
          value: JSON.stringify({ data: data, metadata: metadata }),
        },
      ],
    });

    console.log("[Kafka] Event published:", JSON.stringify({ data, metadata }));
    return { success: true };
    
  } catch (error) {
    console.error("[Kafka] Error sending event to topic '" + topic + "':", error.message);
    // Mark disconnected so next request attempts reconnection
    isConnected = false;
    console.warn("[Kafka] Event failed to publish. Will retry on next attempt.");
    throw error;
  }
};

// Function to disconnect (e.g., when the server shuts down)
const disconnectProducer = async () => {
  try {
    await kafkaProducer.disconnect();
  } catch (error) {
    console.error("Error sending Kafka message:", error);
    console.log("Something went wrong while disconnecting Kafka Producer");
  }
};

export { connectProducer, sendEvent, disconnectProducer };
