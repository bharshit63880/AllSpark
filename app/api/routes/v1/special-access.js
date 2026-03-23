import express from "express";
import { isRegisteredUserTokenIsPresentMiddleware } from "../../middlewares/v1/auth.js";
import {
  createSpecialAccessRequestController,
  getMySpecialAccessRequestsController,
  getSpecificSpecialAccessRequestController,
} from "../../controllers/v1/special-access.js";

// Creating The Router 
const specialAccessRouter = express.Router();


// Routes
specialAccessRouter.post(
  "/create",
  isRegisteredUserTokenIsPresentMiddleware,
  createSpecialAccessRequestController
);
specialAccessRouter.get(
  "/my",
  isRegisteredUserTokenIsPresentMiddleware,
  getMySpecialAccessRequestsController
);
specialAccessRouter.get(
  "/:id",
  isRegisteredUserTokenIsPresentMiddleware,
  getSpecificSpecialAccessRequestController
);

// Exporting the router
export default specialAccessRouter;
