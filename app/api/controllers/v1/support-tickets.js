import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { sendEvent } from "../../utils/v1/kafkaProducer.js";
import getPartition from "../../utils/v1/getPartition.js";

const CURR_SERVICE_NAME = "api";
const DEFAULT_TOPIC_TO_PUBLISH = process.env.DEFAULT_TOPIC_TO_PUBLISH || "request";

const createSupportTicketController = async (req, res) => {
  try {
    const body = req.body || {};
    const title = String(body.title || body.issue_title || "").trim();
    const description = String(body.description || body.issue_description || "").trim();

    if (!(title && description)) {
      return res.status(400).json({
        success: false,
        message: "title and description are required.",
      });
    }

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const userToken = req.headers.authorization;

    const data = {
      issue_type: body.issue_type,
      contest_id: body.contest_id,
      problem_id: body.problem_id,
      title,
      description,
      error_details: body.error_details,
      issue_started_at: body.issue_started_at,
      steps_tried: body.steps_tried,
      user_impact: body.user_impact,
      operational_impact: body.operational_impact,
      urgency: body.urgency,

      // Legacy fields retained for current UI compatibility.
      contest_or_platform: body.contest_or_platform,
      issue_title: title,
      issue_description: description,
      error_message: body.error_message,
    };

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "supportTickets.create",
      createdAt: new Date().toISOString(),
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({
      success: true,
      message: "Support ticket create request accepted.",
      requestId,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating support ticket.",
      error,
    });
  }
};

const getMySupportTicketsController = async (req, res) => {
  try {
    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const userToken = req.headers.authorization;
    const data = {};

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "supportTickets.getMyTickets",
      createdAt: new Date().toISOString(),
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({
      success: true,
      message: "Support tickets fetch request accepted.",
      requestId,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching support tickets.",
      error,
    });
  }
};

const getSupportFaqsController = async (req, res) => {
  try {
    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const userToken = req.headers.authorization;
    const data = {};

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "supportTickets.getResolvedFaqs",
      createdAt: new Date().toISOString(),
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({
      success: true,
      message: "Support FAQ request accepted.",
      requestId,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching support FAQs.",
      error,
    });
  }
};

const getSpecificSupportTicketController = async (req, res) => {
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
      operation: "supportTickets.getTicket",
      createdAt: new Date().toISOString(),
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({
      success: true,
      message: "Support ticket details request accepted.",
      requestId,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching support ticket.",
      error,
    });
  }
};

export {
  createSupportTicketController,
  getMySupportTicketsController,
  getSupportFaqsController,
  getSpecificSupportTicketController,
};
