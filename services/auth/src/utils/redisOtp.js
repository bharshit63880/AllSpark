import { redis as redisClient } from "../../config/v1/redis.js";
import bcrypt from "bcryptjs";

const OTP_EXPIRY = 10 * 60; // 10 minutes in seconds
const RESET_TOKEN_EXPIRY = 10 * 60; // 10 minutes for reset token
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN = 60; // 60 seconds

const otpKey = (email) => `otp:${email}`;
const resetAllowedKey = (email) => `reset_allowed:${email}`;
const signupOtpKey = (email) => `signup_otp:${email}`;
const signupPendingKey = (email) => `signup_pending:${email}`;

/**
 * Generate a secure random 6-digit OTP.
 */
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const hashOtp = async (otp) => {
  const saltRounds = 10;
  return await bcrypt.hash(String(otp), saltRounds);
};

const verifyOtp = async (otp, hash) => bcrypt.compare(String(otp), String(hash));

const buildOtpPayload = async (otp) => ({
  otpHash: await hashOtp(otp),
  expiresAt: Date.now() + (OTP_EXPIRY * 1000),
  attempts: 0,
  maxAttempts: MAX_ATTEMPTS,
  resendAvailableAt: Date.now() + (RESEND_COOLDOWN * 1000),
  verified: false,
  used: false,
});

const setOtpForKey = async (key, otp) => {
  try {
    if (!key) return false;
    const data = await buildOtpPayload(otp);
    await redisClient.setex(key, OTP_EXPIRY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error setting OTP:", error);
    return false;
  }
};

const getKeyedOtpData = async (key) => {
  try {
    if (!key) return null;

    const raw = await redisClient.get(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (Date.now() > parsed.expiresAt) {
      await redisClient.del(key);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("Error getting OTP data:", error);
    return null;
  }
};

const verifyOtpWithAttemptsForKey = async (key, otp) => {
  try {
    if (!key) return { valid: false, reason: "invalid_key" };

    const data = await getKeyedOtpData(key);
    if (!data) return { valid: false, reason: "expired" };

    if (data.used) return { valid: false, reason: "used" };
    if (data.attempts >= data.maxAttempts) return { valid: false, reason: "max_attempts" };

    const isValid = await verifyOtp(otp, data.otpHash);
    data.attempts += 1;

    await redisClient.setex(key, OTP_EXPIRY, JSON.stringify({ ...data, verified: Boolean(isValid) }));

    if (isValid) return { valid: true };
    return { valid: false, reason: "invalid", attemptsLeft: data.maxAttempts - data.attempts };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { valid: false, reason: "error" };
  }
};

const canResendOtpForKey = async (key) => {
  try {
    const data = await getKeyedOtpData(key);
    if (!data) return true;
    return Date.now() >= data.resendAvailableAt;
  } catch (error) {
    console.error("Error checking resend availability:", error);
    return false;
  }
};

const deleteKey = async (key) => {
  try {
    if (!key) return false;
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error("Error deleting redis key:", error);
    return false;
  }
};

const setOtp = async (email, otp) => {
  try {
    const e = String(email || "").trim();
    if (!e) return false;
    return await setOtpForKey(otpKey(e), otp);
  } catch (error) {
    console.error("Error setting OTP:", error);
    return false;
  }
};

const getOtpData = async (email) => {
  try {
    const e = String(email || "").trim();
    if (!e) return null;

    return await getKeyedOtpData(otpKey(e));
  } catch (error) {
    console.error("Error getting OTP data:", error);
    return null;
  }
};

const getOtp = async (email) => {
  const data = await getOtpData(email);
  return data ? data.otpHash : null;
};

const verifyOtpWithAttempts = async (email, otp) => {
  try {
    const e = String(email || "").trim();
    if (!e) return { valid: false, reason: "invalid_email" };

    return await verifyOtpWithAttemptsForKey(otpKey(e), otp);
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { valid: false, reason: "error" };
  }
};

const deleteOtp = async (email) => {
  try {
    const e = String(email || "").trim();
    if (!e) return false;
    return await deleteKey(otpKey(e));
  } catch (error) {
    console.error("Error deleting OTP:", error);
    return false;
  }
};

const canResendOtp = async (email) => {
  try {
    return await canResendOtpForKey(otpKey(String(email || "").trim()));
  } catch (error) {
    console.error("Error checking resend availability:", error);
    return false;
  }
};

const setSignupOtp = async (email, otp) => {
  const e = String(email || "").trim();
  if (!e) return false;
  return await setOtpForKey(signupOtpKey(e), otp);
};

const getSignupOtpData = async (email) => {
  const e = String(email || "").trim();
  if (!e) return null;
  return await getKeyedOtpData(signupOtpKey(e));
};

const verifySignupOtpWithAttempts = async (email, otp) => {
  const e = String(email || "").trim();
  if (!e) return { valid: false, reason: "invalid_email" };
  return await verifyOtpWithAttemptsForKey(signupOtpKey(e), otp);
};

const deleteSignupOtp = async (email) => {
  const e = String(email || "").trim();
  if (!e) return false;
  return await deleteKey(signupOtpKey(e));
};

const canResendSignupOtp = async (email) => {
  const e = String(email || "").trim();
  if (!e) return false;
  return await canResendOtpForKey(signupOtpKey(e));
};

const setSignupPendingData = async (email, payload) => {
  try {
    const e = String(email || "").trim().toLowerCase();
    if (!e || !payload || typeof payload !== "object") return false;

    const data = {
      ...payload,
      email: e,
      storedAt: Date.now(),
      expiresAt: Date.now() + (OTP_EXPIRY * 1000),
    };

    await redisClient.setex(signupPendingKey(e), OTP_EXPIRY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error setting signup pending data:", error);
    return false;
  }
};

const getSignupPendingData = async (email) => {
  try {
    const e = String(email || "").trim().toLowerCase();
    if (!e) return null;

    const raw = await redisClient.get(signupPendingKey(e));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (Date.now() > parsed.expiresAt) {
      await redisClient.del(signupPendingKey(e));
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("Error getting signup pending data:", error);
    return null;
  }
};

const deleteSignupPendingData = async (email) => {
  const e = String(email || "").trim().toLowerCase();
  if (!e) return false;
  return await deleteKey(signupPendingKey(e));
};

const setResetAllowed = async (email) => {
  try {
    const e = String(email || "").trim();
    if (!e) return false;
    const key = resetAllowedKey(e);
    const data = {
      allowed: true,
      expiresAt: Date.now() + (RESET_TOKEN_EXPIRY * 1000),
      used: false,
    };
    await redisClient.setex(key, RESET_TOKEN_EXPIRY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error setting reset allowed:", error);
    return false;
  }
};

const checkResetAllowed = async (email) => {
  try {
    const e = String(email || "").trim();
    if (!e) return false;
    const key = resetAllowedKey(e);
    const raw = await redisClient.get(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (Date.now() > parsed.expiresAt || parsed.used) {
      await redisClient.del(key);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error checking reset allowed:", error);
    return false;
  }
};

const deleteResetAllowed = async (email) => {
  try {
    const e = String(email || "").trim();
    if (!e) return false;
    await redisClient.del(resetAllowedKey(e));
    return true;
  } catch (error) {
    console.error("Error deleting reset allowed:", error);
    return false;
  }
};

export {
  generateOtp,
  setOtp,
  getOtp,
  verifyOtpWithAttempts,
  deleteOtp,
  canResendOtp,
  setSignupOtp,
  getSignupOtpData,
  verifySignupOtpWithAttempts,
  deleteSignupOtp,
  canResendSignupOtp,
  setSignupPendingData,
  getSignupPendingData,
  deleteSignupPendingData,
  setResetAllowed,
  checkResetAllowed,
  deleteResetAllowed,
  OTP_EXPIRY,
  RESET_TOKEN_EXPIRY,
};
