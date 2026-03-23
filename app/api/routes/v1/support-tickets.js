import express from "express";
import { isRegisteredUserTokenIsPresentMiddleware } from "../../middlewares/v1/auth.js";
import {
  createSupportTicketController,
  getMySupportTicketsController,
  getSupportFaqsController,
  getSpecificSupportTicketController,
} from "../../controllers/v1/support-tickets.js";

// Creating The Router 
const supportTicketsRouter = express.Router();


// Routes
supportTicketsRouter.post(
  "/create",
  isRegisteredUserTokenIsPresentMiddleware,
  createSupportTicketController
);
supportTicketsRouter.get(
  "/my",
  isRegisteredUserTokenIsPresentMiddleware,
  getMySupportTicketsController
);
supportTicketsRouter.get(
  "/faqs",
  isRegisteredUserTokenIsPresentMiddleware,
  getSupportFaqsController
);
supportTicketsRouter.get(
  "/:id",
  isRegisteredUserTokenIsPresentMiddleware,
  getSpecificSupportTicketController
);

// Exporting the router
export default supportTicketsRouter;
