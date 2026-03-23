import { checkResetAllowed, deleteResetAllowed } from "../../utils/redisOtp.js";
import { publishToRedisPubSub } from "../../utils/redisPublisher.js";
import { sendEvent } from "../../utils/kafkaProducer.js";
import getPartition from "../../utils/getPartition.js";
import bcrypt from "bcryptjs";

const CURR_SERVICE_NAME = "auth-service";
const PERMISSION_SERVICE_NAMES = new Set(["permission-service", "permissions-service"]);

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (password.length < minLength) {
    return { valid: false, message: "Password must be at least 8 characters long." };
  }
  if (!hasUpperCase) {
    return { valid: false, message: "Password must contain at least one uppercase letter." };
  }
  if (!hasLowerCase) {
    return { valid: false, message: "Password must contain at least one lowercase letter." };
  }
  if (!hasNumbers) {
    return { valid: false, message: "Password must contain at least one number." };
  }
  if (!hasSpecialChar) {
    return { valid: false, message: "Password must contain at least one special character." };
  }
  return { valid: true };
};

/**
 * Handle auth.resetPassword: verify reset_allowed:{email}, validate password strength, hash password, then produce to users.password.reset.
 */
const handleResetPassword = async (data, metadata) => {
  try {
    metadata = metadata || {};
    if (!PERMISSION_SERVICE_NAMES.has(metadata.source)) return;

    const email = data?.email?.trim?.();
    const newPassword = data?.newPassword ?? data?.new_password;
    const confirmPassword = data?.confirmPassword ?? data?.confirm_password;

    if (!email || !newPassword) {
      metadata.success = false;
      metadata.message = "Email and new password are required.";
      metadata.source = CURR_SERVICE_NAME;
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      metadata.success = false;
      metadata.message = passwordValidation.message;
      metadata.source = CURR_SERVICE_NAME;
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    // Check password confirmation if provided
    if (confirmPassword && newPassword !== confirmPassword) {
      metadata.success = false;
      metadata.message = "Passwords do not match.";
      metadata.source = CURR_SERVICE_NAME;
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    // Verify reset permission
    const allowed = await checkResetAllowed(email);
    if (!allowed) {
      metadata.success = false;
      metadata.message = "Password reset session expired or invalid. Please verify OTP again.";
      metadata.source = CURR_SERVICE_NAME;
      metadata.updatedAt = new Date().toISOString();
      await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
      return;
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Mark reset as used
    await deleteResetAllowed(email);

    const partition = getPartition();
    const payload = { email, newPassword: hashedPassword };
    const resetMetadata = {
      ...metadata,
      source: CURR_SERVICE_NAME,
      operation: "auth.resetPassword"
    };
    await sendEvent("users.password.reset", partition, payload, resetMetadata);
    // Final response for this request comes from users-service after actual DB update.
    return;

  } catch (error) {
    console.error("Error handleResetPassword:", error);
    metadata.success = false;
    metadata.message = "Something went wrong. Please try again.";
    metadata.source = CURR_SERVICE_NAME;
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
  }
};

export { handleResetPassword };
