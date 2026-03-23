import express from "express";
import { submitCareerInterestController } from "../../controllers/v1/careers.js";

const careersRouter = express.Router();

careersRouter.post("/submit", submitCareerInterestController);

export default careersRouter;
