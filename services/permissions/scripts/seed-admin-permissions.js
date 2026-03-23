/**
 * Seed admin control-panel permissions into MongoDB.
 * Run from project root: node --env-file=main.conf services/permissions/scripts/seed-admin-permissions.js
 * Or from services/permissions: MONGODB_URI="your-uri" node scripts/seed-admin-permissions.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load main.conf from project root if exists
const rootConf = path.resolve(__dirname, "../../../main.conf");
if (fs.existsSync(rootConf)) {
  const content = fs.readFileSync(rootConf, "utf8");
  content.split("\n").forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  });
}

const permissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    nextTopicToPublish: { type: String, required: true },
    roles: [{ type: String }],
    created_by: { type: String, required: true },
  },
  { timestamps: true }
);

const Permission = mongoose.models.PERMISSION || mongoose.model("PERMISSION", permissionSchema);

const ADMIN_ROLES = ["ADMIN", "CONTEST_SCHEDULER", "SUPER_ADMIN"];
const SUPPORT_OR_ADMIN_ROLES = ["SUPPORT", "ADMIN", "SUPER_ADMIN"];
const ALL_ROLES = ["ADMIN", "SUPER_ADMIN", "CONTEST_SCHEDULER", "SUPPORT", "USER", "PUBLIC"];

const ADMIN_PERMISSIONS = [
  { name: "leaderboard.getByContest", description: "Get leaderboard for a contest", nextTopicToPublish: "leaderboard.get", roles: ALL_ROLES, created_by: "seed" },
  { name: "supportTickets.getResolvedFaqs", description: "Get resolved support FAQs", nextTopicToPublish: "supportTickets.getResolvedFaqs", roles: ["USER", "SUPPORT", "ADMIN", "SUPER_ADMIN", "CONTEST_SCHEDULER"], created_by: "seed" },
  { name: "admin.dashboard", description: "Admin dashboard stats", nextTopicToPublish: "admin.getDashboard", roles: SUPPORT_OR_ADMIN_ROLES, created_by: "seed" },
  { name: "admin.contests.list", description: "List contests (control panel)", nextTopicToPublish: "contests.control.search", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.contests.get", description: "Get contest by ID (read/view)", nextTopicToPublish: "contests.control.getContest", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.contests.create", description: "Create contest", nextTopicToPublish: "admin.contests.create", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.contests.update", description: "Update contest", nextTopicToPublish: "admin.contests.update", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.contests.delete", description: "Delete contest", nextTopicToPublish: "admin.contests.delete", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.problems.list", description: "List problems (control panel)", nextTopicToPublish: "problems.control.search", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.problems.get", description: "Get problem by ID (read/view)", nextTopicToPublish: "problems.control.getProblem", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.problems.create", description: "Create problem", nextTopicToPublish: "admin.problems.create", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.problems.update", description: "Update problem", nextTopicToPublish: "problems.control.update", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.problems.delete", description: "Delete problem", nextTopicToPublish: "admin.problems.delete", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.users.getAll", description: "Get all users (admin)", nextTopicToPublish: "admin.users.getAll", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.users.get", description: "Get user by ID (admin)", nextTopicToPublish: "users.control.getUser", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.users.create", description: "Create user (admin)", nextTopicToPublish: "users.control.create", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.users.update", description: "Update user (admin)", nextTopicToPublish: "users.control.update", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.users.ban", description: "Ban user (admin)", nextTopicToPublish: "users.control.update", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.users.unban", description: "Unban user (admin)", nextTopicToPublish: "users.control.update", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.users.delete", description: "Delete user (admin)", nextTopicToPublish: "admin.users.delete", roles: ADMIN_ROLES, created_by: "seed" },

  { name: "admin.submissions.getAll", description: "Get all submissions (admin)", nextTopicToPublish: "submissions.control.search", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.submissions.get", description: "Get submission by ID (admin)", nextTopicToPublish: "submissions.getSubmission", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.submissions.delete", description: "Delete submission (admin)", nextTopicToPublish: "submissions.control.delete", roles: ADMIN_ROLES, created_by: "seed" },
  { name: "admin.supportTickets.getAll", description: "Get support tickets", nextTopicToPublish: "supportTickets.control.search", roles: SUPPORT_OR_ADMIN_ROLES, created_by: "seed" },
  { name: "admin.supportTickets.update", description: "Update support ticket", nextTopicToPublish: "supportTickets.control.update", roles: SUPPORT_OR_ADMIN_ROLES, created_by: "seed" },
  { name: "admin.specialAccess.getAll", description: "Get special access requests", nextTopicToPublish: "specialAccess.control.search", roles: SUPPORT_OR_ADMIN_ROLES, created_by: "seed" },
  { name: "admin.specialAccess.update", description: "Update special access request", nextTopicToPublish: "specialAccess.control.update", roles: SUPPORT_OR_ADMIN_ROLES, created_by: "seed" },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set. Use --env-file=main.conf or set MONGODB_URI.");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");
  for (const p of ADMIN_PERMISSIONS) {
    try {
      await Permission.findOneAndUpdate(
        { name: p.name },
        { $setOnInsert: p },
        { upsert: true }
      );
      console.log("OK:", p.name, "->", p.nextTopicToPublish);
    } catch (e) {
      console.warn("Skip", p.name, e.message);
    }
  }
  console.log("Admin permissions seed done. Total:", ADMIN_PERMISSIONS.length);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
