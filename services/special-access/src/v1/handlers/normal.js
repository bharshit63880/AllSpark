import SpecialAccessRequest from "../../../models/v1/specialAccessRequests.js";
import SupportTicket from "../../../models/v1/supportTickets.js";
import { publishToRedisPubSub } from "../../utils/redisPublisher.js";
import {
  normalizeAccessType,
  parseDate,
  parseDurationToMs,
  ticketIsEligibleForAccess,
} from "../accessRules.js";

const CURR_SERVICE_NAME = "special-access-service";

const generateRequestReference = () => {
  const ts = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `SA-${ts}${random}`;
};

const expireStaleApprovedRequests = async (filter = {}) => {
  const now = new Date();
  await SpecialAccessRequest.updateMany(
    {
      ...filter,
      status: "APPROVED",
      expires_at: { $lte: now },
    },
    { $set: { status: "EXPIRED", updated_by: "SYSTEM" } }
  );
};

const createSpecialAccessRequest = async (data, metadata) => {
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

    const ticket_id = String(data?.ticket_id || data?.related_ticket_id || "").trim();
    const contest_id = String(data?.contest_id || data?.contest_or_platform || "").trim();
    const problem_id = String(data?.problem_id || "").trim();
    const access_type = normalizeAccessType(data?.access_type || data?.requested_access_type);
    const reason = String(data?.reason || data?.justification || "").trim();
    const starts_at = parseDate(data?.starts_at) || new Date();
    let expires_at =
      parseDate(data?.expires_at) ||
      parseDate(data?.access_expires_at) ||
      null;

    if (!expires_at) {
      const requestedDurationMs = parseDurationToMs(data?.requested_duration);
      if (requestedDurationMs > 0) {
        expires_at = new Date(starts_at.getTime() + requestedDurationMs);
      }
    }

    if (!ticket_id) {
      metadata.success = false;
      metadata.message = "ticket_id is required.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    if (!contest_id) {
      metadata.success = false;
      metadata.message = "contest_id is required.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    if (!access_type) {
      metadata.success = false;
      metadata.message =
        "access_type is required and must be one of CONTEST_REOPEN, SUBMISSION_ONLY, TIME_EXTENSION, PROBLEM_ACCESS.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    if (!reason) {
      metadata.success = false;
      metadata.message = "reason is required.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    if (!expires_at || expires_at.getTime() <= starts_at.getTime()) {
      metadata.success = false;
      metadata.message = "expires_at must be a valid date greater than starts_at.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    const ticket = await SupportTicket.findById(ticket_id).lean();
    if (!ticket) {
      metadata.success = false;
      metadata.message = "Linked support ticket not found.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    if (String(ticket.user_id || "") !== userId) {
      metadata.success = false;
      metadata.message = "Ticket does not belong to current user.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    if (!ticketIsEligibleForAccess(ticket)) {
      metadata.success = false;
      metadata.message =
        "Ticket is not eligible for special access. It must be verified and marked eligible by support/admin.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    if (String(ticket.contest_id || "").trim() && String(ticket.contest_id).trim() !== contest_id) {
      metadata.success = false;
      metadata.message = "contest_id does not match linked support ticket.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    if (
      String(problem_id || "").trim() &&
      String(ticket.problem_id || "").trim() &&
      String(ticket.problem_id).trim() !== String(problem_id).trim()
    ) {
      metadata.success = false;
      metadata.message = "problem_id does not match linked support ticket.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    const payload = {
      request_reference: generateRequestReference(),
      user_id: userId,
      ticket_id,
      contest_id,
      problem_id,
      access_type,
      starts_at,
      expires_at,
      reason,
      admin_notes: "",

      // Legacy mirrors
      contest_or_platform: contest_id,
      related_ticket_id: ticket_id,
      verified_issue: String(data?.verified_issue || ticket.issue_type || "").trim(),
      user_impact: String(data?.user_impact || "").trim(),
      requested_access_type: access_type,
      requested_duration: String(data?.requested_duration || "").trim(),
      justification: reason,
      approver_team: String(data?.approver_team || "").trim(),
      audit_note: String(data?.audit_note || "").trim(),
      access_expires_at: expires_at,
      created_by: userId,
    };

    const createdRequest = await new SpecialAccessRequest(payload).save();

    metadata.success = true;
    metadata.message = "Special access request created successfully.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub(
      "response",
      JSON.stringify({ data: { ...data, result: createdRequest }, metadata })
    );
  } catch (error) {
    console.log("createSpecialAccessRequest error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Something went wrong while creating special access request.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

const getMySpecialAccessRequests = async (data, metadata) => {
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

    await expireStaleApprovedRequests({ user_id: userId });

    const results = await SpecialAccessRequest.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .lean();

    metadata.success = true;
    metadata.message = "Special access requests fetched successfully.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub(
      "response",
      JSON.stringify({ data: { ...data, result: results }, metadata })
    );
  } catch (error) {
    console.log("getMySpecialAccessRequests error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Something went wrong while fetching special access requests.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

const getSpecificSpecialAccessRequest = async (data, metadata) => {
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
    await expireStaleApprovedRequests({ _id });
    const reqDoc = await SpecialAccessRequest.findById(_id).lean();

    if (!reqDoc) {
      metadata.success = false;
      metadata.message = "Special access request not found.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    const adminLikeRoles = ["ADMIN", "SUPER_ADMIN", "SUPPORT", "CONTEST_SCHEDULER"];
    const canView = reqDoc.user_id === requesterId || adminLikeRoles.includes(requesterRole);

    if (!canView) {
      metadata.success = false;
      metadata.message = "Not allowed to access this special access request.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    metadata.success = true;
    metadata.message = "Special access request found successfully.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub(
      "response",
      JSON.stringify({ data: { ...data, result: reqDoc }, metadata })
    );
  } catch (error) {
    console.log("getSpecificSpecialAccessRequest error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Something went wrong while fetching special access request.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

export {
  createSpecialAccessRequest,
  getMySpecialAccessRequests,
  getSpecificSpecialAccessRequest,
};
