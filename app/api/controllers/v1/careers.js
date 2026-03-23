import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { sendEvent } from "../../utils/v1/kafkaProducer.js";
import getPartition from "../../utils/v1/getPartition.js";

const CURR_SERVICE_NAME = "api";
const DEFAULT_TOPIC_TO_PUBLISH = process.env.DEFAULT_TOPIC_TO_PUBLISH || "request";

const getClientIdOrFail = (req, res) => {
  const clientId = req.get("client-id");
  if (!clientId || !String(clientId).trim()) {
    res.status(400).json({
      success: false,
      message: "WebSocket client id is missing. Please reconnect and try again.",
    });
    return null;
  }
  return String(clientId).trim();
};

const submitCareerInterestController = async (req, res) => {
  try {
    const body = req.body || {};
    const issue_type = String(body.issue_type || "").trim().toUpperCase();
    const applicant_name = String(body.applicant_name || "").trim();
    const applicant_email = String(body.applicant_email || "").trim().toLowerCase();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();

    if (!(applicant_name && applicant_email && title && description)) {
      return res.status(400).json({
        success: false,
        message: "applicant_name, applicant_email, title and description are required.",
      });
    }

    if (!["CAREER_APPLICATION", "COLLABORATION_REQUEST"].includes(issue_type)) {
      return res.status(400).json({
        success: false,
        message: "issue_type must be CAREER_APPLICATION or COLLABORATION_REQUEST.",
      });
    }

    const clientId = getClientIdOrFail(req, res);
    if (!clientId) return;

    const requestId = uuidv4();
    const data = {
      issue_type,
      applicant_name,
      applicant_email,
      applicant_phone: String(body.applicant_phone || "").trim(),
      applicant_location: String(body.applicant_location || "").trim(),
      requested_track: String(body.requested_track || "").trim(),
      portfolio_url: String(body.portfolio_url || "").trim(),
      resume_url: String(body.resume_url || "").trim(),
      organization_name: String(body.organization_name || "").trim(),
      collaboration_tier: String(body.collaboration_tier || "").trim().toUpperCase(),
      collaboration_focus: String(body.collaboration_focus || "").trim(),
      title,
      description,
      user_impact: String(body.user_impact || "").trim(),
      operational_impact: String(body.operational_impact || "").trim(),
      urgency: String(body.urgency || "MEDIUM").trim().toUpperCase(),
    };

    const metadata = {
      clientId,
      requestId,
      actor: {
        token: req.headers.authorization || "",
        role: "PUBLIC",
      },
      operation: "careers.submit",
      createdAt: new Date().toISOString(),
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);

    return res.status(202).json({
      success: true,
      message: "Careers submission accepted. Final response will arrive via WebSocket.",
      requestId,
    });
  } catch (error) {
    console.error("[API][submitCareerInterestController] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while submitting the careers request.",
    });
  }
};

export { submitCareerInterestController };
