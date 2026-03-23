import express from "express";
import { isRegisteredUserTokenIsPresentMiddleware } from "../../middlewares/v1/auth.js";
import { createSubmissionForContestProblemController, createSubmissionForPracticeProblemController, getAllSubmissionOfUserForSpecificProblemController, getSubmissionByIdController } from "../../controllers/v1/submissions.js";

// Creating The Router 
const submissionRouter = express.Router();


// Routes


// Normal Usage Routes


/**
 * @submissionRouter /api/v1/submissions/:_id
 * @description Get Submission with the _id
 * @access public
 * @method GET
 */
submissionRouter.get("/:_id", getSubmissionByIdController);




/**
 * @submissionRouter /api/v1/submissions/all/:problem_id
 * @description Get All Submissions of Specific Problem Made by the Logged In User
 * @access protected
 * @method GET
 */
submissionRouter.get("/all/:problem_id", isRegisteredUserTokenIsPresentMiddleware, getAllSubmissionOfUserForSpecificProblemController);




/**
 * @submissionRouter /api/v1/submissions/practice/create
 * @description Create Submission for the Practice Problem
 * @access protected
 * @method POST
 */
submissionRouter.post("/practice/create", isRegisteredUserTokenIsPresentMiddleware, createSubmissionForPracticeProblemController);



/**
 * @submissionRouter /api/v1/submissions/contest/create
 * @description Create Submission for the Contest Problem
 * @access protected
 * @method POST
 */
submissionRouter.post("/contest/create", isRegisteredUserTokenIsPresentMiddleware, createSubmissionForContestProblemController);







// Exporting the router
export default submissionRouter;