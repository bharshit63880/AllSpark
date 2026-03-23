import "dotenv/config";
import { kafka } from "../utils/kafkaClient.js";
import Permission from "../../models/v1/permissions.js";
import { publishToChannel } from "../utils/redisCacheManager.js";
import { sendEvent } from "../utils/kafkaProducer.js";
import getPartition from "../utils/getPartition.js";
import ROLES from "../constants/roles.js";


const CURR_SERVICE_NAME = "permission-service";


// PLEASE NOTE: CACHING is YET TO BE IMPLEMENTED

const PUBLIC_ROLES = ["PUBLIC"];
const AUTHENTICATED_ROLES = [ROLES.USER, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.CONTEST_SCHEDULER, ROLES.SUPPORT];
const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.CONTEST_SCHEDULER];
const SUPPORT_CONTROL_ROLES = [ROLES.SUPPORT, ROLES.ADMIN, ROLES.SUPER_ADMIN];
const DASHBOARD_ROLES = [ROLES.SUPPORT, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.CONTEST_SCHEDULER];

const CRITICAL_PERMISSIONS = [
    { name: "signup", description: "Public signup", nextTopicToPublish: "auth.signup", roles: PUBLIC_ROLES },
    { name: "login", description: "Public login", nextTopicToPublish: "auth.login", roles: PUBLIC_ROLES },
    { name: "auth.resendSignupOtp", description: "Resend signup verification OTP", nextTopicToPublish: "auth.resendSignupOtp", roles: PUBLIC_ROLES },
    { name: "auth.verifySignupOtp", description: "Verify signup email OTP", nextTopicToPublish: "auth.verifySignupOtp", roles: PUBLIC_ROLES },
    { name: "auth.forgotPassword", description: "Request password reset OTP", nextTopicToPublish: "auth.forgotPassword", roles: PUBLIC_ROLES },
    { name: "auth.verifyOtp", description: "Verify password reset OTP", nextTopicToPublish: "auth.verifyOtp", roles: PUBLIC_ROLES },
    { name: "auth.resetPassword", description: "Reset password after OTP verification", nextTopicToPublish: "auth.resetPassword", roles: PUBLIC_ROLES },

    { name: "problems.getAllProblems", description: "Get all problems", nextTopicToPublish: "problems.getAllProblems", roles: PUBLIC_ROLES },
    { name: "problems.getProblem", description: "Get problem details", nextTopicToPublish: "problems.getProblem", roles: PUBLIC_ROLES },
    { name: "problems.search", description: "Search problems", nextTopicToPublish: "problems.search", roles: PUBLIC_ROLES },
    { name: "submissions.practice.create", description: "Create practice submission", nextTopicToPublish: "submissions.practice.create", roles: AUTHENTICATED_ROLES },
    { name: "submissions.contest.create", description: "Create contest submission", nextTopicToPublish: "submissions.contest.create", roles: AUTHENTICATED_ROLES },
    { name: "submissions.getSubmission", description: "Get submission by id", nextTopicToPublish: "submissions.getSubmission", roles: PUBLIC_ROLES },
    { name: "submissions.getAllSubmissionsForProblem", description: "Get all submissions for problem", nextTopicToPublish: "submissions.getAllSubmissionsForProblem", roles: AUTHENTICATED_ROLES },
    { name: "contests.getAllContests", description: "Get all contests", nextTopicToPublish: "contests.getAllContests", roles: PUBLIC_ROLES },
    { name: "contests.getContest", description: "Get contest details", nextTopicToPublish: "contests.getContest", roles: PUBLIC_ROLES },
    { name: "contests.search", description: "Search contests", nextTopicToPublish: "contests.search", roles: PUBLIC_ROLES },
    { name: "contests.register", description: "Register for contest", nextTopicToPublish: "contests.register", roles: AUTHENTICATED_ROLES },
    { name: "contests.startContest", description: "Start contest", nextTopicToPublish: "contests.startContest", roles: AUTHENTICATED_ROLES },
    { name: "leaderboard.getByContest", description: "Get leaderboard by contest", nextTopicToPublish: "leaderboard.get", roles: PUBLIC_ROLES },
    { name: "careers.submit", description: "Submit public career or collaboration request", nextTopicToPublish: "supportTickets.careers.create", roles: PUBLIC_ROLES },
    { name: "supportTickets.create", description: "Create support ticket", nextTopicToPublish: "supportTickets.create", roles: AUTHENTICATED_ROLES },
    { name: "supportTickets.getMyTickets", description: "Get current user support tickets", nextTopicToPublish: "supportTickets.getMyTickets", roles: AUTHENTICATED_ROLES },
    { name: "supportTickets.getResolvedFaqs", description: "Get resolved support ticket FAQs", nextTopicToPublish: "supportTickets.getResolvedFaqs", roles: AUTHENTICATED_ROLES },
    { name: "supportTickets.getTicket", description: "Get specific support ticket", nextTopicToPublish: "supportTickets.getTicket", roles: AUTHENTICATED_ROLES },
    { name: "specialAccess.create", description: "Create special access request", nextTopicToPublish: "specialAccess.create", roles: AUTHENTICATED_ROLES },
    { name: "specialAccess.getMyRequests", description: "Get current user special access requests", nextTopicToPublish: "specialAccess.getMyRequests", roles: AUTHENTICATED_ROLES },
    { name: "specialAccess.getRequest", description: "Get specific special access request", nextTopicToPublish: "specialAccess.getRequest", roles: AUTHENTICATED_ROLES },

    { name: "users.getUser", description: "Get current user details", nextTopicToPublish: "users.control.getUser", roles: AUTHENTICATED_ROLES },
    { name: "users.control.search", description: "Search users", nextTopicToPublish: "users.control.search", roles: ADMIN_ROLES },
    { name: "users.control.create", description: "Create user", nextTopicToPublish: "users.control.create", roles: ADMIN_ROLES },
    { name: "users.control.update", description: "Update user", nextTopicToPublish: "users.control.update", roles: ADMIN_ROLES },
    { name: "users.control.delete", description: "Delete user", nextTopicToPublish: "users.control.delete", roles: ADMIN_ROLES },

    { name: "problems.control.search", description: "Search problems (control)", nextTopicToPublish: "problems.control.search", roles: ADMIN_ROLES },
    { name: "problems.control.getProblem", description: "Get problem (control)", nextTopicToPublish: "problems.control.getProblem", roles: ADMIN_ROLES },
    { name: "problems.control.create", description: "Create problem (control)", nextTopicToPublish: "problems.control.create", roles: ADMIN_ROLES },
    { name: "problems.control.update", description: "Update problem (control)", nextTopicToPublish: "problems.control.update", roles: ADMIN_ROLES },
    { name: "problems.control.delete", description: "Delete problem (control)", nextTopicToPublish: "problems.control.delete", roles: ADMIN_ROLES },

    { name: "contests.control.search", description: "Search contests (control)", nextTopicToPublish: "contests.control.search", roles: ADMIN_ROLES },
    { name: "contests.control.getContest", description: "Get contest (control)", nextTopicToPublish: "contests.control.getContest", roles: ADMIN_ROLES },
    { name: "contests.control.create", description: "Create contest (control)", nextTopicToPublish: "contests.control.create", roles: ADMIN_ROLES },
    { name: "contests.control.update", description: "Update contest (control)", nextTopicToPublish: "contests.control.update", roles: ADMIN_ROLES },
    { name: "contests.control.delete", description: "Delete contest (control)", nextTopicToPublish: "contests.control.delete", roles: ADMIN_ROLES },
    { name: "supportTickets.control.search", description: "Search support tickets (control)", nextTopicToPublish: "supportTickets.control.search", roles: SUPPORT_CONTROL_ROLES },
    { name: "supportTickets.control.update", description: "Update support ticket (control)", nextTopicToPublish: "supportTickets.control.update", roles: SUPPORT_CONTROL_ROLES },
    { name: "specialAccess.control.search", description: "Search special access requests (control)", nextTopicToPublish: "specialAccess.control.search", roles: SUPPORT_CONTROL_ROLES },
    { name: "specialAccess.control.update", description: "Update special access request (control)", nextTopicToPublish: "specialAccess.control.update", roles: SUPPORT_CONTROL_ROLES },

    { name: "admin.dashboard", description: "Admin dashboard stats", nextTopicToPublish: "admin.getDashboard", roles: DASHBOARD_ROLES },
    { name: "admin.contests.list", description: "List contests", nextTopicToPublish: "contests.control.search", roles: ADMIN_ROLES },
    { name: "admin.contests.get", description: "Get contest details", nextTopicToPublish: "contests.control.getContest", roles: ADMIN_ROLES },
    { name: "admin.contests.create", description: "Create contest", nextTopicToPublish: "admin.contests.create", roles: ADMIN_ROLES },
    { name: "admin.contests.update", description: "Update contest", nextTopicToPublish: "admin.contests.update", roles: ADMIN_ROLES },
    { name: "admin.contests.delete", description: "Delete contest", nextTopicToPublish: "admin.contests.delete", roles: ADMIN_ROLES },

    { name: "admin.problems.list", description: "List problems", nextTopicToPublish: "problems.control.search", roles: ADMIN_ROLES },
    { name: "admin.problems.get", description: "Get problem details", nextTopicToPublish: "problems.control.getProblem", roles: ADMIN_ROLES },
    { name: "admin.problems.create", description: "Create problem", nextTopicToPublish: "admin.problems.create", roles: ADMIN_ROLES },
    { name: "admin.problems.update", description: "Update problem", nextTopicToPublish: "problems.control.update", roles: ADMIN_ROLES },
    { name: "admin.problems.delete", description: "Delete problem", nextTopicToPublish: "admin.problems.delete", roles: ADMIN_ROLES },

    { name: "admin.users.getAll", description: "Get all users", nextTopicToPublish: "admin.users.getAll", roles: ADMIN_ROLES },
    { name: "admin.users.get", description: "Get user details", nextTopicToPublish: "users.control.getUser", roles: ADMIN_ROLES },
    { name: "admin.users.create", description: "Create user", nextTopicToPublish: "users.control.create", roles: ADMIN_ROLES },
    { name: "admin.users.update", description: "Update user", nextTopicToPublish: "users.control.update", roles: ADMIN_ROLES },
    { name: "admin.users.ban", description: "Ban user", nextTopicToPublish: "users.control.update", roles: ADMIN_ROLES },
    { name: "admin.users.unban", description: "Unban user", nextTopicToPublish: "users.control.update", roles: ADMIN_ROLES },
    { name: "admin.users.delete", description: "Delete user", nextTopicToPublish: "admin.users.delete", roles: ADMIN_ROLES },

    { name: "admin.submissions.getAll", description: "Get all submissions", nextTopicToPublish: "submissions.control.search", roles: ADMIN_ROLES },
    { name: "admin.submissions.get", description: "Get submission details", nextTopicToPublish: "submissions.getSubmission", roles: ADMIN_ROLES },
    { name: "admin.submissions.delete", description: "Delete submission", nextTopicToPublish: "submissions.control.delete", roles: ADMIN_ROLES },
    { name: "admin.leaderboard.get", description: "Get leaderboard", nextTopicToPublish: "leaderboard.get", roles: ADMIN_ROLES },
    { name: "admin.supportTickets.getAll", description: "Get support tickets", nextTopicToPublish: "supportTickets.control.search", roles: SUPPORT_CONTROL_ROLES },
    { name: "admin.supportTickets.update", description: "Update support ticket", nextTopicToPublish: "supportTickets.control.update", roles: SUPPORT_CONTROL_ROLES },
    { name: "admin.specialAccess.getAll", description: "Get special access requests", nextTopicToPublish: "specialAccess.control.search", roles: SUPPORT_CONTROL_ROLES },
    { name: "admin.specialAccess.update", description: "Update special access request", nextTopicToPublish: "specialAccess.control.update", roles: SUPPORT_CONTROL_ROLES },
];

const ensureCriticalPermissions = async () => {
    for (const permission of CRITICAL_PERMISSIONS) {
        await Permission.updateOne(
            { name: permission.name },
            {
                $set: {
                    description: permission.description,
                    nextTopicToPublish: permission.nextTopicToPublish,
                    roles: permission.roles,
                },
                $setOnInsert: { created_by: "SYSTEM" },
            },
            { upsert: true }
        );
    }
};

const checkIfPermitted = async (data, metadata) => {
    try {


        // const data = {
        //     // Required Things for Performing that Operation
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


        // This Source check Validates that the data has come from the authorized source and thus safe to just check the role claimed by the "metadata.actor" (which is already verified by the AUTH SERVICE) and send it to next Topic where it will be processed
        if (metadata.source === "auth-service") {

            const filter = {
                name: metadata.operation,
            };


            // Fetch From Database if not available in the Cache DB Caching yet to be implemented
            const permission = await Permission.findOne(filter);

            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if(!permission) {
                // Publish Response to the User that this operation is Not Exists
                metadata.message = "This Operation Not Exists: " + metadata.operation;
                metadata.success = false;
                await publishToChannel("response", { data: data, metadata: metadata });
                return ;
            }


            let partition = getPartition();

            const actorRole = String(metadata.actor.role || "").toUpperCase();
            const allowedRoles = Array.isArray(permission.roles) ? permission.roles.map((role) => String(role || "").toUpperCase()) : [];
            const isPublicPermission = allowedRoles.includes("PUBLIC");
            const isExplicitlyAllowed = allowedRoles.includes(actorRole);

            // PUBLIC permissions should remain accessible even if a logged-in user sends an auth token.
            if (isPublicPermission || isExplicitlyAllowed) {
                await sendEvent(permission.nextTopicToPublish, partition, data, metadata);
            }
            else {
                // Publish Response to the User that Your'e not allowed to Perform this operation
                metadata.message = "Not Allowed for Role: " + metadata.actor.role;
                metadata.success = false;
                await publishToChannel("response", { data: data, metadata: metadata });

            }
        }

    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in PERMISSION SERVICE while Checking Permission....");
    }

};


const searchPermissions = async (data, metadata) => {
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


            const permission = await Permission.find(filter);


            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!permission) {
                metadata.success = false;
                metadata.message = "Permissions Not Found. Please Provide Correct Credentials....";
                await publishToChannel("response", { data: data, metadata: metadata });
                return;
            }

            data = { ...data, result: permission };

            metadata.success = true;
            metadata.message = "Permissions Found Successfully....";
            await publishToChannel("response", { data: data, metadata: metadata });
        }



    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in PERMISSION SERVICE while Searching Permissions....");
    }
};


const getSpecificPermissionDetails = async (data, metadata) => {
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

        // If These request have come from the PERMISSION SERVICE then Indeed they are some Control Panel Operations thus Send Response Back To the User who initiated these request
        if (metadata.source === "permission-service") {
            const filter = {
                _id: data._id,
            };

            const permission = await Permission.findOne(filter);

            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!permission) {
                metadata.success = false;
                metadata.message = "Permission Not Found. Please Input Correct Credentials....";
                await publishToChannel("response", { data: data, metadata: metadata });
                return;
            }

            data = { ...data, result: permission };
            metadata.success = true;
            metadata.message = "Permission Found Successfully....";

            await publishToChannel("response", { data: data, metadata: metadata });
            return;

        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in PERMISSION SERVICE while Getting Specific Permission's Details....");
    }

};


const createNewPermission = async (data, metadata) => {
    try {


        // const data = {
        //     name: <name>,
        //     description: <description>,
        //     nextTopicToPublish: <nextTopicToPublish>,
        //     roles: <roles>,
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

        // If These request have come from the PERMISSION SERVICE then Indeed they are some Control Panel Operations thus Send Response Back To the User who initiated these request

        const created_by = metadata.actor.userId;

        if (metadata.source === "permission-service") {
            const permissionData = {
                name: data.name,
                description: data.description,
                nextTopicToPublish: data.nextTopicToPublish,
                roles: data.roles,
                created_by: created_by,
            };

            const permission = await new Permission(permissionData).save();

            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!permission) {
                metadata.success = false;
                metadata.message = "Permission Not Created. Please Input Correct Credentials....";
                await publishToChannel("response", { data: data, metadata: metadata });
                return;
            }

            data = { ...data, result: permission };
            metadata.success = true;
            metadata.message = "Permission Created Successfully....";

            await publishToChannel("response", { data: data, metadata: metadata });
            return;

        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in PERMISSION SERVICE while Creating Permission....");
    }

};


const updatePermissionDetails = async (data, metadata) => {
    try {


        // const data = {
        //     _id: <_id>,
        //     name: <name>,
        //     description: <description>,
        //     nextTopicToPublish: <nextTopicToPublish>,
        //     roles: <roles>,
        //     created_by: <created_by>,
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

        // If These request have come from the PERMISSION SERVICE then Indeed they are some Control Panel Operations thus Send Response Back To the User who initiated these request
        const created_by = metadata.actor.userId;
        if (metadata.source === "permission-service") {
            const updatedPermissionData = {
                name: data.name,
                description: data.description,
                nextTopicToPublish: data.nextTopicToPublish,
                roles: data.roles,
            };

            const filter = {
                _id: data._id,
                created_by: created_by,
            };

            const permission = await Permission.findOneAndUpdate(filter, updatedPermissionData);

            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!permission) {
                metadata.success = false;
                metadata.message = "Permission Not Updated. Please Input Correct Credentials....";
                await publishToChannel("response", { data: data, metadata: metadata });
                return;
            }

            data = { ...data, result: permission };
            metadata.success = true;
            metadata.message = "Permission Updated Successfully....";

            await publishToChannel("response", { data: data, metadata: metadata });
            return;

        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in PERMISSION SERVICE while Updating Permission....");
    }
};


const deleteSpecificPermission = async (data, metadata) => {
    try{
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

        // If These request have come from the PERMISSION SERVICE then Indeed they are some Control Panel Operations thus Send Response Back To the User who initiated these request
        if (metadata.source === "permission-service") {
            const created_by = metadata.actor.userId;
           
            const filter = {
                _id: data._id,
                created_by: created_by,
            };

            const permission = await Permission.findOneAndDelete(filter);

            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!permission) {
                metadata.success = false;
                metadata.message = "Permission Not Deleted. Please Input Correct Credentials....";
                await publishToChannel("response", { data: data, metadata: metadata });
                return;
            }

            data = { ...data, result: permission };
            metadata.success = true;
            metadata.message = "Permission Deleted Successfully....";

            await publishToChannel("response", { data: data, metadata: metadata });
            return;

        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in PERMISSION SERVICE while Updating Permission....");
    }
};


const handleUnknownEvent = async (data, metadata) => {
    await publishToChannel("unknown", { data: data, metadata: metadata });
};




const consumeEvents = async () => {
    try {

        await ensureCriticalPermissions();


        // List of All Topics to Consume to run this Service
        const listOfTopicsToConsume = [
            "permissions.check",
            "permissions.control.search",
            "permissions.control.getPermission",
            "permissions.control.create",
            "permissions.control.update",
            "permissions.control.delete",
        ];



        // List of Functions that will be used for processing the events
        const handlingFunctions = {
            "permissions.check": checkIfPermitted,
            "permissions.control.search": searchPermissions,
            "permissions.control.getPermission": getSpecificPermissionDetails,
            "permissions.control.create": createNewPermission,
            "permissions.control.update": updatePermissionDetails,
            "permissions.control.delete": deleteSpecificPermission,
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
                // await publishToChannel("response", { data: data, metadata: metadata });

            },
        });
    } catch (error) {
        console.log("Error: ", error);
        console.log("Something went wrong while consuming the Creating event....");
    }
};


export default consumeEvents;

