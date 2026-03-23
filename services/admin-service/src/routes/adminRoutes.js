import express from "express";
import { requireAdminRole } from "../permissions/rbac.js";
import { getDashboard } from "../controllers/dashboardController.js";
import { getUsers, deleteUser } from "../controllers/usersController.js";
import {
  createContest,
  updateContest,
  deleteContest,
} from "../controllers/contestsController.js";
import { createProblem, deleteProblem } from "../controllers/problemsController.js";

const router = express.Router();

router.use(requireAdminRole);

router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.delete("/users/:id", deleteUser);
router.post("/contests", createContest);
router.put("/contests/:id", updateContest);
router.delete("/contests/:id", deleteContest);
router.post("/problems", createProblem);
router.delete("/problems/:id", deleteProblem);

export default router;
