import { getLeaderboardCache, getLeaderboardForContest, setLeaderboardCache } from "../../../src/utils/redisLeaderboard.js";
import { publishToRedisPubSub } from "../../../src/utils/redisPublisher.js";

const CURR_SERVICE_NAME = "leaderboard-service";

/**
 * Handle leaderboard.get Kafka event (from API via permissions).
 * data.contestId optional; if missing return empty or error.
 * Respond via Redis "response" channel with clientId from metadata.
 */
const handleGetLeaderboard = async (data, metadata) => {
  try {
    const contestId = data.contestId ?? data.contest_id;
    const limit = Math.min(Number(data.limit) || 100, 500);

    metadata.source = CURR_SERVICE_NAME;
    metadata.updatedAt = new Date().toISOString();

    if (!contestId) {
      metadata.success = false;
      metadata.message = "contestId is required.";
      await publishToRedisPubSub("response", JSON.stringify({ data: { result: null }, metadata }));
      return;
    }

    let leaderboard = await getLeaderboardCache(contestId);
    if (!leaderboard) {
      leaderboard = await getLeaderboardForContest(contestId, limit);
      await setLeaderboardCache(contestId, leaderboard);
    } else if (leaderboard.length > limit) {
      leaderboard = leaderboard.slice(0, limit);
    }

    const responseData = { result: leaderboard, contestId };
    metadata.success = true;
    metadata.message = "Leaderboard fetched successfully.";
    await publishToRedisPubSub("response", JSON.stringify({ data: responseData, metadata }));
  } catch (error) {
    console.log("Error in handleGetLeaderboard:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.success = false;
    metadata.message = "Something went wrong while fetching leaderboard.";
    metadata.updatedAt = new Date().toISOString();
    await publishToRedisPubSub("response", JSON.stringify({ data: { result: [] }, metadata }));
  }
};

export { handleGetLeaderboard };
