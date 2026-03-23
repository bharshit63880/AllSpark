import express from "express";
import { isRegisteredUserTokenIsPresentMiddleware } from "../../middlewares/v1/auth.js";
import { createNewUserController, deleteUserController, getSpecificUserDetailsController, searchUsersController, updateUserController } from "../../controllers/v1/users.js";

// Creating The Router 
const usersRouter = express.Router();


// Routes




/**
 * @usersRouter /api/v1/users/search
 * @description Search Permissions with or without filters 
 * @access private
 * @method POST
 */
usersRouter.post("/search", isRegisteredUserTokenIsPresentMiddleware, searchUsersController);




/**
 * @usersRouter /api/v1/users/:slug
 * @description Get Details of Specific Permission's Details
 * @access private
 * @method GET
 */
usersRouter.get("/:slug", isRegisteredUserTokenIsPresentMiddleware, getSpecificUserDetailsController);




/**
 * @usersRouter /api/v1/users/create
 * @description Create New Permission
 * @access private
 * @method POST
 */
usersRouter.post("/create", isRegisteredUserTokenIsPresentMiddleware, createNewUserController);




/**
 * @usersRouter /api/v1/users/update
 * @description Update Existing Permission
 * @access private
 * @method PUT
 */
usersRouter.put("/update", isRegisteredUserTokenIsPresentMiddleware, updateUserController);




/**
 * @usersRouter /api/v1/users/delete
 * @description Delete Specific Permission
 * @access private
 * @method DELETE
 */
usersRouter.delete("/delete", isRegisteredUserTokenIsPresentMiddleware, deleteUserController);




// Exporting the router
export default usersRouter;
