import mongoose from "mongoose";

const supportTicketLookupSchema = mongoose.Schema(
  {
    user_id: { type: String, required: true, index: true },
    issue_type: {
      type: String,
      enum: ["GENERAL", "CONTEST_RELATED", "PROBLEM_RELATED", "SERVER_DOWN", "PLATFORM_BUG"],
      default: "GENERAL",
    },
    contest_id: { type: String, default: "", trim: true },
    problem_id: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["OPEN", "IN_REVIEW", "IN_PROGRESS", "VERIFIED", "RESOLVED", "CLOSED"],
      default: "OPEN",
    },
    eligible_for_special_access: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SupportTicket = mongoose.model("SUPPORT_TICKET", supportTicketLookupSchema);

export default SupportTicket;
