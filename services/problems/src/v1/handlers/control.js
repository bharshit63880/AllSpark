import Problem from "../../../models/v1/problems.js";
import { deleteFromCache, setToCache } from "../../utils/redisCacheManagement.js";
import { publishToRedisPubSub } from "../../utils/redisPublisher.js";
import { sendEvent } from "../../utils/kafkaProducer.js";


const DEFAULT_PARTITIONS_OF_KAFKA_TOPICS = process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS || 4;
const CURR_SERVICE_NAME = "problem-service";

// PLEASE NOTE: Do Not Try to Implement Caching Here in Control Panel Functions as the operartions need consistency everytime and can tolerate the delay over the consistency. However it is not Strict Rule If required then we can implement caching here as well but just remember before being in hurry to implement the caching. Thanks :)


const controlSearchProblems = async (data, metadata) => {
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

        const projection = {
            description: 0,
            test_cases: 0,
        }


        if (metadata.source === "permission-service") {

            // Here the Control Panel User Might want to see all the Details But again in the list Unneccessary to send Description & Test Cases 
            const problem = await Problem.find(filter).select(projection);


            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!problem) {
                metadata.success = false;
                metadata.message = "Problems Not Found. Please Provide Correct Fields....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            data = { ...data, result: problem };

            metadata.success = true;
            metadata.message = "Problems Found Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        }



    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in PROBLEM SERVICE while Searching Problems via Control Panel....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};


const controlGetSpecificProblemDetails = async (data, metadata) => {
    try {


        // const data = {
        // _id: <_id>,
        // slug: <slug>,
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

        const { _id, slug } = data;

        const filter = {};

        if (_id) {
            filter._id = _id;
        }

        if (slug) {
            filter.slug = slug;
        }




        if (metadata.source === "permission-service") {


            // Get The Details of Specific Problem
            const problem = await Problem.findOne(filter);


            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!problem) {
                metadata.success = false;
                metadata.message = "Problem Not Found. Please Provide Correct Fields....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            data = { ...data, result: problem };

            metadata.success = true;
            metadata.message = "Problem Found Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));

            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in PROBLEM SERVICE while Getting Specific Problem Details Via Control Panel....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};


const controlCreateProblem = async (data, metadata) => {

    try {


        // const data = {
        //     name: <name>,
        //     slug: <slug>,
        //     tags: <tags>,
        //     description: <description>,
        //     difficulty: <difficulty>,
        //     is_public: <is_public>,
        //     test_cases: <test_cases>
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




        const { name, slug, tags, description, difficulty, is_public, test_cases } = data;
        const created_by = metadata.actor.userId;

        const problemData = {
            name: name,
            slug: slug,
            tags: tags,
            description: description,
            difficulty: difficulty,
            is_public: is_public,
            created_by: created_by,
            test_cases: test_cases,
        };


        if (metadata.source === "permission-service" || metadata.source === "admin-service") {


            // Create New Problem
            const problem = await new Problem(problemData).save();


            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!problem) {
                metadata.success = false;
                metadata.message = "Problem Not Created. Please Provide Correct Fields....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            data = { ...data, result: problem };

            metadata.success = true;
            metadata.message = "Problem Created Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));

            await sendEvent("problems.created", Math.floor(Math.random() * DEFAULT_PARTITIONS_OF_KAFKA_TOPICS), { _id: problem._id }, {});

            // Save to Cache 
            setToCache(`problems:v1:_id:${problem._id}`, problem, 7200);
            setToCache(`problems:v1:slug:${problem.slug}`, problem, 7200);


            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in PROBLEM SERVICE while Creating Problem Via Control Panel....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};


const controlUpdateProblem = async (data, metadata) => {

    try {

        // const data = {
        //     _id: <_id>,
        //     name: <name>,
        //     slug: <slug>,
        //     tags: <tags>,
        //     description: <description>,
        //     difficulty: <difficulty>,
        //     is_public: <is_public>,
        //     test_cases: <test_cases>
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




        const { _id, name, slug, tags, description, difficulty, is_public, test_cases } = data;
        const created_by = metadata.actor.userId;

        const updatedProblemData = {};


        if (name) {
            updatedProblemData.name = name;
        }

        if (slug) {
            updatedProblemData.slug = slug;
        }

        if (tags) {
            updatedProblemData.tags = tags;
        }

        if (description) {
            updatedProblemData.description = description;
        }

        if (difficulty) {
            updatedProblemData.difficulty = difficulty;
        }

        if (is_public) {
            updatedProblemData.is_public = is_public;
        }

        if(test_cases) {
            updatedProblemData.test_cases = test_cases;
        }

        const filter = {
            _id: _id,
            created_by: created_by,
        };


        if (metadata.source === "permission-service") {


            // Update Problem
            const problem = await Problem.findOneAndUpdate(filter, updatedProblemData);


            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!problem) {
                metadata.success = false;
                metadata.message = "Problem Not Updated. Please Provide Correct Fields....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            data = { ...data, result: problem };

            metadata.success = true;
            metadata.message = "Problem Updated Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));

            // Delete From Cache 
            deleteFromCache(`problems:v1:_id:${problem._id}`,);
            deleteFromCache(`problems:v1:slug:${problem.slug}`);
            deleteFromCache("problems:v1:all");

            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in PROBLEM SERVICE while Updating Problem Via Control Panel....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};


const controlDeleteProblem = async (data, metadata) => {


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

        // If this has been come from the Control Panel Of ADMIN Role Possessing User Thus Send Response That It has been Found Successfully No Need to Issue JWT




        const { _id } = data;
        const created_by = metadata.actor?.userId;

        const filter = metadata.source === "admin-service"
            ? { _id: _id }
            : { _id: _id, created_by: created_by };


        if (metadata.source === "permission-service" || metadata.source === "admin-service") {


            // Delete The Problem if Created By the User Who is Requesting the Deletion (admin-service can delete by _id only)
            const problem = await Problem.findOneAndDelete(filter);


            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!problem) {
                metadata.success = false;
                metadata.message = "Problem Not Deleted. Please Provide Correct Fields....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            data = { ...data, result: problem };

            metadata.success = true;
            metadata.message = "Problem Deleted Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));

            // Delete From Cache 
            deleteFromCache(`problems:v1:_id:${problem._id}`,);
            deleteFromCache(`problems:v1:slug:${problem.slug}`);
            deleteFromCache("problems:v1:all");


            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in PROBLEM SERVICE while Deleting Problem Via Control Panel....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};




export { controlSearchProblems, controlGetSpecificProblemDetails, controlCreateProblem, controlUpdateProblem, controlDeleteProblem };
