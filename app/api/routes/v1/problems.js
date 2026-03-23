import express from "express";
import { isRegisteredUserTokenIsPresentMiddleware } from "../../middlewares/v1/auth.js";
import { controlCreateNewProblemController, controlDeleteProblemController, controlGetSpecificProblemDetailsController, controlSearchProblemsController, controlUpdateProblemController, getAllProblemsController, getSpecificProblemDetailsController, searchProblemsController } from "../../controllers/v1/problems.js";

// Creating The Router 
const problemsRouter = express.Router();



// Routes


// Normal Usage Routes


/**
 * @problemsRouter /api/v1/problems/search
 * @description Search Problems with or without filters 
 * @access public
 * @method POST
 */
problemsRouter.post("/search", searchProblemsController);




/**
 * @problemsRouter /api/v1/problems/all
 * @description Get All Problems
 * @access public
 * @method GET
 */
problemsRouter.get("/all", getAllProblemsController);




/**
 * @problemsRouter /api/v1/problems/:slug
 * @description Get Details of Specific Problem's Details
 * @access public
 * @method GET
 */
problemsRouter.get("/:slug", getSpecificProblemDetailsController);
















// Control Panel Usage Routes


/**
 * @problemsRouter /api/v1/problems/control/search
 * @description Search Problems with or without filters 
 * @access private
 * @method POST
 */
problemsRouter.post("/control/search", isRegisteredUserTokenIsPresentMiddleware, controlSearchProblemsController);




/**
 * @problemsRouter /api/v1/problems/control/:slug
 * @description Get Details of Specific Problem's Details
 * @access private
 * @method GET
 */
problemsRouter.get("/control/:slug", isRegisteredUserTokenIsPresentMiddleware, controlGetSpecificProblemDetailsController);




/**
 * @problemsRouter /api/v1/problems/control/create
 * @description Create New Problem
 * @access private
 * @method POST
 */
problemsRouter.post("/control/create", isRegisteredUserTokenIsPresentMiddleware, controlCreateNewProblemController);




/**
 * @problemsRouter /api/v1/problems/control/update
 * @description Update Existing Problem
 * @access private
 * @method PUT
 */
problemsRouter.put("/control/update", isRegisteredUserTokenIsPresentMiddleware, controlUpdateProblemController);




/**
 * @problemsRouter /api/v1/problems/control/delete
 * @description Delete Specific Problem
 * @access private
 * @method DELETE
 */
problemsRouter.delete("/control/delete", isRegisteredUserTokenIsPresentMiddleware, controlDeleteProblemController);








// Exporting the router
export default problemsRouter;