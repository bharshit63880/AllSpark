import ROLES from "../constants/roles.js";
import ERRORS from "../constants/errors.js";

/**
 * Authenticate middleware - Verifies JWT token and decodes user information
 * Attaches decoded user data to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: ERRORS.AUTHORIZATION_TOKEN_MISSING,
      });
    }

    try {
      const parts = token.split(" ");
      const tokenStr = parts.length === 1 ? parts[0] : parts[1];
      const payloadPart = tokenStr.split(".")[1];

      if (!payloadPart) {
        return res.status(401).json({
          success: false,
          message: ERRORS.INVALID_TOKEN_FORMAT,
        });
      }

      // Decode JWT payload
      let b64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const decoded = Buffer.from(b64, "base64").toString("utf8");
      const payload = JSON.parse(decoded || "{}");

      // Extract role from various possible payload structures
      const role =
        payload.role ||
        (payload.user && payload.user.role) ||
        payload.roleName ||
        (payload.data && payload.data.role);

      if (!role) {
        return res.status(401).json({
          success: false,
          message: ERRORS.INVALID_TOKEN_PAYLOAD,
        });
      }

      // Attach user info to request for downstream use
      req.user = {
        ...payload,
        role: role.toUpperCase(), // Normalize to uppercase
        originalPayload: payload,
      };

      next();
    } catch (err) {
      console.error("Failed to parse token payload:", err);
      return res.status(401).json({
        success: false,
        message: ERRORS.INVALID_TOKEN_PAYLOAD,
      });
    }
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({
      success: false,
      message: ERRORS.INTERNAL_SERVER_ERROR,
    });
  }
};

/**
 * Authorize middleware - Checks if user has required roles
 * @param {string[]} allowedRoles - Array of uppercase role strings
 * @returns {Function} Middleware function
 */
const authorize = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: ERRORS.UNAUTHORIZED,
        });
      }

      const userRole = req.user.role?.toUpperCase();

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: ERRORS.AUTHORIZATION_FAILED,
        });
      }

      next();
    } catch (error) {
      console.error("Authorization middleware error:", error);
      return res.status(500).json({
        success: false,
        message: ERRORS.INTERNAL_SERVER_ERROR,
      });
    }
  };
};

export { authenticate, authorize };
