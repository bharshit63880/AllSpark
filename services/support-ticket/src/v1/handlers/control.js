import SupportTicket from "../../../models/v1/supportTickets.js";
import { publishToRedisPubSub } from "../../utils/redisPublisher.js";
import {
  TICKET_STATUSES,
  normalizeStatus,
  normalizeIssueType,
  canTransitionStatus,
  issueTypeAllowsSpecialAccess,
  ISSUE_TYPES,
  requiresContestId,
  requiresProblemId,
} from "../ticketRules.js";

const CURR_SERVICE_NAME = "support-ticket-service";

const CONTROL_STATUSES = TICKET_STATUSES.filter((status) => status !== "IN_PROGRESS");

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return undefined;
};

const searchSupportTicketsForAdmin = async (data, metadata) => {
  try {
    if (metadata.source !== "permission-service") return;
    metadata.source = CURR_SERVICE_NAME;

    const filter =
      data && typeof data.filter === "object" && data.filter ? data.filter : {};
    const limit = Number.isFinite(Number(data?.limit))
      ? Math.min(200, Math.max(1, Number(data.limit)))
      : 100;
    const skip = Number.isFinite(Number(data?.skip))
      ? Math.max(0, Number(data.skip))
      : 0;

    const results = await SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    metadata.success = true;
    metadata.message = "Support tickets fetched successfully.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub(
      "response",
      JSON.stringify({ data: { ...data, result: results }, metadata })
    );
  } catch (error) {
    console.log("searchSupportTicketsForAdmin error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Something went wrong while fetching support tickets.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

const updateSupportTicketForAdmin = async (data, metadata) => {
  try {
    if (metadata.source !== "permission-service") return;
    metadata.source = CURR_SERVICE_NAME;
    const actorRole = String(metadata?.actor?.role || "").toUpperCase();
    const actorId = String(metadata?.actor?.userId || "").trim();

    if (!["SUPPORT", "ADMIN", "SUPER_ADMIN", "CONTEST_SCHEDULER"].includes(actorRole)) {
      metadata.success = false;
      metadata.message = "Not allowed to update support tickets.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    const _id = data?._id;
    if (!_id) {
      metadata.success = false;
      metadata.message = "_id is required to update support ticket.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    const existingTicket = await SupportTicket.findById(_id).lean();
    if (!existingTicket) {
      metadata.success = false;
      metadata.message = "Support ticket not found.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    const updatePayload = {};
    const status = normalizeStatus(data?.status);
    if (status) {
      if (!CONTROL_STATUSES.includes(status)) {
        metadata.success = false;
        metadata.message = `Invalid status. Allowed: ${CONTROL_STATUSES.join(", ")}`;
        metadata.updatedAt = new Date().toISOString();
        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
      }

      if (!canTransitionStatus(existingTicket.status || "OPEN", status)) {
        metadata.success = false;
        metadata.message = `Invalid status transition from ${existingTicket.status || "OPEN"} to ${status}.`;
        metadata.updatedAt = new Date().toISOString();
        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
      }

      updatePayload.status = status;
    }

    if (data?.assigned_to !== undefined) {
      updatePayload.assigned_to = String(data.assigned_to || "").trim();
    }

    if (data?.resolution_notes !== undefined) {
      updatePayload.resolution_notes = String(data.resolution_notes || "").trim();
    }

    if (data?.title !== undefined) {
      updatePayload.title = String(data.title || "").trim();
      updatePayload.issue_title = updatePayload.title;
    }

    if (data?.description !== undefined) {
      updatePayload.description = String(data.description || "").trim();
      updatePayload.issue_description = updatePayload.description;
    }

    if (data?.contest_id !== undefined) {
      updatePayload.contest_id = String(data.contest_id || "").trim();
      updatePayload.contest_or_platform = updatePayload.contest_id || existingTicket.contest_or_platform || "";
    }

    if (data?.problem_id !== undefined) {
      updatePayload.problem_id = String(data.problem_id || "").trim();
    }

    if (data?.issue_type !== undefined) {
      const rawIssueType = String(data.issue_type || "").trim().toUpperCase();
      if (!ISSUE_TYPES.includes(rawIssueType)) {
        metadata.success = false;
        metadata.message = `Invalid issue_type. Allowed: ${ISSUE_TYPES.join(", ")}`;
        metadata.updatedAt = new Date().toISOString();
        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
      }
      updatePayload.issue_type = normalizeIssueType(rawIssueType);
    }

    const finalIssueType = updatePayload.issue_type || normalizeIssueType(existingTicket.issue_type);
    const finalContestId = updatePayload.contest_id ?? String(existingTicket.contest_id || "").trim();
    const finalProblemId = updatePayload.problem_id ?? String(existingTicket.problem_id || "").trim();

    if (requiresContestId(finalIssueType) && !String(finalContestId || "").trim()) {
      metadata.success = false;
      metadata.message = "contest_id is required for CONTEST_RELATED issues.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    if (requiresProblemId(finalIssueType) && !String(finalProblemId || "").trim()) {
      metadata.success = false;
      metadata.message = "problem_id is required for PROBLEM_RELATED issues.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    if (data?.verified_by !== undefined) {
      updatePayload.verified_by = String(data.verified_by || "").trim();
    }

    if ((updatePayload.status || existingTicket.status) === "VERIFIED" && !updatePayload.verified_by) {
      updatePayload.verified_by = actorId;
    }

    if (data?.eligible_for_special_access !== undefined) {
      const parsedEligible = parseBoolean(data.eligible_for_special_access);
      if (parsedEligible === undefined) {
        metadata.success = false;
        metadata.message = "eligible_for_special_access must be boolean.";
        metadata.updatedAt = new Date().toISOString();
        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
      }

      if (parsedEligible && !issueTypeAllowsSpecialAccess(existingTicket.issue_type)) {
        metadata.success = false;
        metadata.message = "Ticket issue_type is not eligible for special access.";
        metadata.updatedAt = new Date().toISOString();
        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
      }

      const nextStatus = updatePayload.status || normalizeStatus(existingTicket.status || "OPEN");
      if (parsedEligible && !["VERIFIED", "RESOLVED", "CLOSED"].includes(nextStatus)) {
        metadata.success = false;
        metadata.message = "Ticket must be VERIFIED/RESOLVED/CLOSED before marking eligible_for_special_access.";
        metadata.updatedAt = new Date().toISOString();
        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
      }

      updatePayload.eligible_for_special_access = parsedEligible;
    }

    updatePayload.updated_by = actorId;

    const updatedTicket = await SupportTicket.findByIdAndUpdate(_id, updatePayload, {
      new: true,
    }).lean();

    metadata.success = true;
    metadata.message = "Support ticket updated successfully.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub(
      "response",
      JSON.stringify({ data: { ...data, result: updatedTicket }, metadata })
    );
  } catch (error) {
    console.log("updateSupportTicketForAdmin error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Something went wrong while updating support ticket.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

export { searchSupportTicketsForAdmin, updateSupportTicketForAdmin };
