import { sendEvent } from "../utils/kafkaProducer.js";

const DEFAULT_PARTITIONS = Number(process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS) || 4;
const getPartition = () => Math.floor(Math.random() * DEFAULT_PARTITIONS);

export const getUsers = async (req, res) => {
  return res.status(202).json({
    success: true,
    message: "Use API gateway with client-id and WebSocket for user list response.",
  });
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "User id is required." });
    }
    await sendEvent("admin.deleteUser", getPartition(), { _id: id }, {
      source: "admin-service",
      clientId: req.get("client-id"),
      requestId: req.get("x-request-id") || Date.now().toString(),
      actor: req.actor,
    });
    return res.status(202).json({
      success: true,
      message: "Delete user request accepted. Result will be sent via WebSocket if client-id provided.",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ success: false, message: "Failed to publish delete user event." });
  }
};
