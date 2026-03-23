import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { sendEvent } from "../../utils/v1/kafkaProducer.js";
import getPartition from "../../utils/v1/getPartition.js";

const CURR_SERVICE_NAME = "api";
const DEFAULT_PARTITIONS_OF_KAFKA_TOPICS = process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS || 4;
const DEFAULT_TOPIC_TO_PUBLISH = process.env.DEFAULT_TOPIC_TO_PUBLISH || "request";

const getClientIdOrFail = (req, res) => {
    const clientId = req.get("client-id");

    if (!clientId || !String(clientId).trim()) {
        res.status(400).json({
            success: false,
            message: "WebSocket client id is missing. Please reconnect and try again.",
        });
        return null;
    }

    return String(clientId).trim();
};

const signupController = async (req, res) => {
    try {
        const { name, user_name, email, password, mobile_no } = req.body || {};

        if (!name || !user_name || !email || !password || !mobile_no) {
            return res.status(400).json({
                success: false,
                message: "Please Provide All the Required Fields like: name, user_name, email, password, mobile_no....",
            });
        }

        const clientId = getClientIdOrFail(req, res);
        if (!clientId) return;

        const requestId = uuidv4();
        const createdAt = new Date().toISOString();

        const data = {
            name: String(name).trim(),
            user_name: String(user_name).trim().toLowerCase(),
            email: String(email).trim().toLowerCase(),
            password: String(password),
            mobile_no: String(mobile_no).trim(),
        };

        const metadata = {
            clientId,
            requestId,
            actor: {
                role: "PUBLIC",
            },
            operation: "signup",
            createdAt,
            source: CURR_SERVICE_NAME,
            updatedAt: new Date().toISOString(),
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);

        return res.status(202).json({
            success: true,
            message: "Signup Request is Accepted Successfully....",
            requestId,
        });
    } catch (error) {
        console.error("[API][signupController] Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Signing Up....",
        });
    }
};

const loginController = async (req, res) => {
    try {
        const { user_name, email, password } = req.body || {};

        if (!(password && (user_name || email))) {
            return res.status(400).json({
                success: false,
                message: "Please Provide All the Required Fields like: email + password or user_name + password....",
            });
        }

        const clientId = getClientIdOrFail(req, res);
        if (!clientId) return;

        const requestId = uuidv4();
        const createdAt = new Date().toISOString();

        const data = {
            user_name: user_name ? String(user_name).trim().toLowerCase() : "",
            email: email ? String(email).trim().toLowerCase() : "",
            password: String(password),
        };

        const metadata = {
            clientId,
            requestId,
            actor: {
                role: "PUBLIC",
            },
            operation: "login",
            createdAt,
            source: CURR_SERVICE_NAME,
            updatedAt: new Date().toISOString(),
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);

        return res.status(202).json({
            success: true,
            message: "Login Request is Accepted Successfully....",
            requestId,
        });
    } catch (error) {
        console.error("[API][loginController] Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Logging In....",
        });
    }
};

const forgotPasswordController = async (req, res) => {
    try {
        const { email } = req.body || {};

        if (!email || !String(email).trim()) {
            return res.status(400).json({
                success: false,
                message: "Email is required.",
            });
        }

        const clientId = getClientIdOrFail(req, res);
        if (!clientId) return;

        const requestId = uuidv4();

        const data = {
            email: String(email).trim().toLowerCase(),
        };

        const metadata = {
            clientId,
            requestId,
            actor: { role: "PUBLIC" },
            operation: "auth.forgotPassword",
            createdAt: new Date().toISOString(),
            source: CURR_SERVICE_NAME,
            updatedAt: new Date().toISOString(),
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);

        return res.status(202).json({
            success: true,
            message: "If this email is registered, you will receive an OTP shortly.",
            requestId,
        });
    } catch (error) {
        console.error("[API][forgotPasswordController] Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while requesting password reset.",
        });
    }
};

const resendSignupOtpController = async (req, res) => {
    try {
        const { email } = req.body || {};

        if (!email || !String(email).trim()) {
            return res.status(400).json({
                success: false,
                message: "Email is required.",
            });
        }

        const clientId = getClientIdOrFail(req, res);
        if (!clientId) return;

        const requestId = uuidv4();

        const data = {
            email: String(email).trim().toLowerCase(),
        };

        const metadata = {
            clientId,
            requestId,
            actor: { role: "PUBLIC" },
            operation: "auth.resendSignupOtp",
            createdAt: new Date().toISOString(),
            source: CURR_SERVICE_NAME,
            updatedAt: new Date().toISOString(),
        };

        await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);

        return res.status(202).json({
            success: true,
            message: "Signup OTP resend request accepted.",
            requestId,
        });
    } catch (error) {
        console.error("[API][resendSignupOtpController] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while resending signup OTP.",
        });
    }
};

const verifySignupOtpController = async (req, res) => {
    try {
        const { email, otp } = req.body || {};

        if (!email || !String(email).trim() || otp === undefined || otp === null || String(otp).trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required.",
            });
        }

        const clientId = getClientIdOrFail(req, res);
        if (!clientId) return;

        const requestId = uuidv4();

        const data = {
            email: String(email).trim().toLowerCase(),
            otp: String(otp).trim(),
        };

        const metadata = {
            clientId,
            requestId,
            actor: { role: "PUBLIC" },
            operation: "auth.verifySignupOtp",
            createdAt: new Date().toISOString(),
            source: CURR_SERVICE_NAME,
            updatedAt: new Date().toISOString(),
        };

        await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);

        return res.status(202).json({
            success: true,
            message: "Signup OTP verification request accepted. Response will be sent via WebSocket.",
            requestId,
        });
    } catch (error) {
        console.error("[API][verifySignupOtpController] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while verifying signup OTP.",
        });
    }
};

const verifyOtpController = async (req, res) => {
    try {
        const { email, otp } = req.body || {};

        if (!email || !String(email).trim() || otp === undefined || otp === null || String(otp).trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required.",
            });
        }

        const clientId = getClientIdOrFail(req, res);
        if (!clientId) return;

        const requestId = uuidv4();

        const data = {
            email: String(email).trim().toLowerCase(),
            otp: String(otp).trim(),
        };

        const metadata = {
            clientId,
            requestId,
            actor: { role: "PUBLIC" },
            operation: "auth.verifyOtp",
            createdAt: new Date().toISOString(),
            source: CURR_SERVICE_NAME,
            updatedAt: new Date().toISOString(),
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);

        return res.status(202).json({
            success: true,
            message: "OTP verification request accepted. Response will be sent via WebSocket.",
            requestId,
        });
    } catch (error) {
        console.error("[API][verifyOtpController] Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while verifying OTP.",
        });
    }
};

const resetPasswordController = async (req, res) => {
    try {
        const { email, newPassword, otp } = req.body || {};

        if (!email || !String(email).trim() || !newPassword || !String(newPassword).trim()) {
            return res.status(400).json({
                success: false,
                message: "Email and new password are required.",
            });
        }

        const clientId = getClientIdOrFail(req, res);
        if (!clientId) return;

        const requestId = uuidv4();

        const data = {
            email: String(email).trim().toLowerCase(),
            otp: otp === undefined || otp === null ? undefined : String(otp).trim(),
            newPassword: String(newPassword),
        };

        const metadata = {
            clientId,
            requestId,
            actor: { role: "PUBLIC" },
            operation: "auth.resetPassword",
            createdAt: new Date().toISOString(),
            source: CURR_SERVICE_NAME,
            updatedAt: new Date().toISOString(),
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);

        return res.status(202).json({
            success: true,
            message: "Password reset request accepted. Response will be sent via WebSocket.",
            requestId,
        });
    } catch (error) {
        console.error("[API][resetPasswordController] Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while resetting password.",
        });
    }
};

export {
    signupController,
    loginController,
    forgotPasswordController,
    resendSignupOtpController,
    verifySignupOtpController,
    verifyOtpController,
    resetPasswordController,
};
