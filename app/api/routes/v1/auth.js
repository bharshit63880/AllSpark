import express from "express";
import {
    signupController,
    loginController,
    forgotPasswordController,
    resendSignupOtpController,
    verifySignupOtpController,
    verifyOtpController,
    resetPasswordController,
} from "../../controllers/v1/auth.js";


// Creating The Router 
const authRouter = express.Router();

// Routes




/**
 * @authRouter /api/v1/auth/signup
 * @description Send User's Information for Sign Up
 * @access public
 * @method POST
 */
authRouter.post("/signup", signupController);




/**
 * @authRouter /api/v1/auth/login
 * @description Send User's Information for Login
 * @access public
 * @method POST
 */
authRouter.post("/login", loginController);



/**
 * @authRouter /api/v1/auth/forgot-password
 * @description Request password reset OTP (sent to email via Kafka)
 * @access public
 * @method POST
 * @body { email }
 */
authRouter.post("/forgot-password", forgotPasswordController);

/**
 * @authRouter /api/v1/auth/resend-signup-otp
 * @description Resend email verification OTP for signup flow
 * @access public
 * @method POST
 * @body { email }
 */
authRouter.post("/resend-signup-otp", resendSignupOtpController);

/**
 * @authRouter /api/v1/auth/verify-signup-otp
 * @description Verify signup email OTP and activate account
 * @access public
 * @method POST
 * @body { email, otp }
 */
authRouter.post("/verify-signup-otp", verifySignupOtpController);



/**
 * @authRouter /api/v1/auth/verify-otp
 * @description Verify OTP for password reset
 * @access public
 * @method POST
 * @body { email, otp }
 */
authRouter.post("/verify-otp", verifyOtpController);



/**
 * @authRouter /api/v1/auth/reset-password
 * @description Set new password after OTP verified
 * @access public
 * @method POST
 * @body { email, newPassword }
 */
authRouter.post("/reset-password", resetPasswordController);




// Exporting the router
export default authRouter;
