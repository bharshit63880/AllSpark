/**
 * Seed public auth permissions into MongoDB so permission-service can route
 * login/signup/forgot-password flows to auth-service topics.
 *
 * Run from project root:
 *   node --env-file=main.conf services/permissions/scripts/seed-auth-permissions.js
 *
 * Or from services/permissions:
 *   MONGODB_URI="your-uri" node scripts/seed-auth-permissions.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load main.conf from project root if exists (dev convenience)
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

const PUBLIC_ROLES = ["PUBLIC"];

// NOTE: these `name` values must match metadata.operation produced by the API/auth-service checkIdentity.
const AUTH_PERMISSIONS = [
  { name: "signup", description: "Public signup", nextTopicToPublish: "auth.signup", roles: PUBLIC_ROLES, created_by: "seed" },
  { name: "login", description: "Public login", nextTopicToPublish: "auth.login", roles: PUBLIC_ROLES, created_by: "seed" },
  { name: "auth.resendSignupOtp", description: "Resend signup verification OTP", nextTopicToPublish: "auth.resendSignupOtp", roles: PUBLIC_ROLES, created_by: "seed" },
  { name: "auth.verifySignupOtp", description: "Verify signup email OTP", nextTopicToPublish: "auth.verifySignupOtp", roles: PUBLIC_ROLES, created_by: "seed" },

  // Forgot password flow (OTP)
  { name: "auth.forgotPassword", description: "Request password reset OTP", nextTopicToPublish: "auth.forgotPassword", roles: PUBLIC_ROLES, created_by: "seed" },
  { name: "auth.verifyOtp", description: "Verify password reset OTP", nextTopicToPublish: "auth.verifyOtp", roles: PUBLIC_ROLES, created_by: "seed" },
  { name: "auth.resetPassword", description: "Reset password after OTP verification", nextTopicToPublish: "auth.resetPassword", roles: PUBLIC_ROLES, created_by: "seed" },

  // Problems
  { name: "problems.getAllProblems", description: "Get all problems", nextTopicToPublish: "problems.getAllProblems", roles: PUBLIC_ROLES, created_by: "seed" },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set. Use --env-file=main.conf or set MONGODB_URI.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  for (const p of AUTH_PERMISSIONS) {
    try {
      await Permission.findOneAndUpdate({ name: p.name }, { $setOnInsert: p }, { upsert: true });
      console.log("OK:", p.name, "->", p.nextTopicToPublish);
    } catch (e) {
      console.warn("Skip", p.name, e.message);
    }
  }

  console.log("Auth permissions seed done. Total:", AUTH_PERMISSIONS.length);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

