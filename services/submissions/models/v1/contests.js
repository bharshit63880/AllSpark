import mongoose from "mongoose";

const contestLookupSchema = mongoose.Schema(
  {
    start_time: { type: Date },
    end_time: { type: Date },
    duration: { type: Number },
  },
  { timestamps: true }
);

const Contest = mongoose.model("CONTEST", contestLookupSchema);

export default Contest;
