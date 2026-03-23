import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeAccessType,
  parseDurationToMs,
  isApprovedAndActive,
  canAccessByScope,
  ticketIsEligibleForAccess,
} from "./accessRules.js";

test("normalizeAccessType accepts enum and aliases", () => {
  assert.equal(normalizeAccessType("submission access"), "SUBMISSION_ONLY");
  assert.equal(normalizeAccessType("CONTEST_REOPEN"), "CONTEST_REOPEN");
  assert.equal(normalizeAccessType("unknown"), "");
});

test("parseDurationToMs supports minute/hour/day formats", () => {
  assert.equal(parseDurationToMs("30m"), 30 * 60 * 1000);
  assert.equal(parseDurationToMs("2h"), 2 * 60 * 60 * 1000);
  assert.equal(parseDurationToMs("1d"), 24 * 60 * 60 * 1000);
  assert.equal(parseDurationToMs(""), 0);
});

test("isApprovedAndActive validates status and time window", () => {
  const now = new Date("2026-03-18T10:00:00.000Z");
  const activeRequest = {
    status: "APPROVED",
    starts_at: "2026-03-18T09:00:00.000Z",
    expires_at: "2026-03-18T11:00:00.000Z",
  };
  const expiredRequest = {
    status: "APPROVED",
    starts_at: "2026-03-18T07:00:00.000Z",
    expires_at: "2026-03-18T08:00:00.000Z",
  };
  assert.equal(isApprovedAndActive(activeRequest, now), true);
  assert.equal(isApprovedAndActive(expiredRequest, now), false);
  assert.equal(isApprovedAndActive({ ...activeRequest, status: "REJECTED" }, now), false);
});

test("canAccessByScope enforces user/contest/problem and access_type", () => {
  const now = new Date("2026-03-18T10:00:00.000Z");
  const request = {
    status: "APPROVED",
    user_id: "user-1",
    contest_id: "contest-1",
    problem_id: "problem-1",
    access_type: "PROBLEM_ACCESS",
    starts_at: "2026-03-18T09:00:00.000Z",
    expires_at: "2026-03-18T11:00:00.000Z",
  };

  assert.equal(
    canAccessByScope(
      request,
      {
        userId: "user-1",
        contestId: "contest-1",
        problemId: "problem-1",
        allowedAccessTypes: ["PROBLEM_ACCESS"],
      },
      now
    ),
    true
  );

  assert.equal(
    canAccessByScope(
      request,
      {
        userId: "user-1",
        contestId: "contest-1",
        problemId: "problem-2",
        allowedAccessTypes: ["PROBLEM_ACCESS"],
      },
      now
    ),
    false
  );
});

test("ticketIsEligibleForAccess validates verification gate", () => {
  assert.equal(
    ticketIsEligibleForAccess({
      issue_type: "CONTEST_RELATED",
      eligible_for_special_access: true,
      status: "VERIFIED",
    }),
    true
  );

  assert.equal(
    ticketIsEligibleForAccess({
      issue_type: "GENERAL",
      eligible_for_special_access: true,
      status: "VERIFIED",
    }),
    false
  );

  assert.equal(
    ticketIsEligibleForAccess({
      issue_type: "CONTEST_RELATED",
      eligible_for_special_access: false,
      status: "VERIFIED",
    }),
    false
  );
});
