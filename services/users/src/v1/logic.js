import "dotenv/config";
import bcrypt from "bcrypt";
import { kafka } from "../../config/v1/kafka.js";
import User from "../../models/v1/users.js";
import { publishToRedisPubSub } from "../utils/redisPublisher.js";
import { sendEvent } from "../utils/kafkaProducer.js";
import getPartition from "../utils/getPartition.js";


const CURR_SERVICE_NAME = "user-service";


// PLEASE NOTE: CACHING is YET TO BE IMPLEMENTED

const sanitizeUserForResponse = (user) => {
    if (!user) return user;
    const plain = typeof user.toObject === "function" ? user.toObject() : { ...user };
    delete plain.password;
    return plain;
};

const sanitizeUsersForResponse = (users) => {
    if (Array.isArray(users)) {
        return users.map((user) => sanitizeUserForResponse(user));
    }
    return sanitizeUserForResponse(users);
};

const escapeRegex = (value = "") =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findExistingUserByEmailOrUsername = async (email, user_name) => {
    return await User.findOne({
        $or: [
            { email: { $regex: `^${escapeRegex(email)}$`, $options: "i" } },
            { user_name: { $regex: `^${escapeRegex(user_name)}$`, $options: "i" } },
        ],
    }).lean();
};

const precheckSignupAvailability = async (data, metadata) => {
    try {
        if (metadata.source !== "auth-service") {
            return;
        }

        data = data || {};
        metadata = metadata || {};

        data.user_name = String(data.user_name || "").trim().toLowerCase();
        data.email = String(data.email || "").trim().toLowerCase();

        const existingUser = await findExistingUserByEmailOrUsername(data.email, data.user_name);

        metadata.source = CURR_SERVICE_NAME;
        metadata.updatedAt = (new Date()).toISOString();

        if (existingUser) {
            metadata.success = false;
            metadata.message = existingUser.email === data.email
                ? "Email already registered."
                : "Username already taken.";
            await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
            return;
        }

        await sendEvent("auth.signup.prepare", getPartition(), data, metadata);
    } catch (error) {
        console.log(error);
        metadata.success = false;
        metadata.message = "Something went wrong while validating signup details.";
        metadata.source = CURR_SERVICE_NAME;
        metadata.updatedAt = (new Date()).toISOString();
        await publishToRedisPubSub("response", JSON.stringify({ data, metadata }));
    }
};

const createUser = async (data, metadata) => {
    try {


        // const data = {
        //     name: <name>,
        //     user_name: <user_name>,
        //     email: <email>,
        //     password: <password>,
        //     mobile_no: <mobile_no>,
        // };


        // const metadata = {
        //     // Not To Be Changed Fields

        //     clientId: "<clientId>", // This is Websocket Id Which will be used for sending back the data to the client
        //     requestId: "<requestId>", // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
        //     actor: {
        //         userId: "<userId>", // This will be used to fetch details of the user from the DB if Required
        //         role: "<role>", // Role of user will be only one of these: ADMIN , CONTEST_SCHEDULER , SUPPORT , USER , PUBLIC
        //         token: "<userToken>", // This is JWT Token of the User by which we will validate the aunthenticity of User and check if he or she is allowed to have the desired operation performed
        //     },
        //     operation: "<Any Operation Name Which is To be searched onto the Permission's Table>", // This will tell about what initial request was and processing will be done as per this 
        //     createdAt: "<Date in ISO String Format>", // Time when this request was created

        //     // To be Changed Fields

        //     source: "This is The Last Service name by which this event is Generated",
        //     updatedAt: "<Date in ISO String Format>", // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        // };

        // If User Creation Request came from the Unauthorized User then he or she may want to create the Profile For themselves thus create and Ask the AUTH SERVICE to Issue JWT to that User
        let partition = getPartition();
        if (metadata.source === "auth-service") {
            data.user_name = String(data.user_name || "").trim().toLowerCase();
            data.email = String(data.email || "").trim().toLowerCase();

            const existingUser = await findExistingUserByEmailOrUsername(data.email, data.user_name);

            if (existingUser) {
                metadata.source = CURR_SERVICE_NAME;
                metadata.updatedAt = (new Date()).toISOString();
                metadata.success = false;
                metadata.message = existingUser.email === data.email
                    ? "Email already registered."
                    : "Username already taken.";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            // Set Default Role as "USER"
            data.role = "USER";
            // Set Default Activation status as "active"
            data.activation_status = "active";

            const hashedPassword = await bcrypt.hash(data.password, 12);
            const userData = {
                name: data.name,
                user_name: data.user_name,
                email: data.email,
                password: hashedPassword,
                mobile_no: data.mobile_no,
                role: data.role,
                activation_status: data.activation_status,
            };

            const user = await new User(userData).save();
            data = { ...data, result: sanitizeUserForResponse(user) };

            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!user) {
                metadata.success = false;
                metadata.message = "User Not Created. Please Input Correct Fields....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            metadata.success = true;
            metadata.message = "User Created Successfully....";

            await sendEvent("users.created", getPartition(), { _id: user._id }, {});
            await sendEvent("auth.issueJWT", partition, data, metadata);

        }
        // This has been come from the Control Panel Of ADMIN Role Possessing User Thus Send Response That It has been Created Successfully No Need to Issue JWT
        else if (metadata.source === "permission-service") {
            // Role & Activation Status Will be set by the data provided itself and data validation is checked at the API level By Default we are considering all the data is given valid however handled error things also but not data validation and all everywhere
            data.user_name = String(data.user_name || "").trim().toLowerCase();
            data.email = String(data.email || "").trim().toLowerCase();

            const existingUser = await findExistingUserByEmailOrUsername(data.email, data.user_name);

            if (existingUser) {
                metadata.source = CURR_SERVICE_NAME;
                metadata.updatedAt = (new Date()).toISOString();
                metadata.success = false;
                metadata.message = existingUser.email === data.email
                    ? "Email already registered."
                    : "Username already taken.";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            const hashedPassword = await bcrypt.hash(data.password, 12);
            const userData = {
                name: data.name,
                user_name: data.user_name,
                email: data.email,
                password: hashedPassword,
                mobile_no: data.mobile_no,
                role: data.role || "ADMIN",
                activation_status: data.activation_status || "active",
            };


            const user = await new User(userData).save();
            data = { ...data, result: sanitizeUserForResponse(user) };


            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!user) {
                metadata.success = false;
                metadata.message = "User Not Created. Please Input Correct Fields....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            metadata.success = true;
            metadata.message = "User Created Successfully....";
            await sendEvent("users.created", getPartition(), { _id: user._id }, {});
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        }



    } catch (error) {
        console.log(error);
        if (error?.code === 11000) {
            metadata.success = false;
            metadata.message = "Email or username already exists.";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
            return;
        }

        console.log("Something went wrong while handling in USER SERVICE while Creating User....");
        metadata.success = false;
        metadata.message = "Something went wrong while Creating User....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};


const searchUsers = async (data, metadata) => {
    try {


        // const data = {
        // filter: <filter>,
        // };


        // const metadata = {
        //     // Not To Be Changed Fields

        //     clientId: "<clientId>", // This is Websocket Id Which will be used for sending back the data to the client
        //     requestId: "<requestId>", // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
        //     actor: {
        //         userId: "<userId>", // This will be used to fetch details of the user from the DB if Required
        //         role: "<role>", // Role of user will be only one of these: ADMIN , CONTEST_SCHEDULER , SUPPORT , USER , PUBLIC
        //         token: "<userToken>", // This is JWT Token of the User by which we will validate the aunthenticity of User and check if he or she is allowed to have the desired operation performed
        //     },
        //     operation: "<Any Operation Name Which is To be searched onto the Permission's Table>", // This will tell about what initial request was and processing will be done as per this 
        //     createdAt: "<Date in ISO String Format>", // Time when this request was created

        //     // To be Changed Fields

        //     source: "This is The Last Service name by which this event is Generated",
        //     updatedAt: "<Date in ISO String Format>", // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        // };

        // If this has been come from the Control Panel Of ADMIN Role Possessing User Thus Send Response That It has been Found Successfully No Need to Issue JWT
        const filter = data.filter || {};


        if (metadata.source === "permission-service") {


            const user = await User.find(filter);


            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!user) {
                metadata.success = false;
                metadata.message = "Users Not Found. Please Provide Correct Credentials....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            data = { ...data, result: sanitizeUsersForResponse(user) };

            metadata.success = true;
            metadata.message = "Users Found Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        }



    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in USER SERVICE while Searching Users....");
        metadata.success = false;
        metadata.message = "Something Went Wrong while Searching Users....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};


const getSpecificUserDetails = async (data, metadata) => {
    try {


        // const data = {
        //     _id: <_id>,
        //     user_name: <user_name>,
        //     email: <email>,
        //     password: <password>,
        // };


        // const metadata = {
        //     // Not To Be Changed Fields

        //     clientId: "<clientId>", // This is Websocket Id Which will be used for sending back the data to the client
        //     requestId: "<requestId>", // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
        //     actor: {
        //         userId: "<userId>", // This will be used to fetch details of the user from the DB if Required
        //         role: "<role>", // Role of user will be only one of these: ADMIN , CONTEST_SCHEDULER , SUPPORT , USER , PUBLIC
        //         token: "<userToken>", // This is JWT Token of the User by which we will validate the aunthenticity of User and check if he or she is allowed to have the desired operation performed
        //     },
        //     operation: "<Any Operation Name Which is To be searched onto the Permission's Table>", // This will tell about what initial request was and processing will be done as per this 
        //     createdAt: "<Date in ISO String Format>", // Time when this request was created

        //     // To be Changed Fields

        //     source: "This is The Last Service name by which this event is Generated",
        //     updatedAt: "<Date in ISO String Format>", // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        // };

        // If User Get User Request came from the Unauthorized User then he or she may want to Get His Profile For themselves thus get and Ask the AUTH SERVICE to Issue JWT to that User
        let partition = getPartition();
        if (metadata.source === "auth-service") {
            const { user_name, email, password } = data;
            const filter = {};
            if (user_name) {
                filter.user_name = { $regex: `^${escapeRegex(String(user_name).trim())}$`, $options: "i" };
            }
            if (email) {
                filter.email = { $regex: `^${escapeRegex(String(email).trim())}$`, $options: "i" };
            }

            if (!password) {
                metadata.source = CURR_SERVICE_NAME;
                metadata.updatedAt = (new Date()).toISOString();
                metadata.success = false;
                metadata.message = "Password is required to login.";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            const user = await User.findOne(filter);
            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!user) {
                metadata.success = false;
                metadata.message = "Invalid credentials. Please check your email/username and password.";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            const activationStatus = String(user.activation_status || "").trim().toLowerCase();
            if (activationStatus !== "active") {
                metadata.success = false;
                metadata.message = activationStatus === "banned"
                    ? "Your account has been banned. Please contact support for further assistance."
                    : "Your account is not active yet. Please complete email verification before logging in.";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            const passwordMatches = await bcrypt.compare(password, user.password);
            if (!passwordMatches) {
                metadata.success = false;
                metadata.message = "Invalid credentials. Please check your email/username and password.";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            data = { ...data, result: sanitizeUserForResponse(user) };
            metadata.success = true;
            metadata.message = "User Found Successfully....";

            await sendEvent("auth.issueJWT", partition, data, metadata);

        }
        // This has been come from the Control Panel Of ADMIN Role Possessing User Thus Send Response That It has been Found Successfully No Need to Issue JWT
        else if (metadata.source === "permission-service") {
            const filter = {
                _id: data._id,
            };
            const user = await User.findOne(filter);

            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!user) {
                metadata.success = false;
                metadata.message = "User Not Found. Please Provide Correct Credentials....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            data = { ...data, result: sanitizeUserForResponse(user) };

            metadata.success = true;
            metadata.message = "User Found Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        }



    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in USER SERVICE while Getting Specific User Details....");
        metadata.success = false;
        metadata.message = "Something went wrong while Getting Specific User Details....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};


const updateUserDetails = async (data, metadata) => {
    try {


        // const data = {
        //     _id: <_id>,
        //     name: <name>,
        //     role: <role>,
        //     activation_status: <activation_status>,
        //     user_name: <user_name>,
        //     email: <email>,
        //     password: <password>,
        //     mobile_no: <mobile_no>,
        // };


        // const metadata = {
        //     // Not To Be Changed Fields

        //     clientId: "<clientId>", // This is Websocket Id Which will be used for sending back the data to the client
        //     requestId: "<requestId>", // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
        //     actor: {
        //         userId: "<userId>", // This will be used to fetch details of the user from the DB if Required
        //         role: "<role>", // Role of user will be only one of these: ADMIN , CONTEST_SCHEDULER , SUPPORT , USER , PUBLIC
        //         token: "<userToken>", // This is JWT Token of the User by which we will validate the aunthenticity of User and check if he or she is allowed to have the desired operation performed
        //     },
        //     operation: "<Any Operation Name Which is To be searched onto the Permission's Table>", // This will tell about what initial request was and processing will be done as per this 
        //     createdAt: "<Date in ISO String Format>", // Time when this request was created

        //     // To be Changed Fields

        //     source: "This is The Last Service name by which this event is Generated",
        //     updatedAt: "<Date in ISO String Format>", // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        // };

        // If User Updation Request came from the PERMISSION SERVICE then Update and send response back to the REDIS Pub/Sub Channel
        if (metadata.source === "permission-service") {

            const { name, user_name, email, password, mobile_no, role, activation_status } = data;

            const updatedUserData = {};

            if (name) {
                updatedUserData.name = name;
            }

            if (user_name) {
                updatedUserData.user_name = user_name;
            }

            if (email) {
                updatedUserData.email = email;
            }

            if (password) {
                updatedUserData.password = await bcrypt.hash(password, 12);
            }

            if (mobile_no) {
                updatedUserData.mobile_no = mobile_no;
            }

            if (role) {
                updatedUserData.role = role;
            }

            if (activation_status) {
                updatedUserData.activation_status = activation_status;
            }


            const filter = {
                _id: data._id,
            };

            const user = await User.findOneAndUpdate(filter, updatedUserData, { new: true });
            data = { ...data, result: sanitizeUserForResponse(user) };

            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!user) {
                metadata.success = false;
                metadata.message = "User Not Updated. Please Input Correct Fields....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            metadata.success = true;
            metadata.message = "User Updated Successfully....";

            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in USER SERVICE while Updating User's Details....");
        metadata.success = false;
        metadata.message = "Something went wrong while Updating User's Details....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};


const deleteSpecificUser = async (data, metadata) => {
    try {


        // const data = {
        //     _id: <_id>,
        // };


        // const metadata = {
        //     // Not To Be Changed Fields

        //     clientId: "<clientId>", // This is Websocket Id Which will be used for sending back the data to the client
        //     requestId: "<requestId>", // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
        //     actor: {
        //         userId: "<userId>", // This will be used to fetch details of the user from the DB if Required
        //         role: "<role>", // Role of user will be only one of these: ADMIN , CONTEST_SCHEDULER , SUPPORT , USER , PUBLIC
        //         token: "<userToken>", // This is JWT Token of the User by which we will validate the aunthenticity of User and check if he or she is allowed to have the desired operation performed
        //     },
        //     operation: "<Any Operation Name Which is To be searched onto the Permission's Table>", // This will tell about what initial request was and processing will be done as per this 
        //     createdAt: "<Date in ISO String Format>", // Time when this request was created

        //     // To be Changed Fields

        //     source: "This is The Last Service name by which this event is Generated",
        //     updatedAt: "<Date in ISO String Format>", // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        // };

        // If User Deletion Request came from the PERMISSION SERVICE or ADMIN SERVICE then delete and send response back to the REDIS Pub/Sub Channel
        if (metadata.source === "permission-service" || metadata.source === "admin-service") {

            const filter = {
                _id: data._id,
            };

            const user = await User.findOneAndDelete(filter);
            data = { ...data, result: sanitizeUserForResponse(user) };

            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!user) {
                metadata.success = false;
                metadata.message = "User Not Deleted. Please Input Correct Fields....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            metadata.success = true;
            metadata.message = "User Deleted Successfully....";

            await sendEvent("users.deleted", getPartition(), { _id: user._id }, {});
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in USER SERVICE while Deleting User's Details....");
        metadata.success = false;
        metadata.message = "Something went wrong while Deleting User's Details....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};






const _systemSubmissionMadeThusUpdateTriedProblemsForUser = async (data, metadata) => {

    try {


        // const data = {
        //     ...(Some Data Recieved From The Client Side or Initial Request to the API),
        //     result: <result>, // Some Data Required To Send to Client Side or to source who does the Initial Request to the API
        //     _system: {
        //         data: {
        //             problem_id: submission.problem_id, // The Problem Id which is Related to the Submission
        //             created_by: submission.created_by,
        //         },
        //         metadata: {
        //             source: "submission-service",
        //             createdAt: "<Date in ISO String Format>", // Time when this System's internal Data Processing Request was created
        //             cache: {
        //                  hits: <hits>,
        //                  misses: <misses>,
        //             },
        //             updatedAt: "<Date in ISO String Format>", // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        //         }
        //     },
        // };




        // const metadata = {
        //     // Not To Be Changed Fields

        //     clientId: "<clientId>", // This is Websocket Id Which will be used for sending back the data to the client
        //     requestId: "<requestId>", // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
        //     actor: {
        //         userId: "<userId>", // This will be used to fetch details of the user from the DB if Required
        //         role: "<role>", // Role of user will be only one of these: ADMIN , CONTEST_SCHEDULER , SUPPORT , USER , PUBLIC
        //         token: "<userToken>", // This is JWT Token of the User by which we will validate the aunthenticity of User and check if he or she is allowed to have the desired operation performed
        //     },
        //     operation: "<Any Operation Name Which is To be searched onto the Permission's Table>", // This will tell about what initial request was and processing will be done as per this 
        //     createdAt: "<Date in ISO String Format>", // Time when this request was created

        //     // To be Changed Fields

        //     source: "This is The Last Service name by which this event is Generated",
        //     updatedAt: "<Date in ISO String Format>", // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        // };



        // Since we have got the Update that User Has made atleast one successful submission thus it is neccessary to put it into the Tried Problems in the User's Data and No need to push Update of that thing to the User unless the User desired to see that Thing like the User can choose to see the Problems Tried and then can fetch the Submission made to those Problems by the User itself unless update that thing in the Background Silently
        if (data._system.metadata.source === "submission-service") {

            data._system.metadata.source = CURR_SERVICE_NAME;

            const {
                problem_id,
                created_by, // This will be the Id By which we Will be Tracking the User 
                _id, // This Will be Submission Id Which is Being Considered to Update the Tried Problem Status in User's Data Object
                is_for_public_test_cases, // This Will Tell If it is Finally Solved as Solving for Public Test Cases or Not Will not update the Problem Solving Status From "attempted" to "solved" it will be Updated When User have solved the Problem for the Private Test Cases
                test_cases, // These Will be the Test Cases Which the Current Submission Under Consideration have into it
            } = data._system.data;

            const filter = {
                _id: created_by, // This is User's Id By Which The User will be Find
            };



            // Since we have the "users.control.update" already we might think to update from there if we extend that function beyond just basic details but keeping things here for now for simplicity later can be extended
            const user = await User.findOne(filter).lean(); // lean() is Used Here to Get POJO so that operations can be performed Easily

            if (!user) {
                console.log("Sorry! This User with _id: ", created_by, " doesn't Exists....");

                data._system.metadata.success = false;
                data._system.metadata.message = `Sorry! This User with _id: ${created_by} doesn't Exists....`;
                data._system.metadata.updatedAt = (new Date()).toISOString();

                const topic = "users._system.update.corrupt";
                const partition = await getPartition();
                await sendEvent(topic, partition, data, metadata);
                return;
            }

            let isUpdatedProblemSubmissions = false;
            let isCurrSubmissionAccepted = false; // bool 

            // If the Submission Was for Public Test Cases Just Make the Problem Status as "attempted" and if it was for Private Test Cases then Check If It met to pass all the Test Cases and if Yes then Update the Problem Status as "solved"
            if (is_for_public_test_cases === false) {


                let passedTestCases = 0;
                const submissionTestCases = test_cases;

                // console.log("For Submission id: ", _id, "length of submissionTestCases is: ", submissionTestCases.length, "\n\n");

                for (let index = 0; index < submissionTestCases.length; index++) {
                    const testCase = submissionTestCases[index];
                    // console.log("Processing Test Case: ", index);
                    console.log(testCase);
                    if (testCase.status.id === 3) {
                        // console.log("This Test Case Is Accepted Thus Incrementing: ", passedTestCases);
                        passedTestCases++;
                    }
                    else {
                        isCurrSubmissionAccepted = false;
                        console.log("Breaking Here for Test Case: ", index);
                        break;
                    }
                }

                // Check If Passed All Test Cases
                if (passedTestCases === submissionTestCases.length) {
                    isCurrSubmissionAccepted = true;
                }


            }


            // First of All Try to Update if It Exists Already in Attempted Problems and If Yes then Update its Status from the Current Submission
            const existingTriedProblems = user.tried_problems;
            user.tried_problems = (existingTriedProblems).map((triedProblem) => {
                const newTriedProblemDetails = { ...triedProblem };
                // console.log("Inside Map of Tried Problems & Conparing the Problem_id ", newTriedProblemDetails.problem_id, "  ", problem_id);
                // console.log(newTriedProblemDetails);
                if (newTriedProblemDetails.problem_id === problem_id) {
                    console.log("\n\nIt Already Had Submission related to this Problem....");
                    isUpdatedProblemSubmissions = true;
                    // Append Current Submission Under Consideration into the Submissions Made By The User for the Current Problem
                    newTriedProblemDetails.submissions = [...(newTriedProblemDetails.submissions), _id];

                    // Update the Status of the Problem After The Current Submission
                    if (newTriedProblemDetails.status !== "solved") {
                        if (isCurrSubmissionAccepted === true) {
                            newTriedProblemDetails.status = "solved";
                        }
                        else {
                            newTriedProblemDetails.status = "attempted";
                        }
                    }
                }
                return newTriedProblemDetails;
            });


            // If This Is Problem's First Submission Made By The User then Make a New Entry in the "tried_problems" field of the User's Data's Object
            if (isUpdatedProblemSubmissions === false) {
                const newTriedProblemDetails = {
                    problem_id: problem_id,
                    status: (isCurrSubmissionAccepted === true ? "solved" : "attempted"),
                    submissions: [_id], // Adding the Id of the Current Submission Under Consideration 
                };

                // Update the User's Data Object
                user.tried_problems =
                    [
                        ...(user.tried_problems),
                        newTriedProblemDetails,
                    ];

                isUpdatedProblemSubmissions = true;
            };


            await User.findOneAndUpdate(filter, user);

            data._system.metadata.success = true;
            data._system.metadata.message = `This User with _id: ${created_by} updated Successfully....`;
            data._system.metadata.updatedAt = (new Date()).toISOString();

            const topic = "users._system.update.complete";
            const partition = await getPartition();
            await sendEvent(topic, partition, data, metadata);
            return;
        }

    }
    catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in USER SERVICE while Updating the User's Details....");
        data._system.metadata.source = CURR_SERVICE_NAME;
        data._system.metadata.success = false;
        data._system.metadata.message = "Something went Wrong while Updating the User's Details....";
        data._system.metadata.updatedAt = (new Date()).toISOString();
        const topic = "users._system.update.corrupt";
        const partition = await getPartition();
        await sendEvent(topic, partition, data, metadata);
        return;

    }



};


const _systemRegisteredForContestThusUpdateParticipatedContestForUser = async (data, metadata) => {

    try {


        // const data = {
        //     ...(Some Data Recieved From The Client Side or Initial Request to the API),
        //     result: <result>, // Some Data Required To Send to Client Side or to source who does the Initial Request to the API
        //     _system: {
        //         data: {
        //             user_id: user._id, // The User Id
        //             contest_id: contest._id,
        //         },
        //         metadata: {
        //             source: "contest-service",
        //             createdAt: "<Date in ISO String Format>", // Time when this System's internal Data Processing Request was created
        //             cache: {
        //                  hits: <hits>,
        //                  misses: <misses>,
        //             },
        //             updatedAt: "<Date in ISO String Format>", // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        //         }
        //     },
        // };




        // const metadata = {
        //     // Not To Be Changed Fields

        //     clientId: "<clientId>", // This is Websocket Id Which will be used for sending back the data to the client
        //     requestId: "<requestId>", // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
        //     actor: {
        //         userId: "<userId>", // This will be used to fetch details of the user from the DB if Required
        //         role: "<role>", // Role of user will be only one of these: ADMIN , CONTEST_SCHEDULER , SUPPORT , USER , PUBLIC
        //         token: "<userToken>", // This is JWT Token of the User by which we will validate the aunthenticity of User and check if he or she is allowed to have the desired operation performed
        //     },
        //     operation: "<Any Operation Name Which is To be searched onto the Permission's Table>", // This will tell about what initial request was and processing will be done as per this 
        //     createdAt: "<Date in ISO String Format>", // Time when this request was created

        //     // To be Changed Fields

        //     source: "This is The Last Service name by which this event is Generated",
        //     updatedAt: "<Date in ISO String Format>", // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        // };



        // Since we have got the Update that User Has Successfully Registered for the Contest thus update that thing in the Background Silently
        if (data._system.metadata.source === "contest-service") {

            data._system.metadata.source = CURR_SERVICE_NAME;

            const {
                contest_id, // This Will be the Contest Id for which the User has registered
                user_id, // This Will be User Id Which is Being Considered to Update its "participated_in_contests" field 
            } = data._system.data;

            const filter = {
                _id: user_id, // This is User's Id By Which The User will be Find
            };



            // Since we have the "users.control.update" already we might think to update from there if we extend that function beyond just basic details but keeping things here for now for simplicity later can be extended
            const user = await User.findOne(filter);

            if (!user) {
                console.log("Sorry! This User with _id: ", user_id, " doesn't Exists....");

                data._system.metadata.success = false;
                data._system.metadata.message = `Sorry! This User with _id: ${user_id} doesn't Exists....`;
                data._system.metadata.updatedAt = (new Date()).toISOString();

                const topic = "users._system.update.corrupt";
                const partition = await getPartition();
                await sendEvent(topic, partition, data, metadata);
                return;
            }

            // Update User's Details and Save
            user.participated_in_contests = [
                ...(user.participated_in_contests),
                contest_id
            ];
            await user.save();


            data._system.metadata.success = true;
            data._system.metadata.message = `This User with _id: ${user_id} updated Successfully....`;
            data._system.metadata.updatedAt = (new Date()).toISOString();

            const topic = "users._system.update.complete";
            const partition = await getPartition();
            await sendEvent(topic, partition, data, metadata);
            return;
        }

    }
    catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in USER SERVICE while Updating the User's Details....");
        data._system.metadata.source = CURR_SERVICE_NAME;
        data._system.metadata.success = false;
        data._system.metadata.message = "Something went Wrong while Updating the User's Details....";
        data._system.metadata.updatedAt = (new Date()).toISOString();
        const topic = "users._system.update.corrupt";
        const partition = await getPartition();
        await sendEvent(topic, partition, data, metadata);
        return;

    }


};


const handleUnknownEvent = async (data, metadata) => {
    await publishToRedisPubSub("unknown", JSON.stringify({ data: data, metadata: metadata }));
};


const resetPasswordByEmail = async (data, metadata) => {
    try {
        data = data || {};
        metadata = metadata || {};

        if (metadata.source !== "auth-service") {
            return;
        }

        const email = String(data.email || "").trim().toLowerCase();
        const newPassword = data.newPassword;

        metadata.source = CURR_SERVICE_NAME;
        metadata.updatedAt = (new Date()).toISOString();

        if (!email || !newPassword) {
            metadata.success = false;
            metadata.message = "Email and new password are required.";
            await publishToRedisPubSub("response", JSON.stringify({ data: { ...data, result: null }, metadata }));
            return;
        }

        const filter = { email: { $regex: `^${escapeRegex(email)}$`, $options: "i" } };
        // newPassword is already hashed by auth service
        const user = await User.findOneAndUpdate(filter, { password: newPassword });
        if (!user) {
            metadata.success = false;
            metadata.message = "Account not found for this email.";
            await publishToRedisPubSub("response", JSON.stringify({ data: { ...data, result: null }, metadata }));
            return;
        }

        metadata.success = true;
        metadata.message = "Password updated successfully.";
        await publishToRedisPubSub("response", JSON.stringify({ data: { ...data, result: { updated: true } }, metadata }));
    } catch (error) {
        console.log("Error resetPasswordByEmail:", error);
        metadata.source = CURR_SERVICE_NAME;
        metadata.success = false;
        metadata.message = "Failed to update password.";
        metadata.updatedAt = (new Date()).toISOString();
        await publishToRedisPubSub("response", JSON.stringify({ data: { ...data, result: null }, metadata }));
    }
};




const consumeEvents = async () => {
    try {


        // List of All Topics to Consume to run this Service
        const listOfTopicsToConsume = [
            // Normal User Usage Events
            "users.signup.precheck",
            "users.create",
            "users.getUser",

            // Control Panel User Usage Events
            "users.control.search",
            "users.control.getUser",
            "users.control.create",
            "users.control.update",
            "users.control.delete",

            // Password reset (from auth service)
            "users.password.reset",

            "admin.deleteUser",

            // Other Services' Event Update Events
            "submissions.practice.update.complete",
            "contests.register.complete",
        ];



        // List of Functions that will be used for processing the events
        const handlingFunctions = {
            // Normal User Usage Events
            "users.signup.precheck": precheckSignupAvailability,
            "users.create": createUser,
            "users.getUser": getSpecificUserDetails,

            // Control Panel User Usage Events
            "users.control.search": searchUsers,
            "users.control.getUser": getSpecificUserDetails,
            "users.control.create": createUser,
            "users.control.update": updateUserDetails,
            "users.control.delete": deleteSpecificUser,

            "users.password.reset": resetPasswordByEmail,

            "admin.deleteUser": deleteSpecificUser,

            // Other Services' Event Update Events
            "submissions.practice.update.complete": _systemSubmissionMadeThusUpdateTriedProblemsForUser,
            "contests.register.complete": _systemRegisteredForContestThusUpdateParticipatedContestForUser,
        };

        const consumer = kafka.consumer({ groupId: CURR_SERVICE_NAME });
        await consumer.connect();

        await consumer.subscribe({ topics: listOfTopicsToConsume, });

        await consumer.run({
            eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
                console.log(
                    `${CURR_SERVICE_NAME}: [${topic}]: PART:${partition}:`,
                    message.value.toString()
                );

                const info = JSON.parse(message.value);
                const { data, metadata } = info;



                // Process the Event
                if (handlingFunctions[topic]) {
                    await handlingFunctions[topic](data, metadata);
                }
                else {
                    await handleUnknownEvent(data, metadata);
                }


                // // Handle Sending response back to the user


                // // Publish the Final Response to the Redis Pub/Sub and Then Redis Pub/Sub & Websocket will handle the delivery of the final result to the respective client
                // await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));

            },
        });
    } catch (error) {
        console.log("Error: ", error);
        console.log("Something went wrong while consuming the Creating event....");
        throw error;
    }
};


export default consumeEvents;
