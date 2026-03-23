import mongoose from "mongoose";

const statsSchema = new mongoose.Schema(
  {
    totalUsers: { type: Number, default: 0 },
    totalContests: { type: Number, default: 0 },
    totalProblems: { type: Number, default: 0 },
    totalSubmissions: { type: Number, default: 0 },
    systemStatus: {
      type: String,
      enum: ["healthy", "degraded", "down"],
      default: "healthy",
    },
  },
  { timestamps: true }
);

// Single document for dashboard stats
statsSchema.statics.getOrCreate = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({
      totalUsers: 0,
      totalContests: 0,
      totalProblems: 0,
      totalSubmissions: 0,
      systemStatus: "healthy",
    });
  }
  return doc;
};

const Stats = mongoose.model("AdminStats", statsSchema);
export default Stats;
