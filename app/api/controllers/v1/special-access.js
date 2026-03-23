import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { sendEvent } from "../../utils/v1/kafkaProducer.js";
import getPartition from "../../utils/v1/getPartition.js";

const CURR_SERVICE_NAME = "api";
const DEFAULT_TOPIC_TO_PUBLISH = process.env.DEFAULT_TOPIC_TO_PUBLISH || "request";

const createSpecialAccessRequestController = async (req, res) => {
  try {
    const body = req.body || {};
    const ticket_id = String(body.ticket_id || body.related_ticket_id || "").trim();
    const contest_id = String(body.contest_id || body.contest_or_platform || "").trim();
    const access_type = String(body.access_type || body.requested_access_type || "").trim();
    const reason = String(body.reason || body.justification || "").trim();

    if (!(ticket_id && contest_id && access_type && reason)) {
      return res.status(400).json({
        success: false,
        message: "ticket_id, contest_id, access_type and reason are required.",
      });
    }

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const userToken = req.headers.authorization;

    const data = {
      ticket_id,
      contest_id,
      problem_id: body.problem_id,
      access_type,
      starts_at: body.starts_at,
      expires_at: body.expires_at,
      reason,
      approver_team: body.approver_team,
      audit_note: body.audit_note,
      user_impact: body.user_impact,
      requested_duration: body.requested_duration,
      verified_issue: body.verified_issue,

      // Legacy mirrors
      contest_or_platform: contest_id,
      related_ticket_id: ticket_id,
      requested_access_type: access_type,
      justification: reason,
      access_expires_at: body.access_expires_at,
    };

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "specialAccess.create",
      createdAt: new Date().toISOString(),
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({
      success: true,
      message: "Special access request create accepted.",
      requestId,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating special access request.",
      error,
    });
  }
};

const getMySpecialAccessRequestsController = async (req, res) => {
  try {
    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const userToken = req.headers.authorization;
    const data = {};

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "specialAccess.getMyRequests",
      createdAt: new Date().toISOString(),
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({
      success: true,
      message: "Special access requests fetch request accepted.",
      requestId,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching special access requests.",
      error,
    });
  }
};

const getSpecificSpecialAccessRequestController = async (req, res) => {
  try {
    const _id = req.params.id || req.body?._id;
    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "_id is required.",
      });
    }

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const userToken = req.headers.authorization;
    const data = { _id };

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "specialAccess.getRequest",
      createdAt: new Date().toISOString(),
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({
      success: true,
      message: "Special access request details fetch accepted.",
      requestId,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching special access request.",
      error,
    });
  }
};

export {
  createSpecialAccessRequestController,
  getMySpecialAccessRequestsController,
  getSpecificSpecialAccessRequestController,
};
