import { sendEvent } from "../utils/kafkaProducer.js";

const DEFAULT_PARTITIONS = Number(process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS) || 4;
const getPartition = () => Math.floor(Math.random() * DEFAULT_PARTITIONS);

const forwardWithClientId = (req, topic, data) => {
  const metadata = {
    source: "admin-service",
    clientId: req.get("client-id"),
    requestId: req.get("x-request-id") || Date.now().toString(),
    actor: req.actor || {},
  };
  return sendEvent(topic, getPartition(), data, metadata);
};

export const createProblem = async (req, res) => {
  try {
    const body = req.body || {};
    await forwardWithClientId(req, "admin.createProblem", body);
    return res.status(202).json({
      success: true,
      message: "Create problem request accepted. Result via WebSocket if client-id provided.",
    });
  } catch (error) {
    console.error("Create problem error:", error);
    return res.status(500).json({ success: false, message: "Failed to publish create problem event." });
  }
};

export const deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;
    await forwardWithClientId(req, "admin.deleteProblem", { _id: id });
    return res.status(202).json({
      success: true,
      message: "Delete problem request accepted. Result via WebSocket if client-id provided.",
    });
  } catch (error) {
    console.error("Delete problem error:", error);
    return res.status(500).json({ success: false, message: "Failed to publish delete problem event." });
  }
};
