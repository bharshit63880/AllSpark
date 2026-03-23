import mongoose from "mongoose";

const specialAccessLookupSchema = mongoose.Schema(
  {
    user_id: { type: String, required: true, index: true },
    contest_id: { type: String, required: true, index: true },
    problem_id: { type: String, default: "", trim: true },
    access_type: {
      type: String,
      enum: ["CONTEST_REOPEN", "SUBMISSION_ONLY", "TIME_EXTENSION", "PROBLEM_ACCESS"],
      required: true,
    },
    starts_at: { type: Date, required: true },
    expires_at: { type: Date, required: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "REVOKED", "EXPIRED"],
      default: "PENDING",
      index: true,
    },
    updated_by: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const SpecialAccessRequest = mongoose.model("SPECIAL_ACCESS_REQUEST", specialAccessLookupSchema);

export default SpecialAccessRequest;
