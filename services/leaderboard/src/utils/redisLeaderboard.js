import { redis as redisClient } from "../../config/v1/redis.js";

const getLeaderboardCache = async (contestId) => {
    const key = `leaderboard:contest:${contestId}:cache`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
};

const setLeaderboardCache = async (contestId, leaderboard, ttlSeconds = 15) => {
    const key = `leaderboard:contest:${contestId}:cache`;
    await redisClient.setex(key, ttlSeconds, JSON.stringify(leaderboard));
};

const getLeaderboardForContest = async (contestId, limit = 100) => {
    const key = `leaderboard:contest:${contestId}:scores`;
    const scores = await redisClient.zrevrange(key, 0, limit - 1, "WITHSCORES");
    const contestStartMinutes = await getContestStartTime(contestId);

    const rankedUsers = [];
    for (let i = 0; i < scores.length; i += 2) {
        rankedUsers.push({
            rank: (i / 2) + 1,
            userId: scores[i],
            score: Number(scores[i + 1]) || 0,
        });
    }

    const metaList = await Promise.all(
        rankedUsers.map(({ userId }) => getUserContestMeta(contestId, userId))
    );
    const leaderboard = rankedUsers.map((entry, index) => {
        const meta = metaList[index] && typeof metaList[index] === "object" ? metaList[index] : {};
        const solvedEntries = Object.values(meta).filter((problemMeta) => problemMeta?.solvedAt);
        const solvedCount = solvedEntries.length;
        const totalPenaltyMinutes = solvedEntries.reduce((sum, problemMeta) => {
            const solvedAtMinutes = problemMeta?.solvedAt ? Math.floor(new Date(problemMeta.solvedAt).getTime() / 60000) : null;
            if (solvedAtMinutes == null || !Number.isFinite(solvedAtMinutes) || !Number.isFinite(Number(contestStartMinutes))) {
                return sum;
            }

            return sum + Math.max(0, solvedAtMinutes - Number(contestStartMinutes)) + 20 * (problemMeta?.wrongAttempts || 0);
        }, 0);
        const lastSolvedAt = solvedEntries.length
            ? solvedEntries
                .map((problemMeta) => new Date(problemMeta.solvedAt))
                .sort((a, b) => b.getTime() - a.getTime())[0]
                .toISOString()
            : null;
        const completionMinutes = lastSolvedAt && Number.isFinite(Number(contestStartMinutes))
            ? Math.max(0, Math.floor((new Date(lastSolvedAt).getTime() / 60000) - Number(contestStartMinutes)))
            : 0;

        return {
            rank: entry.rank,
            userId: entry.userId,
            userName: entry.userId,
            score: entry.score,
            solvedCount,
            starsEarned: solvedCount * 10,
            totalPenaltyMinutes,
            completionMinutes,
            lastSolvedAt,
        };
    });

    return leaderboard;
};

const getUserContestMeta = async (contestId, userId) => {
    const key = `leaderboard:contest:${contestId}:user:${userId}`;
    const data = await redisClient.get(key);
    if (!data) {
        return {};
    }

    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {};
    }

    return parsed;
};

const setUserContestMeta = async (contestId, userId, meta) => {
    const key = `leaderboard:contest:${contestId}:user:${userId}`;
    await redisClient.set(key, JSON.stringify(meta));
};

const getContestStartTime = async (contestId) => {
    const key = `leaderboard:contest:${contestId}:start`;
    const time = await redisClient.get(key);
    return time == null ? null : Number(time);
};

const setContestStartTime = async (contestId, startTime) => {
    const key = `leaderboard:contest:${contestId}:start`;
    await redisClient.set(key, String(Number(startTime)));
};

const updateUserScore = async (contestId, userId, score) => {
    const key = `leaderboard:contest:${contestId}:scores`;
    await redisClient.zadd(key, score, userId);
};

const invalidateLeaderboardCache = async (contestId) => {
    const key = `leaderboard:contest:${contestId}:cache`;
    await redisClient.del(key);
};

export {
    getLeaderboardCache,
    setLeaderboardCache,
    getLeaderboardForContest,
    getUserContestMeta,
    setUserContestMeta,
    getContestStartTime,
    setContestStartTime,
    updateUserScore,
    invalidateLeaderboardCache,
};
