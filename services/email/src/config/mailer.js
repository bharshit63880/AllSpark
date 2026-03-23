import "dotenv/config";
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || "";
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || "All Spark";

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  ...(SMTP_USER && SMTP_PASS ? { auth: { user: SMTP_USER, pass: SMTP_PASS } } : {}),
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.log("Email Transporter Error:", error);
  } else {
    console.log("Email Transporter is ready to take messages");
  }
});

export { transporter, SMTP_FROM_EMAIL, SMTP_FROM_NAME };
