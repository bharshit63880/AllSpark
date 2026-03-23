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

export const createContest = async (req, res) => {
  try {
    const body = req.body || {};
    await forwardWithClientId(req, "admin.createContest", body);
    return res.status(202).json({
      success: true,
      message: "Create contest request accepted. Result via WebSocket if client-id provided.",
    });
  } catch (error) {
    console.error("Create contest error:", error);
    return res.status(500).json({ success: false, message: "Failed to publish create contest event." });
  }
};

export const updateContest = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    await forwardWithClientId(req, "admin.updateContest", { _id: id, ...body });
    return res.status(202).json({
      success: true,
      message: "Update contest request accepted. Result via WebSocket if client-id provided.",
    });
  } catch (error) {
    console.error("Update contest error:", error);
    return res.status(500).json({ success: false, message: "Failed to publish update contest event." });
  }
};

export const deleteContest = async (req, res) => {
  try {
    const { id } = req.params;
    await forwardWithClientId(req, "admin.deleteContest", { _id: id });
    return res.status(202).json({
      success: true,
      message: "Delete contest request accepted. Result via WebSocket if client-id provided.",
    });
  } catch (error) {
    console.error("Delete contest error:", error);
    return res.status(500).json({ success: false, message: "Failed to publish delete contest event." });
  }
};
