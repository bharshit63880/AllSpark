const ISSUE_TYPES = [
  "GENERAL",
  "CONTEST_RELATED",
  "PROBLEM_RELATED",
  "SERVER_DOWN",
  "PLATFORM_BUG",
  "CAREER_APPLICATION",
  "COLLABORATION_REQUEST",
];
const URGENCY_LEVELS = ["LOW", "MEDIUM", "HIGH"];
const TICKET_STATUSES = ["OPEN", "IN_REVIEW", "IN_PROGRESS", "VERIFIED", "RESOLVED", "CLOSED"];
const COLLABORATION_TIERS = ["FREE", "PREMIUM"];

const STATUS_TRANSITIONS = {
  OPEN: ["IN_REVIEW", "IN_PROGRESS", "VERIFIED", "RESOLVED", "CLOSED"],
  IN_REVIEW: ["VERIFIED", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["VERIFIED", "RESOLVED", "CLOSED"],
  VERIFIED: ["RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

const normalizeIssueType = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (ISSUE_TYPES.includes(normalized)) return normalized;
  return "GENERAL";
};

const normalizeUrgency = (value) => {
  const normalized = String(value || "MEDIUM").trim().toUpperCase();
  if (URGENCY_LEVELS.includes(normalized)) return normalized;
  return "MEDIUM";
};

const normalizeStatus = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "IN_PROGRESS") return "IN_REVIEW";
  return normalized;
};

const requiresContestId = (issueType) => ["CONTEST_RELATED"].includes(issueType);
const requiresProblemId = (issueType) => ["PROBLEM_RELATED"].includes(issueType);
const isCareersIssueType = (issueType) =>
  ["CAREER_APPLICATION", "COLLABORATION_REQUEST"].includes(String(issueType || "").trim().toUpperCase());
const normalizeCollaborationTier = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (COLLABORATION_TIERS.includes(normalized)) return normalized;
  return "";
};

const canTransitionStatus = (fromStatus, toStatus) => {
  const normalizedFrom = normalizeStatus(fromStatus || "OPEN");
  const normalizedTo = normalizeStatus(toStatus || "");
  if (!normalizedTo) return false;
  if (normalizedFrom === normalizedTo) return true;
  const allowed = STATUS_TRANSITIONS[normalizedFrom] || [];
  return allowed.includes(normalizedTo);
};

const issueTypeAllowsSpecialAccess = (issueType) =>
  ["CONTEST_RELATED", "PROBLEM_RELATED", "SERVER_DOWN", "PLATFORM_BUG"].includes(issueType);

export {
  ISSUE_TYPES,
  URGENCY_LEVELS,
  TICKET_STATUSES,
  COLLABORATION_TIERS,
  normalizeIssueType,
  normalizeUrgency,
  normalizeStatus,
  normalizeCollaborationTier,
  requiresContestId,
  requiresProblemId,
  isCareersIssueType,
  canTransitionStatus,
  issueTypeAllowsSpecialAccess,
};
