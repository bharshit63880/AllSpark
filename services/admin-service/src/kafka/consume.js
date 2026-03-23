import "dotenv/config";
import { kafka } from "../../config/v1/kafka.js";
import * as statsHandlers from "./handlers/statsHandlers.js";
import * as requestHandlers from "./handlers/requestHandlers.js";

const GROUP_ID = "admin-service";
const adminTopics = [
  "admin.getDashboard",
  "admin.users.getAll",
  "admin.users.delete",
  "admin.contests.create",
  "admin.contests.update",
  "admin.contests.delete",
  "admin.problems.create",
  "admin.problems.delete",
];
const statsTopics = [
  "users.created",
  "users.deleted",
  "contests.created",
  "problems.created",
  "submissions.created",
];

const requestHandlersMap = {
  "admin.getDashboard": requestHandlers.handleGetDashboard,
  "admin.users.getAll": requestHandlers.handleUsersGetAll,
  "admin.users.delete": requestHandlers.handleUsersDelete,
  "admin.contests.create": requestHandlers.handleContestsCreate,
  "admin.contests.update": requestHandlers.handleContestsUpdate,
  "admin.contests.delete": requestHandlers.handleContestsDelete,
  "admin.problems.create": requestHandlers.handleProblemsCreate,
  "admin.problems.delete": requestHandlers.handleProblemsDelete,
};

const statsHandlersMap = {
  "users.created": statsHandlers.handleUsersCreated,
  "users.deleted": statsHandlers.handleUsersDeleted,
  "contests.created": statsHandlers.handleContestsCreated,
  "problems.created": statsHandlers.handleProblemsCreated,
  "submissions.created": statsHandlers.handleSubmissionsCreated,
};

const runConsumer = async () => {
  const consumer = kafka.consumer({ groupId: GROUP_ID });
  await consumer.connect();
  await consumer.subscribe({ topics: [...adminTopics, ...statsTopics] });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const raw = message.value.toString();
        console.log("%s: [%s] partition %s", GROUP_ID, topic, partition);
        const { data, metadata } = JSON.parse(raw);

        if (requestHandlersMap[topic]) {
          await requestHandlersMap[topic](data, metadata);
        } else if (statsHandlersMap[topic]) {
          await statsHandlersMap[topic](data, metadata);
        }
      } catch (error) {
        console.error("Admin consumer error for topic %s:", topic, error);
      }
    },
  });
};

export default runConsumer;
