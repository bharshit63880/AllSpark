import { verifyOtpWithAttempts, deleteOtp, setResetAllowed } from "../../utils/redisOtp.js";
import { publishToRedisPubSub } from "../../utils/redisPublisher.js";

const CURR_SERVICE_NAME = "auth-service";
const PERMISSION_SERVICE_NAMES = new Set(["permission-service", "permissions-service"]);

/**
 * Handle auth.verifyOtp: verify OTP with attempt tracking, if valid set reset_allowed:{email} with short expiry, delete OTP.
 */
const handleVerifyOtp = async (data, metadata) => {
  try {
    metadata = metadata || {};
    if (!PERMISSION_SERVICE_NAMES.has(metadata.source)) return;

    const email = data?.email?.trim?.();
    const otp = data?.otp?.trim?.();
    if (!email || !otp) {
      metadata.success = false;
      metadata.message = "Email and OTP are required.";
      metadata.source = CURR_SERVICE_NAME;
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    const result = await verifyOtpWithAttempts(email, otp);

    if (!result.valid) {
      let message = "Invalid or expired OTP.";
      if (result.reason === "max_attempts") {
        message = "Too many failed attempts. Please request a new OTP.";
      } else if (result.reason === "expired") {
        message = "OTP has expired. Please request a new one.";
      } else if (result.attemptsLeft !== undefined) {
        message = `Invalid OTP. ${result.attemptsLeft} attempts remaining.`;
      }

      metadata.success = false;
      metadata.message = message;
      metadata.source = CURR_SERVICE_NAME;
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    // OTP is valid, clean up and set reset permission
    await deleteOtp(email);
    await setResetAllowed(email);

    data.result = { verified: true, email };
    metadata.success = true;
    metadata.message = "OTP verified successfully. You can now reset your password.";
    metadata.source = CURR_SERVICE_NAME;
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));

  } catch (error) {
    console.error("Error handleVerifyOtp:", error);
    metadata.success = false;
    metadata.message = "Something went wrong. Please try again.";
    metadata.source = CURR_SERVICE_NAME;
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

export { handleVerifyOtp };
