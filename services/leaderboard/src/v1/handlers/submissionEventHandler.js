import {
  getUserContestMeta,
  setUserContestMeta,
  getContestStartTime,
  setContestStartTime,
  updateUserScore,
  getLeaderboardForContest,
  invalidateLeaderboardCache,
  setLeaderboardCache,
} from "../../utils/redisLeaderboard.js";
import { publishToRedisPubSub } from "../../../src/utils/redisPublisher.js";

const CURR_SERVICE_NAME = "leaderboard-service";

/** Judge0 status id for Accepted */
const JUDGE_ACCEPTED_STATUS_ID = 3;

/**
 * Check if submission is accepted (all test cases passed).
 * @param {Array} testCases
 * @returns {boolean}
 */
const isSubmissionAccepted = (testCases) => {
  if (!Array.isArray(testCases) || testCases.length === 0) return false;
  return testCases.every((tc) => tc?.status?.id === JUDGE_ACCEPTED_STATUS_ID);
};

/**
 * Minutes since epoch from ISO date string.
 */
const minutesFromEpoch = (isoDate) => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) {
    return Math.floor(Date.now() / 60000);
  }
  return Math.floor(d.getTime() / 60000);
};

const normalizeContestMeta = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value;
};

/**
 * Handle submissions.contest.update.complete event: update leaderboard, then emit live update.
 */
const handleContestSubmissionComplete = async (data, metadata) => {
  try {
    const contestId = data.contest_id;
    const userId = data.result?.created_by || data._system?.data?.created_by;
    const problemId = data.result?.problem_id || data._system?.data?.problem_id;
    const testCases = data.result?.test_cases || data._system?.data?.test_cases;
    const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();

    if (!contestId || !userId || !problemId) {
      console.log("Leaderboard: missing contest_id, userId, or problem_id in event, skipping.");
      return;
    }

    const meta = normalizeContestMeta(await getUserContestMeta(contestId, userId));
    const problemMeta = meta[problemId] || { solvedAt: null, wrongAttempts: 0 };

    if (problemMeta.solvedAt) {
      // Already solved this problem, ignore (idempotent)
      return;
    }

    const accepted = isSubmissionAccepted(testCases);
    const submitMinutes = minutesFromEpoch(createdAt);

    let startTime = await getContestStartTime(contestId);
    if (startTime == null || Number.isNaN(Number(startTime))) {
      startTime = submitMinutes;
      await setContestStartTime(contestId, startTime);
    }

    if (accepted) {
      const penaltyMinutes = submitMinutes - startTime + 20 * problemMeta.wrongAttempts;
      meta[problemId] = { solvedAt: createdAt.toISOString(), wrongAttempts: problemMeta.wrongAttempts };
      await setUserContestMeta(contestId, userId, meta);

      const solvedCount = Object.values(meta).filter((p) => p.solvedAt).length;
      const totalPenalty = Object.entries(meta).reduce((sum, [_, p]) => {
        if (!p.solvedAt) return sum;
        const solvedAtMinutes = minutesFromEpoch(p.solvedAt);
        return sum + (solvedAtMinutes - startTime) + 20 * (p.wrongAttempts || 0);
      }, 0);
      const score = 1000000 * solvedCount - totalPenalty;
      await updateUserScore(contestId, userId, score);
    } else {
      meta[problemId] = { solvedAt: null, wrongAttempts: (problemMeta.wrongAttempts || 0) + 1 };
      await setUserContestMeta(contestId, userId, meta);
    }

    await invalidateLeaderboardCache(contestId);
    const leaderboard = await getLeaderboardForContest(contestId, 100);
    await setLeaderboardCache(contestId, leaderboard);

    const livePayload = JSON.stringify({
      contestId,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
      leaderboard,
    });
    await publishToRedisPubSub("leaderboard:live", livePayload);
  } catch (error) {
    console.log("Error in handleContestSubmissionComplete:", error);
  }
};

export { handleContestSubmissionComplete };
