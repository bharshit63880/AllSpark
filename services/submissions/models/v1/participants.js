import mongoose from "mongoose";

const participantLookupSchema = mongoose.Schema(
  {
    contest_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true, index: true },
    start_time: { type: Date },
    end_time: { type: Date },
    total_duration: { type: Number },
  },
  { timestamps: true }
);

const Participant = mongoose.model("PARTICIPANT", participantLookupSchema);

export default Participant;
