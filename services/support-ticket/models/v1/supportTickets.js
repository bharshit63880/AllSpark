import mongoose from "mongoose";

const supportTicketSchema = mongoose.Schema(
  {
    ticket_reference: {
      type: String,
      unique: true,
      index: true,
    },
    user_id: {
      type: String,
      default: "",
      index: true,
    },
    issue_type: {
      type: String,
      enum: [
        "GENERAL",
        "CONTEST_RELATED",
        "PROBLEM_RELATED",
        "SERVER_DOWN",
        "PLATFORM_BUG",
        "CAREER_APPLICATION",
        "COLLABORATION_REQUEST",
      ],
      default: "GENERAL",
      index: true,
    },
    contest_id: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    problem_id: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    error_details: {
      type: String,
      trim: true,
      default: "",
    },

    // Legacy fields retained for backward compatibility with old UI payloads.
    contest_or_platform: {
      type: String,
      trim: true,
      default: "",
    },
    issue_title: {
      type: String,
      trim: true,
      default: "",
    },
    issue_description: {
      type: String,
      trim: true,
      default: "",
    },
    issue_started_at: {
      type: Date,
    },
    error_message: {
      type: String,
      trim: true,
      default: "",
    },
    steps_tried: {
      type: String,
      trim: true,
      default: "",
    },
    user_impact: {
      type: String,
      trim: true,
      default: "",
    },
    operational_impact: {
      type: String,
      trim: true,
      default: "",
    },
    intake_source: {
      type: String,
      enum: ["SUPPORT", "CAREERS"],
      default: "SUPPORT",
      index: true,
    },
    applicant_name: {
      type: String,
      trim: true,
      default: "",
    },
    applicant_email: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    applicant_phone: {
      type: String,
      trim: true,
      default: "",
    },
    applicant_location: {
      type: String,
      trim: true,
      default: "",
    },
    requested_track: {
      type: String,
      trim: true,
      default: "",
    },
    portfolio_url: {
      type: String,
      trim: true,
      default: "",
    },
    resume_url: {
      type: String,
      trim: true,
      default: "",
    },
    organization_name: {
      type: String,
      trim: true,
      default: "",
    },
    collaboration_tier: {
      type: String,
      enum: ["", "FREE", "PREMIUM"],
      default: "",
    },
    collaboration_focus: {
      type: String,
      trim: true,
      default: "",
    },
    urgency: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_REVIEW", "IN_PROGRESS", "VERIFIED", "RESOLVED", "CLOSED"],
      default: "OPEN",
      index: true,
    },
    assigned_to: {
      type: String,
      default: "",
      trim: true,
    },
    verified_by: {
      type: String,
      default: "",
      trim: true,
    },
    eligible_for_special_access: {
      type: Boolean,
      default: false,
    },
    resolution_notes: {
      type: String,
      default: "",
      trim: true,
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

const SupportTicket = mongoose.model("SUPPORT_TICKET", supportTicketSchema);

export default SupportTicket;
