import crypto from "crypto";

// Allowed roles for admin/control panel
const ADMIN_ALLOWED_ROLES = ["ADMIN", "SUPER_ADMIN", "CONTEST_SCHEDULER"];
const SUPPORT_OR_ADMIN_ALLOWED_ROLES = ["SUPPORT", ...ADMIN_ALLOWED_ROLES];

const normalizeAuthorizationToken = (rawToken) => {
  let token = String(rawToken || "").trim();

  if (!token) {
    return "";
  }

  if (token.toLowerCase().startsWith("bearer ")) {
    token = token.slice(7).trim();
  }

  // Support tokens that got wrapped in quotes by client/localStorage mishandling.
  for (let i = 0; i < 2; i += 1) {
    const startsWithDoubleQuote = token.startsWith("\"") && token.endsWith("\"");
    const startsWithSingleQuote = token.startsWith("'") && token.endsWith("'");
    if (!startsWithDoubleQuote && !startsWithSingleQuote) {
      break;
    }
    token = token.slice(1, -1).trim();
  }

  return token;
};

const decodeBase64Url = (value) => {
  let b64 = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return Buffer.from(b64, "base64").toString("utf8");
};

const verifyAndDecodeJwt = (token) => {
  const tokenStr = normalizeAuthorizationToken(token);
  if (!tokenStr) {
    throw new Error("Authorization token is empty");
  }

  const segments = tokenStr.split(".");
  if (segments.length !== 3) {
    throw new Error("Invalid token format");
  }

  const secret = process.env.JSON_WEB_TOKEN_SECRET || "";
  if (!secret) {
    throw new Error("JSON_WEB_TOKEN_SECRET is not configured");
  }

  const [headerSeg, payloadSeg, signatureSeg] = segments;
  const signedData = `${headerSeg}.${payloadSeg}`;

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(signedData)
    .digest("base64url");

  const expectedBuf = Buffer.from(expectedSig);
  const providedBuf = Buffer.from(signatureSeg);
  if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(decodeBase64Url(payloadSeg) || "{}");
  if (payload.exp && Date.now() >= Number(payload.exp) * 1000) {
    throw new Error("Token expired");
  }

  return payload;
};

const enforceRoleCheck = (allowedRoles) => async (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(403).json({ success: false, message: "Authorization Token is not defined." });
    }

    try {
      const payload = verifyAndDecodeJwt(String(token));

      const role = String(
        payload.role || (payload.user && payload.user.role) || payload.roleName || (payload.data && payload.data.role) || ""
      ).toUpperCase();

      if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({ success: false, message: "Forbidden: admin role required." });
      }

      next();
    } catch (err) {
      console.log("Failed to parse token payload for admin check", err);
      return res.status(403).json({ success: false, message: "Forbidden: invalid token payload." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Some error occured in admin middleware.", error });
  }
};

const isAdminMiddleware = enforceRoleCheck(ADMIN_ALLOWED_ROLES);
const isSupportOrAdminMiddleware = enforceRoleCheck(SUPPORT_OR_ADMIN_ALLOWED_ROLES);

export { isAdminMiddleware, isSupportOrAdminMiddleware };
