import SpecialAccessRequest from "../../../models/v1/specialAccessRequests.js";
import { publishToRedisPubSub } from "../../utils/redisPublisher.js";
import {
  ACCESS_STATUSES,
  normalizeStatus,
  normalizeAccessType,
  parseDate,
} from "../accessRules.js";

const CURR_SERVICE_NAME = "special-access-service";
const CONTROL_STATUSES = ACCESS_STATUSES;

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

const searchSpecialAccessRequestsForAdmin = async (data, metadata) => {
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

    await expireStaleApprovedRequests();

    const results = await SpecialAccessRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    metadata.success = true;
    metadata.message = "Special access requests fetched successfully.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub(
      "response",
      JSON.stringify({ data: { ...data, result: results }, metadata })
    );
  } catch (error) {
    console.log("searchSpecialAccessRequestsForAdmin error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Something went wrong while fetching special access requests.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

const updateSpecialAccessRequestForAdmin = async (data, metadata) => {
  try {
    if (metadata.source !== "permission-service") return;
    metadata.source = CURR_SERVICE_NAME;
    const actorRole = String(metadata?.actor?.role || "").toUpperCase();
    const actorId = String(metadata?.actor?.userId || "").trim();

    if (!["SUPPORT", "ADMIN", "SUPER_ADMIN", "CONTEST_SCHEDULER"].includes(actorRole)) {
      metadata.success = false;
      metadata.message = "Not allowed to update special access requests.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    const _id = data?._id;
    if (!_id) {
      metadata.success = false;
      metadata.message = "_id is required to update special access request.";
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    await expireStaleApprovedRequests({ _id });

    const existingRequest = await SpecialAccessRequest.findById(_id).lean();
    if (!existingRequest) {
      metadata.success = false;
      metadata.message = "Special access request not found.";
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

      if (actorRole === "SUPPORT" && ["APPROVED", "REJECTED", "REVOKED", "EXPIRED"].includes(status)) {
        metadata.success = false;
        metadata.message = "SUPPORT can review/recommend but cannot approve/reject/revoke special access.";
        metadata.updatedAt = new Date().toISOString();
        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
      }

      updatePayload.status = status;
    }

    const normalizedAccessType = normalizeAccessType(data?.access_type || data?.requested_access_type);
    if (normalizedAccessType) {
      if (actorRole === "SUPPORT") {
        metadata.success = false;
        metadata.message = "SUPPORT cannot change access type.";
        metadata.updatedAt = new Date().toISOString();
        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
      }
      updatePayload.access_type = normalizedAccessType;
      updatePayload.requested_access_type = normalizedAccessType;
    }

    if (data?.decision_note !== undefined) {
      updatePayload.decision_note = String(data.decision_note || "").trim();
      updatePayload.admin_notes = updatePayload.decision_note;
    }
    if (data?.access_scope !== undefined) {
      updatePayload.access_scope = String(data.access_scope || "").trim();
    }
    if (data?.requested_duration !== undefined) {
      updatePayload.requested_duration = String(data.requested_duration || "").trim();
    }
    if (data?.approver_team !== undefined) {
      updatePayload.approver_team = String(data.approver_team || "").trim();
    }
    if (data?.audit_note !== undefined) {
      updatePayload.audit_note = String(data.audit_note || "").trim();
    }
    if (data?.reason !== undefined) {
      updatePayload.reason = String(data.reason || "").trim();
      updatePayload.justification = updatePayload.reason;
    }

    if (data?.starts_at !== undefined) {
      const parsedDate = parseDate(data.starts_at);
      if (data.starts_at && !parsedDate) {
        metadata.success = false;
        metadata.message = "Invalid starts_at date.";
        metadata.updatedAt = new Date().toISOString();
        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
      }
      updatePayload.starts_at = parsedDate;
    }

    const expiresAtRaw =
      data?.expires_at !== undefined ? data.expires_at : data?.access_expires_at;
    if (expiresAtRaw !== undefined) {
      const parsedDate = parseDate(expiresAtRaw);
      if (expiresAtRaw && !parsedDate) {
        metadata.success = false;
        metadata.message = "Invalid expires_at date.";
        metadata.updatedAt = new Date().toISOString();
        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
      }
      updatePayload.expires_at = parsedDate;
      updatePayload.access_expires_at = parsedDate;
    }

    const finalStartsAt = updatePayload.starts_at || parseDate(existingRequest.starts_at);
    const finalExpiresAt = updatePayload.expires_at || parseDate(existingRequest.expires_at);

    if ((updatePayload.status || existingRequest.status) === "APPROVED") {
      if (!finalStartsAt || !finalExpiresAt || finalExpiresAt.getTime() <= finalStartsAt.getTime()) {
        metadata.success = false;
        metadata.message = "APPROVED access requires valid starts_at and expires_at window.";
        metadata.updatedAt = new Date().toISOString();
        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
      }
      updatePayload.approved_by = actorId;
    }
    else if (["REJECTED", "REVOKED"].includes(updatePayload.status || "")) {
      updatePayload.approved_by = actorId;
    }

    if ((updatePayload.status || existingRequest.status) === "EXPIRED") {
      updatePayload.updated_by = "SYSTEM";
    } else {
      updatePayload.updated_by = actorId;
    }

    const updatedRequest = await SpecialAccessRequest.findByIdAndUpdate(
      _id,
      updatePayload,
      { new: true }
    ).lean();

    metadata.success = true;
    metadata.message = "Special access request updated successfully.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub(
      "response",
      JSON.stringify({ data: { ...data, result: updatedRequest }, metadata })
    );
  } catch (error) {
    console.log("updateSpecialAccessRequestForAdmin error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Something went wrong while updating special access request.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

export { searchSpecialAccessRequestsForAdmin, updateSpecialAccessRequestForAdmin };
