import express from "express";
import { isRegisteredUserTokenIsPresentMiddleware } from "../../middlewares/v1/auth.js";
import { isAdminMiddleware, isSupportOrAdminMiddleware } from "../../middlewares/v1/admin.js";
import {
  getAdminDashboardController,
  getAllUsersForAdminController,
  getUserByIdForAdminController,
  createUserForAdminController,
  updateUserForAdminController,
  banUserController,
  unbanUserController,
  deleteUserForAdminController,
  getContestsForAdminController,
  getContestByIdForAdminController,
  getProblemsForAdminController,
  getProblemByIdForAdminController,
  createProblemForAdminController,
  editProblemForAdminController,
  deleteProblemForAdminController,
  createContestForAdminController,
  editContestForAdminController,
  deleteContestForAdminController,
  getAllSubmissionsForAdminController,
  getSubmissionByIdForAdminController,
  deleteSubmissionForAdminController,
  getLogsForAdminController,
  getLeaderboardForAdminController,
  getSupportTicketsForAdminController,
  updateSupportTicketForAdminController,
  getSpecialAccessRequestsForAdminController,
  updateSpecialAccessRequestForAdminController,
} from "../../controllers/v1/admin.js";

const adminRouter = express.Router();

// All admin routes require auth + admin role
const adminProtect = [isRegisteredUserTokenIsPresentMiddleware, isAdminMiddleware];
const supportProtect = [isRegisteredUserTokenIsPresentMiddleware, isSupportOrAdminMiddleware];

adminRouter.get("/dashboard", supportProtect, getAdminDashboardController);
adminRouter.post("/dashboard", supportProtect, getAdminDashboardController);

// Users
adminRouter.get("/users", adminProtect, getAllUsersForAdminController);
adminRouter.get("/users/:id", adminProtect, getUserByIdForAdminController);
adminRouter.post("/users/create", adminProtect, createUserForAdminController);
adminRouter.put("/users/update", adminProtect, updateUserForAdminController);
adminRouter.post("/users/ban", adminProtect, banUserController);
adminRouter.post("/users/unban", adminProtect, unbanUserController);
adminRouter.delete("/users/delete", adminProtect, deleteUserForAdminController);

// Problems
adminRouter.get("/problems", adminProtect, getProblemsForAdminController);
adminRouter.get("/problems/:id", adminProtect, getProblemByIdForAdminController);
adminRouter.post("/problems/create", adminProtect, createProblemForAdminController);
adminRouter.put("/problems/update", adminProtect, editProblemForAdminController);
adminRouter.delete("/problems/delete", adminProtect, deleteProblemForAdminController);

// Contests
adminRouter.get("/contests", adminProtect, getContestsForAdminController);
adminRouter.get("/contests/:id", adminProtect, getContestByIdForAdminController);
adminRouter.post("/contests/create", adminProtect, createContestForAdminController);
adminRouter.put("/contests/update", adminProtect, editContestForAdminController);
adminRouter.delete("/contests/delete", adminProtect, deleteContestForAdminController);

// Submissions / logs / leaderboard / support
adminRouter.get("/submissions", adminProtect, getAllSubmissionsForAdminController);
adminRouter.get("/submissions/:id", adminProtect, getSubmissionByIdForAdminController);
adminRouter.delete("/submissions/delete", adminProtect, deleteSubmissionForAdminController);
adminRouter.get("/logs", adminProtect, getLogsForAdminController);
adminRouter.get("/leaderboard", adminProtect, getLeaderboardForAdminController);
adminRouter.get("/support-tickets", supportProtect, getSupportTicketsForAdminController);
adminRouter.put("/support-tickets/update", supportProtect, updateSupportTicketForAdminController);
adminRouter.get("/special-access", supportProtect, getSpecialAccessRequestsForAdminController);
adminRouter.put("/special-access/update", supportProtect, updateSpecialAccessRequestForAdminController);

export default adminRouter;
