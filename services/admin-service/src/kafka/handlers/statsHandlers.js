import Stats from "../../models/Stats.js";
import { publishToRedisPubSub } from "../../utils/redisPublisher.js";
import mongoose from "mongoose";

const CURR_SERVICE_NAME = "admin-service";

export const getDashboardSnapshot = async () => {
  const doc = await Stats.getOrCreate();
  const db = mongoose.connection?.db;

  const safeCount = async (collectionName, filter = {}) => {
    try {
      if (!db) return 0;
      return await db.collection(collectionName).countDocuments(filter);
    } catch {
      return 0;
    }
  };

  const [
    usersCount,
    contestsCount,
    problemsCount,
    submissionsCount,
    supportTicketsCount,
    supportOpenCount,
    supportInReviewCount,
    supportResolvedCount,
    supportEligibleCount,
  ] = await Promise.all([
    safeCount("users"),
    safeCount("contests"),
    safeCount("problems"),
    safeCount("submissions"),
    safeCount("support_tickets"),
    safeCount("support_tickets", { status: "OPEN" }),
    safeCount("support_tickets", { status: "IN_REVIEW" }),
    safeCount("support_tickets", { status: "RESOLVED" }),
    safeCount("support_tickets", { eligible_for_special_access: true }),
  ]);

  doc.totalUsers = usersCount;
  doc.totalContests = contestsCount;
  doc.totalProblems = problemsCount;
  doc.totalSubmissions = submissionsCount;
  await doc.save();

  return {
    totals: {
      totalUsers: doc.totalUsers,
      totalContests: doc.totalContests,
      totalProblems: doc.totalProblems,
      totalSubmissions: doc.totalSubmissions,
      supportTickets: supportTicketsCount,
      supportOpen: supportOpenCount,
      supportInReview: supportInReviewCount,
      supportResolved: supportResolvedCount,
      supportEligible: supportEligibleCount,
    },
    systemStatus: doc.systemStatus,
    lastUpdatedAt: doc.updatedAt,
  };
};

const emitDashboardUpdate = async () => {
  const snapshot = await getDashboardSnapshot();
  const payload = JSON.stringify({
    type: "admin.dashboard.update",
    data: {
      result: {
        totals: snapshot.totals,
        systemStatus: snapshot.systemStatus,
        lastUpdatedAt: snapshot.lastUpdatedAt,
      },
    },
  });
  await publishToRedisPubSub("admin:dashboard:live", payload);
};

export const handleUsersCreated = async () => {
  const doc = await Stats.getOrCreate();
  doc.totalUsers += 1;
  await doc.save();
  await emitDashboardUpdate();
};

export const handleUsersDeleted = async () => {
  const doc = await Stats.getOrCreate();
  doc.totalUsers = Math.max(0, doc.totalUsers - 1);
  await doc.save();
  await emitDashboardUpdate();
};

export const handleContestsCreated = async () => {
  const doc = await Stats.getOrCreate();
  doc.totalContests += 1;
  await doc.save();
  await emitDashboardUpdate();
};

export const handleProblemsCreated = async () => {
  const doc = await Stats.getOrCreate();
  doc.totalProblems += 1;
  await doc.save();
  await emitDashboardUpdate();
};

export const handleSubmissionsCreated = async () => {
  const doc = await Stats.getOrCreate();
  doc.totalSubmissions += 1;
  await doc.save();
  await emitDashboardUpdate();
};
