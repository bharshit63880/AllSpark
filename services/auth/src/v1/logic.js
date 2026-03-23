import "dotenv/config";
import { sendEvent } from "../../src/utils/kafkaProducer.js";
import { kafka } from "../../config/v1/kafka.js";
import { signToken, verifyToken } from "../../src/utils/jwt.js";
import { publishToRedisPubSub } from "../../src/utils/redisPublisher.js";
import getPartition from "../../src/utils/getPartition.js";
import { handleForgotPassword } from "./handlers/forgotPassword.js";
import { handleVerifyOtp } from "./handlers/verifyOtp.js";
import { handleResetPassword } from "./handlers/resetPassword.js";
import {
    handlePrepareSignupVerification,
    handleResendSignupOtp,
    handleVerifySignupOtp,
    finalizeSignupVerification,
} from "./handlers/signupVerification.js";

const CURR_SERVICE_NAME = "auth-service";

const PERMISSION_SERVICE_NAMES = ["permission-service", "permissions-service"];
const USER_SERVICE_NAMES = ["user-service", "users-service"];

const checkIdentity = async (data, metadata) => {
    try {
        const token = metadata?.actor?.token || "";
        const partition = getPartition();

        metadata.source = CURR_SERVICE_NAME;
        metadata.actor = metadata.actor || {};

        let isTokenVerified = false;
        let userData = {};

        if (token) {
            const verified = verifyToken(token);
            isTokenVerified = verified?.isTokenVerified || false;
            userData = verified?.userData || {};
        }

        if (token && isTokenVerified) {
            metadata.actor = { ...metadata.actor, ...userData };
        } else {
            metadata.actor = { ...metadata.actor, role: "PUBLIC" };
        }

        metadata.updatedAt = new Date().toISOString();
        await sendEvent("permissions.check", partition, data, metadata);
    } catch (error) {
        console.error("[AUTH SERVICE][checkIdentity] Error:", error);

        metadata = metadata || {};
        metadata.success = false;
        metadata.message = "Something Went Wrong while Verifying Your Identity. Please Login Again....";
        metadata.source = CURR_SERVICE_NAME;
        metadata.updatedAt = new Date().toISOString();

        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
    }
};

const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (String(password || "").length < minLength) {
        return { valid: false, message: "Password must be at least 8 characters long." };
    }
    if (!hasUpperCase) {
        return { valid: false, message: "Password must contain at least one uppercase letter." };
    }
    if (!hasLowerCase) {
        return { valid: false, message: "Password must contain at least one lowercase letter." };
    }
    if (!hasNumbers) {
        return { valid: false, message: "Password must contain at least one number." };
    }
    if (!hasSpecialChar) {
        return { valid: false, message: "Password must contain at least one special character." };
    }

    return { valid: true };
};

const handleSignup = async (data, metadata) => {
    try {
        let partition = getPartition();

        data = data || {};
        metadata = metadata || {};

        data.name = data?.name ? String(data.name).trim() : "";
        data.user_name = data?.user_name ? String(data.user_name).trim().toLowerCase() : "";
        data.email = data?.email ? String(data.email).trim().toLowerCase() : "";
        data.password = data?.password ? String(data.password) : "";
        data.mobile_no = data?.mobile_no ? String(data.mobile_no).trim() : "";

        let { name, user_name, email, password, mobile_no } = data;

        if (!name || !user_name || !email || !password || !mobile_no) {
            metadata.success = false;
            metadata.message = "Something Went Wrong Please fill all the Required Details like: name, user_name, email, password, mobile_no";
            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = new Date().toISOString();

            await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
            return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            metadata.success = false;
            metadata.message = passwordValidation.message;
            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = new Date().toISOString();

            await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
            return;
        }

        if (PERMISSION_SERVICE_NAMES.includes(metadata.source)) {
            metadata.actor = metadata.actor || {};
            metadata.actor.role = "PUBLIC";
            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = new Date().toISOString();

            await sendEvent("users.signup.precheck", partition, data, metadata);
            return;
        }

        metadata.success = false;
        metadata.message = `Invalid event source for signup: ${metadata.source || "unknown"}`;
        metadata.source = CURR_SERVICE_NAME;
        metadata.updatedAt = new Date().toISOString();

        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
    } catch (error) {
        console.error("[AUTH SERVICE][handleSignup] Error:", error);

        metadata = metadata || {};
        metadata.success = false;
        metadata.message = "Something Went Wrong while Signing Up. Please Try Again....";
        metadata.source = CURR_SERVICE_NAME;
        metadata.updatedAt = new Date().toISOString();

        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
    }
};

const issueJWT = async (data, metadata) => {
    try {
        data = data || {};
        metadata = metadata || {};

        if (!data?.result?._id) {
            metadata.success = false;
            metadata.message = "User data missing while issuing token.";
            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = new Date().toISOString();

            await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
            return;
        }

        const userData = {
            userId: data.result._id,
            name: data.result.name,
            role: data.result.role,
            user_name: data.result.user_name,
            activation_status: data.result.activation_status,
            email: data.result.email,
            mobile_no: data.result.mobile_no,
        };

        if (USER_SERVICE_NAMES.includes(metadata.source)) {
            await finalizeSignupVerification(data, metadata);
            console.log("Issuing Token....", userData);

            data.token = signToken(userData);
            metadata.success = true;
            metadata.message = "Successfully logged in....";
            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = new Date().toISOString();

            await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
            return;
        }

        metadata.success = false;
        metadata.message = `Invalid event source for issueJWT: ${metadata.source || "unknown"}`;
        metadata.source = CURR_SERVICE_NAME;
        metadata.updatedAt = new Date().toISOString();

        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
    } catch (error) {
        console.error("[AUTH SERVICE][issueJWT] Error:", error);

        metadata = metadata || {};
        metadata.success = false;
        metadata.message = "Something Went Wrong while Issuing JWT Token. Please Login Again....";
        metadata.source = CURR_SERVICE_NAME;
        metadata.updatedAt = new Date().toISOString();

        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
    }
};

const handleLogin = async (data, metadata) => {
    try {
        data = data || {};
        metadata = metadata || {};

        data.email = data?.email ? String(data.email).trim().toLowerCase() : "";
        data.user_name = data?.user_name ? String(data.user_name).trim().toLowerCase() : "";
        data.password = data?.password ? String(data.password) : "";

        const { password, email, user_name } = data;

        if (!(password && (email || user_name))) {
            metadata.success = false;
            metadata.message = "Something Went Wrong Please fill all the Required Details like: email + password or user_name + password";
            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = new Date().toISOString();

            await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
            return;
        }

        const partition = getPartition();

        if (PERMISSION_SERVICE_NAMES.includes(metadata.source)) {
            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = new Date().toISOString();

            await sendEvent("users.getUser", partition, data, metadata);
            return;
        }

        metadata.success = false;
        metadata.message = `Invalid event source for login: ${metadata.source || "unknown"}`;
        metadata.source = CURR_SERVICE_NAME;
        metadata.updatedAt = new Date().toISOString();

        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
    } catch (error) {
        console.error("[AUTH SERVICE][handleLogin] Error:", error);

        metadata = metadata || {};
        metadata.success = false;
        metadata.message = "Something Went Wrong while Logging in. Please Login Again....";
        metadata.source = CURR_SERVICE_NAME;
        metadata.updatedAt = new Date().toISOString();

        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
        return;
    }
};

const handleUnknownEvent = async (data, metadata) => {
    await publishToRedisPubSub("unknown", JSON.stringify({ data, metadata }));
};

const consumeEvents = async () => {
    try {
        const listOfTopicsToConsume = [
            "request",
            "auth.signup",
            "auth.signup.prepare",
            "auth.issueJWT",
            "auth.login",
            "auth.forgotPassword",
            "auth.verifyOtp",
            "auth.resetPassword",
            "auth.resendSignupOtp",
            "auth.verifySignupOtp",
        ];

        const handlingFunctions = {
            request: checkIdentity,
            "auth.signup": handleSignup,
            "auth.signup.prepare": handlePrepareSignupVerification,
            "auth.issueJWT": issueJWT,
            "auth.login": handleLogin,
            "auth.forgotPassword": handleForgotPassword,
            "auth.verifyOtp": handleVerifyOtp,
            "auth.resetPassword": handleResetPassword,
            "auth.resendSignupOtp": handleResendSignupOtp,
            "auth.verifySignupOtp": handleVerifySignupOtp,
        };

        const consumer = kafka.consumer({
            groupId: process.env.KAFKA_GROUP_ID || CURR_SERVICE_NAME,
        });

        await consumer.connect();
        await consumer.subscribe({ topics: listOfTopicsToConsume });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const rawMessage = message?.value?.toString() || "{}";
                    console.log(`${CURR_SERVICE_NAME}: [${topic}]: PART:${partition}:`, rawMessage);

                    const info = JSON.parse(rawMessage);
                    const { data, metadata } = info;

                    if (handlingFunctions[topic]) {
                        await handlingFunctions[topic](data, metadata);
                    } else {
                        await handleUnknownEvent(data, metadata);
                    }
                } catch (error) {
                    console.error(`[AUTH SERVICE][consumeEvents][${topic}] Error:`, error);
                }
            },
        });
    } catch (error) {
        console.error("[AUTH SERVICE][consumeEvents] Error:", error);
        console.log("Something went wrong while consuming the Creating event....");
        throw error;
    }
};

export default consumeEvents;
