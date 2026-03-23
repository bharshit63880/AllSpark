import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeIssueType,
  normalizeStatus,
  canTransitionStatus,
  requiresContestId,
  requiresProblemId,
  issueTypeAllowsSpecialAccess,
  isCareersIssueType,
  normalizeCollaborationTier,
} from "./ticketRules.js";

test("normalizeIssueType returns defaults and valid values", () => {
  assert.equal(normalizeIssueType("contest_related"), "CONTEST_RELATED");
  assert.equal(normalizeIssueType("career_application"), "CAREER_APPLICATION");
  assert.equal(normalizeIssueType("invalid-type"), "GENERAL");
});

test("status transition rules are enforced", () => {
  assert.equal(normalizeStatus("IN_PROGRESS"), "IN_REVIEW");
  assert.equal(canTransitionStatus("OPEN", "VERIFIED"), true);
  assert.equal(canTransitionStatus("RESOLVED", "OPEN"), false);
  assert.equal(canTransitionStatus("CLOSED", "RESOLVED"), false);
});

test("issue scope requirements are mapped correctly", () => {
  assert.equal(requiresContestId("CONTEST_RELATED"), true);
  assert.equal(requiresContestId("GENERAL"), false);
  assert.equal(requiresProblemId("PROBLEM_RELATED"), true);
  assert.equal(requiresProblemId("SERVER_DOWN"), false);
});

test("special access eligibility by issue_type", () => {
  assert.equal(issueTypeAllowsSpecialAccess("CONTEST_RELATED"), true);
  assert.equal(issueTypeAllowsSpecialAccess("PROBLEM_RELATED"), true);
  assert.equal(issueTypeAllowsSpecialAccess("CAREER_APPLICATION"), false);
  assert.equal(issueTypeAllowsSpecialAccess("GENERAL"), false);
});

test("careers issue helpers normalize intended values", () => {
  assert.equal(isCareersIssueType("CAREER_APPLICATION"), true);
  assert.equal(isCareersIssueType("COLLABORATION_REQUEST"), true);
  assert.equal(isCareersIssueType("GENERAL"), false);
  assert.equal(normalizeCollaborationTier("premium"), "PREMIUM");
  assert.equal(normalizeCollaborationTier("free"), "FREE");
  assert.equal(normalizeCollaborationTier("other"), "");
});
