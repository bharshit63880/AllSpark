import express from "express";
import { createNewPermissionController, deletePermissionController, getSpecificPermissionDetailsController, searchPermissionsController, updatePermissionController } from "../../controllers/v1/permissions.js";
import { isRegisteredUserTokenIsPresentMiddleware } from "../../middlewares/v1/auth.js";

// Creating The Router 
const permissionsRouter = express.Router();


// Routes




/**
 * @permissionsRouter /api/v1/permissions/search
 * @description Search Permissions with or without filters 
 * @access private
 * @method POST
 */
permissionsRouter.post("/search", isRegisteredUserTokenIsPresentMiddleware, searchPermissionsController);




/**
 * @permissionsRouter /api/v1/permissions/:slug
 * @description Get Details of Specific Permission's Details
 * @access private
 * @method GET
 */
permissionsRouter.get("/:slug", isRegisteredUserTokenIsPresentMiddleware, getSpecificPermissionDetailsController);




/**
 * @permissionsRouter /api/v1/permissions/create
 * @description Create New Permission
 * @access private
 * @method POST
 */
permissionsRouter.post("/create", isRegisteredUserTokenIsPresentMiddleware, createNewPermissionController);




/**
 * @permissionsRouter /api/v1/permissions/update
 * @description Update Existing Permission
 * @access private
 * @method PUT
 */
permissionsRouter.put("/update", isRegisteredUserTokenIsPresentMiddleware, updatePermissionController);




/**
 * @permissionsRouter /api/v1/permissions/delete
 * @description Delete Specific Permission
 * @access private
 * @method DELETE
 */
permissionsRouter.delete("/delete", isRegisteredUserTokenIsPresentMiddleware, deletePermissionController);




// Exporting the router
export default permissionsRouter;