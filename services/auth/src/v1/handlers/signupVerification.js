import {
  generateOtp,
  setSignupOtp,
  canResendSignupOtp,
  setSignupPendingData,
  getSignupPendingData,
  verifySignupOtpWithAttempts,
  deleteSignupOtp,
  deleteSignupPendingData,
} from "../../utils/redisOtp.js";
import { publishToRedisPubSub } from "../../utils/redisPublisher.js";
import { sendEvent } from "../../utils/kafkaProducer.js";
import getPartition from "../../utils/getPartition.js";

const CURR_SERVICE_NAME = "auth-service";
const PERMISSION_SERVICE_NAMES = new Set(["permission-service", "permissions-service"]);
const USER_SERVICE_NAMES = new Set(["user-service", "users-service"]);

const publishFailure = async (data, metadata, message) => {
  metadata.success = false;
  metadata.message = message;
  metadata.source = CURR_SERVICE_NAME;
  metadata.updatedAt = new Date().toISOString();
  await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
};

const publishSuccess = async (data, metadata, message) => {
  metadata.success = true;
  metadata.message = message;
  metadata.source = CURR_SERVICE_NAME;
  metadata.updatedAt = new Date().toISOString();
  await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
};

const sendSignupOtpEmail = async (email, metadata) => {
  const otp = generateOtp();
  const stored = await setSignupOtp(email, otp);
  if (!stored) {
    return { success: false, message: "Failed to generate verification OTP. Please try again." };
  }

  const emailPayload = {
    to: email,
    subject: "AllSpark Email Verification OTP",
    template: "otp",
    data: {
      otp,
      email,
      expiryMinutes: 10,
      headline: "Verify Your Email Address",
      intro: "Welcome to AllSpark. Use the OTP below to verify your email address and activate your account.",
      helpText: "Once your email is verified, we will activate your account and sign you in.",
    },
  };

  await sendEvent("send.email", getPartition(), emailPayload, {
    ...metadata,
    operation: "send.email",
    source: CURR_SERVICE_NAME,
    updatedAt: new Date().toISOString(),
  });

  return { success: true };
};

const handlePrepareSignupVerification = async (data, metadata) => {
  try {
    metadata = metadata || {};

    if (!USER_SERVICE_NAMES.has(metadata.source)) {
      return;
    }

    const email = String(data?.email || "").trim().toLowerCase();

    if (!email) {
      await publishFailure(data, metadata, "Email is required for signup verification.");
      return;
    }

    const pendingStored = await setSignupPendingData(email, {
      name: String(data?.name || "").trim(),
      user_name: String(data?.user_name || "").trim().toLowerCase(),
      email,
      password: String(data?.password || ""),
      mobile_no: String(data?.mobile_no || "").trim(),
    });

    if (!pendingStored) {
      await publishFailure(data, metadata, "Unable to store signup session. Please try again.");
      return;
    }

    const emailResult = await sendSignupOtpEmail(email, metadata);
    if (!emailResult.success) {
      await publishFailure(data, metadata, emailResult.message);
      return;
    }

    data.result = {
      email,
      verificationRequired: true,
    };

    await publishSuccess(
      data,
      metadata,
      "Signup started successfully. Please verify the OTP sent to your email to activate your account."
    );
  } catch (error) {
    console.error("Error in handlePrepareSignupVerification:", error);
    await publishFailure(data, metadata || {}, "Something went wrong while preparing signup verification.");
  }
};

const handleResendSignupOtp = async (data, metadata) => {
  try {
    metadata = metadata || {};

    if (!PERMISSION_SERVICE_NAMES.has(metadata.source)) {
      return;
    }

    const email = String(data?.email || "").trim().toLowerCase();
    if (!email) {
      await publishFailure(data, metadata, "Email is required.");
      return;
    }

    const pendingSignup = await getSignupPendingData(email);
    if (!pendingSignup) {
      await publishFailure(data, metadata, "Signup verification session expired. Please sign up again.");
      return;
    }

    const canResend = await canResendSignupOtp(email);
    if (!canResend) {
      await publishFailure(data, metadata, "Please wait before requesting another OTP.");
      return;
    }

    const emailResult = await sendSignupOtpEmail(email, metadata);
    if (!emailResult.success) {
      await publishFailure(data, metadata, emailResult.message);
      return;
    }

    data.result = {
      email,
      verificationRequired: true,
    };

    await publishSuccess(data, metadata, "A fresh verification OTP has been sent to your email.");
  } catch (error) {
    console.error("Error in handleResendSignupOtp:", error);
    await publishFailure(data, metadata || {}, "Something went wrong while resending signup OTP.");
  }
};

const handleVerifySignupOtp = async (data, metadata) => {
  try {
    metadata = metadata || {};

    if (!PERMISSION_SERVICE_NAMES.has(metadata.source)) {
      return;
    }

    const email = String(data?.email || "").trim().toLowerCase();
    const otp = String(data?.otp || "").trim();

    if (!email || !otp) {
      await publishFailure(data, metadata, "Email and OTP are required.");
      return;
    }

    const pendingSignup = await getSignupPendingData(email);
    if (!pendingSignup) {
      await publishFailure(data, metadata, "Signup verification session expired. Please sign up again.");
      return;
    }

    const verificationResult = await verifySignupOtpWithAttempts(email, otp);
    if (!verificationResult.valid) {
      let message = "Invalid or expired OTP.";

      if (verificationResult.reason === "max_attempts") {
        message = "Too many failed attempts. Please request a new OTP.";
      } else if (verificationResult.reason === "expired") {
        message = "OTP has expired. Please request a new one.";
      } else if (verificationResult.attemptsLeft !== undefined) {
        message = `Invalid OTP. ${verificationResult.attemptsLeft} attempts remaining.`;
      }

      await publishFailure(data, metadata, message);
      return;
    }

    const createPayload = {
      ...pendingSignup,
      email,
      signupVerificationEmail: email,
    };

    metadata.source = CURR_SERVICE_NAME;
    metadata.updatedAt = new Date().toISOString();

    await sendEvent("users.create", getPartition(), createPayload, metadata);
  } catch (error) {
    console.error("Error in handleVerifySignupOtp:", error);
    await publishFailure(data, metadata || {}, "Something went wrong while verifying signup OTP.");
  }
};

const finalizeSignupVerification = async (data, metadata) => {
  try {
    metadata = metadata || {};

    if (!USER_SERVICE_NAMES.has(metadata.source)) {
      return false;
    }

    const email = String(data?.signupVerificationEmail || "").trim().toLowerCase();
    if (!email) {
      return false;
    }

    await deleteSignupOtp(email);
    await deleteSignupPendingData(email);
    return true;
  } catch (error) {
    console.error("Error in finalizeSignupVerification:", error);
    return false;
  }
};

export {
  handlePrepareSignupVerification,
  handleResendSignupOtp,
  handleVerifySignupOtp,
  finalizeSignupVerification,
};
