import { kafka } from "./kafkaClient.js";

const admin = kafka.admin();
let isAdminConnected = false;

const connectAdmin = async () => {
  if (!isAdminConnected) {
    await admin.connect();
    isAdminConnected = true;
  }
};

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
  }
};

const disconnectAdmin = async () => {
  if (isAdminConnected) {
    await admin.disconnect();
    isAdminConnected = false;
  }
};

export { connectAdmin, initializeTopics, disconnectAdmin };
