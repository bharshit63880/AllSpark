/**
 * Centralized error messages for consistency
 */

const ERRORS = {
  AUTHORIZATION_TOKEN_MISSING: "Authorization Token is not defined.",
  AUTHORIZATION_FAILED: "Forbidden: Insufficient permissions.",
  INVALID_TOKEN_FORMAT: "Invalid token format.",
  INVALID_TOKEN_PAYLOAD: "Forbidden: Invalid token payload.",
  UNAUTHORIZED: "Unauthorized access.",
  INTERNAL_SERVER_ERROR: "Internal server error.",
};

export default ERRORS;