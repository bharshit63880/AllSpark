import mongoose from "mongoose";

const specialAccessSchema = mongoose.Schema(
  {
    request_reference: {
      type: String,
      unique: true,
      index: true,
    },
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    ticket_id: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    contest_id: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    problem_id: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    access_type: {
      type: String,
      required: true,
      enum: ["CONTEST_REOPEN", "SUBMISSION_ONLY", "TIME_EXTENSION", "PROBLEM_ACCESS"],
      index: true,
    },
    starts_at: {
      type: Date,
      required: true,
      index: true,
    },
    expires_at: {
      type: Date,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    admin_notes: {
      type: String,
      default: "",
      trim: true,
    },

    // Legacy fields retained for backward compatibility with existing UI payloads.
    contest_or_platform: {
      type: String,
      trim: true,
      default: "",
    },
    related_ticket_id: {
      type: String,
      trim: true,
      default: "",
    },
    verified_issue: {
      type: String,
      trim: true,
      default: "",
    },
    user_impact: {
      type: String,
      trim: true,
      default: "",
    },
    requested_access_type: {
      type: String,
      trim: true,
      default: "",
    },
    requested_duration: {
      type: String,
      trim: true,
      default: "",
    },
    justification: {
      type: String,
      trim: true,
      default: "",
    },
    approver_team: {
      type: String,
      default: "",
      trim: true,
    },
    audit_note: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "REVOKED", "EXPIRED"],
      default: "PENDING",
      index: true,
    },
    decision_note: {
      type: String,
      default: "",
      trim: true,
    },
    approved_by: {
      type: String,
      default: "",
      trim: true,
    },
    access_scope: {
      type: String,
      default: "",
      trim: true,
    },
    access_expires_at: {
      type: Date,
    },
    created_by: {
      type: String,
      required: true,
    },
    updated_by: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const SpecialAccessRequest = mongoose.model("SPECIAL_ACCESS_REQUEST", specialAccessSchema);

export default SpecialAccessRequest;
