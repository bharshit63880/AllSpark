import express from "express";
import { isRegisteredUserTokenIsPresentMiddleware } from "../../middlewares/v1/auth.js";
import { controlCreateNewContestController, controlDeleteContestController, controlGetSpecificContestDetailsController, controlSearchContestsController, controlUpdateContestController, getAllContestsController, getLeaderboardByContestIdController, getSpecificContestDetailsController, registerLoggedInUserInSpecificContestController, searchContestsController, startSpecificContestForLoggedInUserController } from "../../controllers/v1/contests.js";

// Creating The Router 
const contestsRouter = express.Router();



// Routes


// Normal Usage Routes


/**
 * @contestsRouter /api/v1/contests/search
 * @description Search Contests with or without filters 
 * @access public
 * @method POST
 */
contestsRouter.post("/search", searchContestsController);




/**
 * @contestsRouter /api/v1/contests/all
 * @description Get All Contests
 * @access public
 * @method GET
 */
contestsRouter.get("/all", getAllContestsController);




/**
 * @contestsRouter /api/v1/contests/:contestId/leaderboard
 * @description Get leaderboard for a contest (response via WebSocket)
 * @access public (requires client-id header and WebSocket for response)
 * @method GET
 */
contestsRouter.get("/:contestId/leaderboard", getLeaderboardByContestIdController);


/**
 * @contestsRouter /api/v1/contests/:slug
 * @description Get Details of Specific Contest's Details
 * @access public
 * @method GET
 */
contestsRouter.get("/:slug", getSpecificContestDetailsController);




/**
 * @contestsRouter /api/v1/contests/register
 * @description Register in Specific Contest For Logged in User
 * @access protected
 * @method POST
 */
contestsRouter.post("/register", isRegisteredUserTokenIsPresentMiddleware, registerLoggedInUserInSpecificContestController);




/**
 * @contestsRouter /api/v1/contests/start
 * @description Start Specific Contest For Logged in User
 * @access protected
 * @method POST
 */
contestsRouter.post("/start", isRegisteredUserTokenIsPresentMiddleware, startSpecificContestForLoggedInUserController);
















// Control Panel Usage Routes


/**
 * @contestsRouter /api/v1/contests/control/search
 * @description Search Contests with or without filters 
 * @access private
 * @method POST
 */
contestsRouter.post("/control/search", isRegisteredUserTokenIsPresentMiddleware, controlSearchContestsController);




/**
 * @contestsRouter /api/v1/contests/control/:slug
 * @description Get Details of Specific Contest's Details
 * @access private
 * @method GET
 */
contestsRouter.get("/control/:slug", isRegisteredUserTokenIsPresentMiddleware, controlGetSpecificContestDetailsController);




/**
 * @contestsRouter /api/v1/contests/control/create
 * @description Create New Contest
 * @access private
 * @method POST
 */
contestsRouter.post("/control/create", isRegisteredUserTokenIsPresentMiddleware, controlCreateNewContestController);




/**
 * @contestsRouter /api/v1/contests/control/update
 * @description Update Existing Contest
 * @access private
 * @method PUT
 */
contestsRouter.put("/control/update", isRegisteredUserTokenIsPresentMiddleware, controlUpdateContestController);




/**
 * @contestsRouter /api/v1/contests/control/delete
 * @description Delete Specific Contest
 * @access private
 * @method DELETE
 */
contestsRouter.delete("/control/delete", isRegisteredUserTokenIsPresentMiddleware, controlDeleteContestController);








// Exporting the router
export default contestsRouter;