import { kafka } from "./kafkaClient.js";

/**
 * Kafka Admin - Manages topics and cluster administration
 */
const admin = kafka.admin();
let isAdminConnected = false;

/**
 * Connect to admin
 */
const connectAdmin = async () => {
  try {
    if (!isAdminConnected) {
      await admin.connect();
      isAdminConnected = true;
      console.log("Kafka Admin connected");
    }
  } catch (error) {
    console.error("Error connecting admin:", error);
    throw error;
  }
};

/**
 * Initialize topics
 * @param {Array} topics - Array of topic configs
 */
const initializeTopics = async (
  topics = [{ topic: "request", numPartitions: 4, replicationFactor: 1 }]
) => {
  await connectAdmin();
  const existingTopics = await admin.listTopics();
  const topicsToCreate = topics.filter((t) => !existingTopics.includes(t.topic));

  if (topicsToCreate.length > 0) {
    await admin.createTopics({
      topics: topicsToCreate,
      validateOnly: false,
      timeout: 30000,
    });
    console.log("Topics created:", topicsToCreate);
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
    console.error("Error disconnecting admin:", error);
  }
};

export { connectAdmin, initializeTopics, disconnectAdmin };
