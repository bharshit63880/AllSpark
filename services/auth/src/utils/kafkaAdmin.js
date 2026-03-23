import { kafka } from "./kafkaClient.js";

/**
 * Kafka Admin - Manages topics and cluster administration
 * Includes exponential backoff retry logic for resilience
 */
const admin = kafka.admin();
let isAdminConnected = false;

/**
 * Calculate exponential backoff delay
 */
const exponentialBackoff = (attempt) => {
  return Math.min(3000 * Math.pow(2, attempt), 30000); // 3s, 6s, 12s, 24s, 30s (max)
};

/**
 * Connect to admin with exponential backoff retry
 */
const connectAdmin = async (maxRetries = 5) => {
  try {
    if (isAdminConnected) return;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`[Auth/Kafka Admin] Connection attempt ${attempt + 1}/${maxRetries}...`);
        await admin.connect();
        isAdminConnected = true;
        console.log("[Auth/Kafka Admin] Connected Successfully ✓");
        return;
      } catch (error) {
        if (attempt < maxRetries - 1) {
          const delayMs = exponentialBackoff(attempt);
          console.warn(
            `[Auth/Kafka Admin] Connection failed (attempt ${attempt + 1}/${maxRetries}). ` +
            `Retrying in ${delayMs / 1000}s...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    isAdminConnected = false;
    console.error("[Auth/Kafka Admin] Failed to connect after all retries:", error.message);
    console.warn("[Auth/Kafka Admin] WARNING: Kafka is not available. Topic management will not work.");
  }
};

/**
 * Initialize topics
 * @param {Array} topics - Array of topic configs
 */
const initializeTopics = async (
  topics = [{ topic: "request", numPartitions: 4, replicationFactor: 1 }],
  maxRetries = 5
) => {
  try {
    // Try to connect with retries
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`[Auth/Kafka Admin] Topic initialization attempt ${attempt + 1}/${maxRetries}...`);
        await connectAdmin(3); // Max 3 retries per connection attempt
        
        const existingTopics = await admin.listTopics();
        const topicsToCreate = topics.filter(
          (t) => !existingTopics.includes(t.topic)
        );

        if (topicsToCreate.length > 0) {
          await admin.createTopics({
            topics: topicsToCreate,
            validateOnly: false,
            timeout: 30000,
          });
          console.log("[Auth/Kafka Admin] Topics created successfully ✓:", topicsToCreate.map(t => t.topic));
        } else {
          console.log("[Auth/Kafka Admin] Required topics already exist ✓");
        }
        return; // Success, exit retry loop
      } catch (error) {
        if (attempt < maxRetries - 1) {
          const delayMs = exponentialBackoff(attempt);
          console.warn(
            `[Auth/Kafka Admin] Topic initialization failed (attempt ${attempt + 1}/${maxRetries}). ` +
            `Retrying in ${delayMs / 1000}s...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error("[Auth/Kafka Admin] Error initializing topics:", error.message);
    console.warn("[Auth/Kafka Admin] WARNING: Failed to initialize topics after all retries");
    console.warn("[Auth/Kafka Admin] The service will continue running. Topics may need to be created manually.");
  }
};

/**
 * Disconnect admin
 */
const disconnectAdmin = async () => {
  try {
    if (isAdminConnected) {
      await admin.disconnect();
      isAdminConnected = false;
      console.log("[Auth/Kafka Admin] Disconnected ✓");
    }
  } catch (error) {
    console.error("[Auth/Kafka Admin] Error disconnecting admin:", error);
  }
};

export { connectAdmin, initializeTopics, disconnectAdmin };
