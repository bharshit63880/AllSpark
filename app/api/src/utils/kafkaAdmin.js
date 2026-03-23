import { kafka } from "./kafkaClient.js";

/**
 * Kafka Admin operations
 * Manages topic creation and administration
 */

const admin = kafka.admin();
let isAdminConnected = false;

/**
 * Connect to Kafka admin
 */
const connectAdmin = async () => {
  try {
    if (!isAdminConnected) {
      await admin.connect();
      isAdminConnected = true;
      console.log("Kafka Admin connected successfully");
    }
  } catch (error) {
    console.error("Error connecting Kafka Admin:", error);
    throw error;
  }
};

/**
 * Initialize Kafka topics
 * @param {Array<{topic: string, numPartitions: number, replicationFactor: number}>} topics
 */
const initializeTopics = async (
  topics = [
    { topic: "request", numPartitions: 4, replicationFactor: 1 },
    { topic: "response", numPartitions: 4, replicationFactor: 1 },
    { topic: "leaderboard:live", numPartitions: 2, replicationFactor: 1 },
    { topic: "admin:dashboard:live", numPartitions: 2, replicationFactor: 1 },
  ]
) => {
  try {
    await connectAdmin();

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
      console.log("Topics created successfully:", topicsToCreate);
    } else {
      console.log("All topics already exist");
    }
  } catch (error) {
    console.error("Error initializing topics:", error);
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
      console.log("Kafka Admin disconnected");
    }
  } catch (error) {
    console.error("Error disconnecting Kafka Admin:", error);
  }
};

export { connectAdmin, initializeTopics, disconnectAdmin };
