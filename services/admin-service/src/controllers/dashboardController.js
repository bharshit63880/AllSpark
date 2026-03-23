import Stats from "../models/Stats.js";

export const getDashboard = async (req, res) => {
  try {
    const doc = await Stats.getOrCreate();
    return res.status(200).json({
      success: true,
      data: {
        totals: {
          totalUsers: doc.totalUsers,
          totalContests: doc.totalContests,
          totalProblems: doc.totalProblems,
          totalSubmissions: doc.totalSubmissions,
        },
        systemStatus: doc.systemStatus,
        lastUpdatedAt: doc.updatedAt,
      },
    });
  } catch (error) {
    console.error("Dashboard controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get dashboard stats.",
      error: error.message,
    });
  }
};
