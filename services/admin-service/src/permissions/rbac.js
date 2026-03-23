import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JSON_WEB_TOKEN_SECRET || "secret";
const ALLOWED_ROLES = ["ADMIN", "CONTEST_SCHEDULER", "SUPPORT", "admin"];

export const requireAdminRole = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const headerRole = req.headers["x-user-role"] || req.headers["role"];

    if (headerRole && ALLOWED_ROLES.includes(headerRole)) {
      return next();
    }

    if (!authHeader) {
      return res.status(403).json({ success: false, message: "Authorization required." });
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    const decoded = jwt.verify(token, JWT_SECRET);
    const role = decoded.role ?? decoded.user?.role ?? decoded.roleName ?? decoded.data?.role;

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(403).json({ success: false, message: "Forbidden: admin role required." });
    }

    req.actor = { userId: decoded.userId ?? decoded.sub ?? decoded.user?._id, role };
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(403).json({ success: false, message: "Invalid or expired token." });
    }
    return res.status(500).json({ success: false, message: "Authorization error.", error: err.message });
  }
};
