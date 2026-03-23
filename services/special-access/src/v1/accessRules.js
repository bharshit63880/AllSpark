const ACCESS_TYPES = ["CONTEST_REOPEN", "SUBMISSION_ONLY", "TIME_EXTENSION", "PROBLEM_ACCESS"];
const ACCESS_STATUSES = ["PENDING", "APPROVED", "REJECTED", "REVOKED", "EXPIRED"];

const TICKET_TYPES_ALLOWED_FOR_ACCESS = [
  "CONTEST_RELATED",
  "PROBLEM_RELATED",
  "SERVER_DOWN",
  "PLATFORM_BUG",
];

const normalizeAccessType = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  const aliases = {
    CONTEST_RE_OPEN: "CONTEST_REOPEN",
    SUBMISSION_ACCESS: "SUBMISSION_ONLY",
    TIME_EXTEND: "TIME_EXTENSION",
  };

  const resolved = aliases[normalized] || normalized;
  if (ACCESS_TYPES.includes(resolved)) return resolved;
  return "";
};

const normalizeStatus = (value) => String(value || "").trim().toUpperCase();

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const parseDurationToMs = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return 0;

  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric * 60 * 1000;
  }

  const match = raw.match(/^(\d+)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)$/);
  if (!match) return 0;

  const amount = Number(match[1]);
  const unit = match[2];
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  if (["m", "min", "mins", "minute", "minutes"].includes(unit)) return amount * 60 * 1000;
  if (["h", "hr", "hrs", "hour", "hours"].includes(unit)) return amount * 60 * 60 * 1000;
  return amount * 24 * 60 * 60 * 1000;
};

const isApprovedAndActive = (request, now = new Date()) => {
  if (!request) return false;

  const status = normalizeStatus(request.status);
  if (status !== "APPROVED") return false;

  const startsAt = parseDate(request.starts_at);
  const expiresAt = parseDate(request.expires_at);
  if (!startsAt || !expiresAt) return false;

  const nowMs = now.getTime();
  return startsAt.getTime() <= nowMs && nowMs <= expiresAt.getTime();
};

const canAccessByScope = (
  request,
  { userId, contestId, problemId = "", allowedAccessTypes = [] },
  now = new Date()
) => {
  if (!isApprovedAndActive(request, now)) return false;
  if (String(request.user_id || "") !== String(userId || "")) return false;
  if (String(request.contest_id || "") !== String(contestId || "")) return false;

  const requestProblemId = String(request.problem_id || "").trim();
  if (requestProblemId && String(problemId || "").trim() && requestProblemId !== String(problemId || "").trim()) {
    return false;
  }

  const requestType = normalizeAccessType(request.access_type);
  if (!requestType) return false;
  if (Array.isArray(allowedAccessTypes) && allowedAccessTypes.length > 0) {
    return allowedAccessTypes.includes(requestType);
  }

  return true;
};

const ticketIsEligibleForAccess = (ticket) => {
  if (!ticket) return false;
  if (!TICKET_TYPES_ALLOWED_FOR_ACCESS.includes(String(ticket.issue_type || "").toUpperCase())) return false;
  if (!Boolean(ticket.eligible_for_special_access)) return false;
  const status = normalizeStatus(ticket.status);
  return ["VERIFIED", "RESOLVED", "CLOSED"].includes(status);
};

export {
  ACCESS_TYPES,
  ACCESS_STATUSES,
  TICKET_TYPES_ALLOWED_FOR_ACCESS,
  normalizeAccessType,
  normalizeStatus,
  parseDate,
  parseDurationToMs,
  isApprovedAndActive,
  canAccessByScope,
  ticketIsEligibleForAccess,
};
