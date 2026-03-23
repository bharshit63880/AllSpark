import { setOtp, generateOtp, canResendOtp } from "../../utils/redisOtp.js";
import { publishToRedisPubSub } from "../../utils/redisPublisher.js";
import { sendEvent } from "../../utils/kafkaProducer.js";
import getPartition from "../../utils/getPartition.js";

const CURR_SERVICE_NAME = "auth-service";
const PERMISSION_SERVICE_NAMES = new Set(["permission-service", "permissions-service"]);

/**
 * Handle auth.forgotPassword: generate secure OTP, store hashed OTP in Redis with expiry and attempt tracking,
 * invalidate previous OTPs, send email via Kafka.
 * Does not reveal whether email exists; always returns generic success if email provided.
 */
const handleForgotPassword = async (data, metadata) => {
  try {
    metadata = metadata || {};
    if (!PERMISSION_SERVICE_NAMES.has(metadata.source)) return;

    const email = data?.email?.trim?.();
    if (!email) {
      metadata.success = false;
      metadata.message = "Email is required.";
      metadata.source = CURR_SERVICE_NAME;
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    // Check if resend is allowed (cooldown period)
    const canResend = await canResendOtp(email);
    if (!canResend) {
      metadata.success = false;
      metadata.message = "Please wait before requesting another OTP.";
      metadata.source = CURR_SERVICE_NAME;
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    const otp = generateOtp();
    const stored = await setOtp(email, otp);
    if (!stored) {
      metadata.success = false;
      metadata.message = "Failed to process request. Please try again.";
      metadata.source = CURR_SERVICE_NAME;
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    const partition = getPartition();
    const emailPayload = {
      to: email,
      subject: "AllSpark Password Reset OTP",
      template: "otp",
      data: {
        otp,
        email,
        expiryMinutes: 10
      }
    };
    const emailMeta = {
      ...metadata,
      operation: "send.email",
      source: CURR_SERVICE_NAME
    };
    await sendEvent("send.email", partition, emailPayload, emailMeta);

    // Generic success message to prevent email enumeration
    metadata.success = true;
    metadata.message = "If an account exists for this email, an OTP has been sent.";
    metadata.source = CURR_SERVICE_NAME;
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));

  } catch (error) {
    console.error("Error in handleForgotPassword:", error);
    metadata.success = false;
    metadata.message = "Something went wrong. Please try again.";
    metadata.source = CURR_SERVICE_NAME;
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

export { handleForgotPassword };
