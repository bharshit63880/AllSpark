import SupportTicket from "../../../models/v1/supportTickets.js";
import { publishToRedisPubSub } from "../../utils/redisPublisher.js";
import {
  ISSUE_TYPES,
  normalizeIssueType,
  normalizeCollaborationTier,
  normalizeUrgency,
  requiresContestId,
  requiresProblemId,
  isCareersIssueType,
} from "../ticketRules.js";

const CURR_SERVICE_NAME = "support-ticket-service";

const normalizeDate = (value) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

const inferIssueType = (data) => {
  const explicit = normalizeIssueType(data?.issue_type);
  if (explicit !== "GENERAL") return explicit;
  if (String(data?.problem_id || "").trim()) return "PROBLEM_RELATED";
  if (String(data?.contest_id || "").trim()) return "CONTEST_RELATED";
  return explicit;
};

const generateTicketReference = () => {
  const ts = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `ST-${ts}${random}`;
};

const normalizeUrl = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return "";
};

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const createCareerIntakeTicket = async (data, metadata) => {
  try {
    if (metadata.source !== "permission-service") return;

    metadata.source = CURR_SERVICE_NAME;

    const issue_type = normalizeIssueType(data?.issue_type);
    if (!isCareersIssueType(issue_type)) {
      metadata.success = false;
      metadata.message = "Invalid careers submission type.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    const applicant_name = String(data?.applicant_name || "").trim();
    const applicant_email = normalizeEmail(data?.applicant_email);
    const applicant_phone = String(data?.applicant_phone || "").trim();
    const applicant_location = String(data?.applicant_location || "").trim();
    const requested_track = String(data?.requested_track || "").trim();
    const portfolio_url = normalizeUrl(data?.portfolio_url);
    const resume_url = normalizeUrl(data?.resume_url);
    const organization_name = String(data?.organization_name || "").trim();
    const collaboration_tier = normalizeCollaborationTier(data?.collaboration_tier);
    const collaboration_focus = String(data?.collaboration_focus || "").trim();
    const title = String(data?.title || "").trim();
    const description = String(data?.description || "").trim();
    const userId = String(metadata?.actor?.userId || "").trim();

    if (!(applicant_name && applicant_email && title && description)) {
      metadata.success = false;
      metadata.message = "applicant_name, applicant_email, title and description are required.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicant_email)) {
      metadata.success = false;
      metadata.message = "Please provide a valid applicant_email.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    if (issue_type === "CAREER_APPLICATION" && !resume_url) {
      metadata.success = false;
      metadata.message = "resume_url is required for career applications.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    if (issue_type === "COLLABORATION_REQUEST" && !collaboration_tier) {
      metadata.success = false;
      metadata.message = "collaboration_tier is required for collaboration requests.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    const createdBy = userId || applicant_email || "PUBLIC";
    const ticketPayload = {
      ticket_reference: generateTicketReference(),
      user_id: userId,
      issue_type,
      title,
      description,
      urgency: normalizeUrgency(data?.urgency || "MEDIUM"),
      intake_source: "CAREERS",
      applicant_name,
      applicant_email,
      applicant_phone,
      applicant_location,
      requested_track,
      portfolio_url,
      resume_url,
      organization_name,
      collaboration_tier,
      collaboration_focus,
      issue_title: title,
      issue_description: description,
      user_impact: String(data?.user_impact || "").trim(),
      operational_impact: String(data?.operational_impact || "").trim(),
      created_by: createdBy,
    };

    const createdTicket = await new SupportTicket(ticketPayload).save();

    metadata.success = true;
    metadata.message =
      issue_type === "CAREER_APPLICATION"
        ? "Resume submission received successfully."
        : "Collaboration request received successfully.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub(
      "response",
      JSON.stringify({ data: { ...data, result: createdTicket }, metadata })
    );
  } catch (error) {
    console.log("createCareerIntakeTicket error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Something went wrong while submitting your careers request.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

const createSupportTicket = async (data, metadata) => {
  try {
    if (metadata.source !== "permission-service") return;

    metadata.source = CURR_SERVICE_NAME;

    const userId = metadata?.actor?.userId;
    if (!userId) {
      metadata.success = false;
      metadata.message = "Invalid auth context. Please login again.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    const rawIssueType = String(data?.issue_type || "").trim().toUpperCase();
    const issue_type = inferIssueType(data);
    const contest_id = String(data?.contest_id || "").trim();
    const problem_id = String(data?.problem_id || "").trim();
    const title = String(data?.title || data?.issue_title || "").trim();
    const description = String(data?.description || data?.issue_description || "").trim();
    const error_details = String(data?.error_details || data?.error_message || "").trim();
    const contest_or_platform = String(data?.contest_or_platform || contest_id || "PLATFORM").trim();

    if (rawIssueType && !ISSUE_TYPES.includes(rawIssueType)) {
      metadata.success = false;
      metadata.message = `Invalid issue_type. Allowed: ${ISSUE_TYPES.join(", ")}`;
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    if (!(title && description)) {
      metadata.success = false;
      metadata.message = "title and description are required.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    if (requiresContestId(issue_type) && !contest_id) {
      metadata.success = false;
      metadata.message = "contest_id is required for CONTEST_RELATED issues.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    if (requiresProblemId(issue_type) && !problem_id) {
      metadata.success = false;
      metadata.message = "problem_id is required for PROBLEM_RELATED issues.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    const ticketPayload = {
      ticket_reference: generateTicketReference(),
      user_id: userId,
      issue_type,
      contest_id,
      problem_id,
      title,
      description,
      error_details,

      // Legacy compatibility mirrors
      contest_or_platform,
      issue_title: title,
      issue_description: description,
      issue_started_at: normalizeDate(data?.issue_started_at),
      error_message: error_details,
      steps_tried: String(data?.steps_tried || "").trim(),
      user_impact: String(data?.user_impact || "").trim(),
      operational_impact: String(data?.operational_impact || "").trim(),
      urgency: normalizeUrgency(data?.urgency || data?.priority),
      created_by: userId,
    };

    const createdTicket = await new SupportTicket(ticketPayload).save();

    metadata.success = true;
    metadata.message = "Support ticket created successfully.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub(
      "response",
      JSON.stringify({ data: { ...data, result: createdTicket }, metadata })
    );
  } catch (error) {
    console.log("createSupportTicket error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Something went wrong while creating support ticket.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

const getMySupportTickets = async (data, metadata) => {
  try {
    if (metadata.source !== "permission-service") return;

    metadata.source = CURR_SERVICE_NAME;
    const userId = metadata?.actor?.userId;
    if (!userId) {
      metadata.success = false;
      metadata.message = "Invalid auth context. Please login again.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    const results = await SupportTicket.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .lean();

    metadata.success = true;
    metadata.message = "Support tickets fetched successfully.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub(
      "response",
      JSON.stringify({ data: { ...data, result: results }, metadata })
    );
  } catch (error) {
    console.log("getMySupportTickets error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Something went wrong while fetching support tickets.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

const getResolvedSupportFaqs = async (data, metadata) => {
  try {
    if (metadata.source !== "permission-service") return;

    metadata.source = CURR_SERVICE_NAME;

    const results = await SupportTicket.find({
      status: { $in: ["VERIFIED", "RESOLVED", "CLOSED"] },
      resolution_notes: { $exists: true, $ne: "" },
      issue_type: { $nin: ["CAREER_APPLICATION", "COLLABORATION_REQUEST"] },
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(12)
      .lean();

    const sanitizedFaqs = results.map((ticket) => ({
      _id: ticket._id,
      ticket_reference: ticket.ticket_reference,
      issue_type: ticket.issue_type,
      contest_id: ticket.contest_id || "",
      problem_id: ticket.problem_id || "",
      question: ticket.title || ticket.issue_title || "Support issue",
      description: ticket.description || ticket.issue_description || "",
      error_details: ticket.error_details || ticket.error_message || "",
      steps_tried: ticket.steps_tried || "",
      answer: ticket.resolution_notes || "",
      status: ticket.status,
      updatedAt: ticket.updatedAt,
    }));

    metadata.success = true;
    metadata.message = "Support FAQs fetched successfully.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub(
      "response",
      JSON.stringify({ data: { ...data, result: sanitizedFaqs }, metadata })
    );
  } catch (error) {
    console.log("getResolvedSupportFaqs error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Something went wrong while fetching support FAQs.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

const getSpecificSupportTicket = async (data, metadata) => {
  try {
    if (metadata.source !== "permission-service") return;
    metadata.source = CURR_SERVICE_NAME;

    const _id = data?._id;
    if (!_id) {
      metadata.success = false;
      metadata.message = "_id is required.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    const requesterId = metadata?.actor?.userId;
    const requesterRole = String(metadata?.actor?.role || "").toUpperCase();

    const ticket = await SupportTicket.findById(_id).lean();

    if (!ticket) {
      metadata.success = false;
      metadata.message = "Support ticket not found.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    const adminLikeRoles = ["ADMIN", "SUPER_ADMIN", "SUPPORT", "CONTEST_SCHEDULER"];
    const canView = ticket.user_id === requesterId || adminLikeRoles.includes(requesterRole);

    if (!canView) {
      metadata.success = false;
      metadata.message = "Not allowed to access this support ticket.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    metadata.success = true;
    metadata.message = "Support ticket found successfully.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub(
      "response",
      JSON.stringify({ data: { ...data, result: ticket }, metadata })
    );
  } catch (error) {
    console.log("getSpecificSupportTicket error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Something went wrong while fetching support ticket.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

export {
  createSupportTicket,
  createCareerIntakeTicket,
  getMySupportTickets,
  getResolvedSupportFaqs,
  getSpecificSupportTicket,
};
