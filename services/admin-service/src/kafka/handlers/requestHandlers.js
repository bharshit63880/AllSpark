import { publishToRedisPubSub } from "../../utils/redisPublisher.js";
import { sendEvent } from "../../utils/kafkaProducer.js";
import { getDashboardSnapshot } from "./statsHandlers.js";

const CURR_SERVICE_NAME = "admin-service";
const DEFAULT_PARTITIONS = Number(process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS) || 4;
const getPartition = () => Math.floor(Math.random() * DEFAULT_PARTITIONS);

export const handleGetDashboard = async (data, metadata) => {
  try {
    const snapshot = await getDashboardSnapshot();

    metadata.source = CURR_SERVICE_NAME;
    metadata.updatedAt = new Date().toISOString();
    metadata.success = true;
    metadata.message = "Dashboard stats retrieved.";
    const responseData = {
      ...data,
      result: {
        totals: snapshot.totals,
        systemStatus: snapshot.systemStatus,
        lastUpdatedAt: snapshot.lastUpdatedAt,
      },
    };
    await publishToRedisPubSub("response", JSON.stringify({ data: responseData, metadata }));
  } catch (error) {
    console.error("Admin getDashboard error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Failed to get dashboard stats.";
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

export const handleUsersGetAll = async (data, metadata) => {
  try {
    await sendEvent("users.control.search", getPartition(), { filter: data.filter || {} }, metadata);
  } catch (error) {
    console.error("Admin users.getAll forward error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Failed to get users.";
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

export const handleUsersDelete = async (data, metadata) => {
  try {
    await sendEvent("admin.deleteUser", getPartition(), data, metadata);
  } catch (error) {
    console.error("Admin users.delete error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Failed to delete user.";
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

export const handleContestsCreate = async (data, metadata) => {
  try {
    await sendEvent("admin.createContest", getPartition(), data, metadata);
  } catch (error) {
    console.error("Admin contests.create error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Failed to create contest.";
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

export const handleContestsUpdate = async (data, metadata) => {
  try {
    await sendEvent("admin.updateContest", getPartition(), data, metadata);
  } catch (error) {
    console.error("Admin contests.update error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Failed to update contest.";
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

export const handleContestsDelete = async (data, metadata) => {
  try {
    await sendEvent("admin.deleteContest", getPartition(), data, metadata);
  } catch (error) {
    console.error("Admin contests.delete error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Failed to delete contest.";
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

export const handleProblemsCreate = async (data, metadata) => {
  try {
    await sendEvent("admin.createProblem", getPartition(), data, metadata);
  } catch (error) {
    console.error("Admin problems.create error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Failed to create problem.";
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

export const handleProblemsDelete = async (data, metadata) => {
  try {
    await sendEvent("admin.deleteProblem", getPartition(), data, metadata);
  } catch (error) {
    console.error("Admin problems.delete error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Failed to delete problem.";
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};
