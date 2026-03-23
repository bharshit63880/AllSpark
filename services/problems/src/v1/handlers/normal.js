import Problem from "../../../models/v1/problems.js";
import { getFromCache, setToCache } from "../../utils/redisCacheManagement.js";
import { publishToRedisPubSub } from "../../utils/redisPublisher.js";


const CURR_SERVICE_NAME = "problem-service";




const searchProblems = async (data, metadata) => {
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

        // Important to Show Only Public Problems to Normal Users
        filter.is_public = true;

        const projection = {
            description: 0,
            test_cases: 0,
        }


        if (metadata.source === "permission-service") {


            const problem = await Problem.find(filter).select(projection).lean();


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

            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in PROBLEM SERVICE while Searching Problems....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};


const getAllProblems = async (data, metadata) => {
    try {


        // const data = {
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

        const cachingInfo = {};
        metadata.cache = {
            hits: 0,
            misses: 0,
        };

        const filter = {};
        filter.is_public = true;

        const projection = {
            description: 0,
            test_cases: 0,
        };


        if (metadata.source === "permission-service") {

            cachingInfo.cacheKey = "problems:v1:all";
            cachingInfo.cacheTTL = 14400; // In Seconds thus it becomes 14400/60 = 240 Minutes = 4 Hours

            let queryResult;
            const { isValueFound, value } = await getFromCache(cachingInfo.cacheKey);

            // Search in the Cache If Available then Send via here
           if (isValueFound && !(Array.isArray(value) && value.length === 0)) {
              queryResult = value;
                  metadata.cache.hits++;
                    }
            else {
                // Get The List of All Problems and In the list Description and Test Cases Are Unneccessary to send with the response thus Removing them
                const problem = await Problem.find(filter).select(projection).lean();
                queryResult = problem;
                metadata.cache.misses++;
            }



            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!queryResult) {
                metadata.success = false;
                metadata.message = "Problems Not Found. Please Provide Correct Fields....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }


            // Set The Successful Result to Cache Not Using Await as we don't want to be Waiting while It Cache Up Things for us we have sent please cache it if it does then ok or else we will try from DB until it set things right up in the cache
            if (!(Array.isArray(queryResult) && queryResult.length === 0)) {
    setToCache(cachingInfo.cacheKey, queryResult, cachingInfo.cacheTTL);
}

            // Process the data and prepare the Response
            data = { ...data, result: queryResult };

            metadata.success = true;
            metadata.message = "Problems Found Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));


            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in PROBLEM SERVICE while Getting All Problems....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }
};


const getSpecificProblemDetails = async (data, metadata) => {
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

        const cachingInfo = {};
        metadata.cache = {
            hits: 0,
            misses: 0,
        };
        const { _id, slug } = data;

        const filter = {};

        if (_id) {
            filter._id = _id;
            cachingInfo.cacheKey = `problems:v1:_id:${_id}`;
        }

        if (slug) {
            filter.slug = slug;
            cachingInfo.cacheKey = `problems:v1:slug:${slug}`;
        }

        filter.is_public = true;



        if (metadata.source === "permission-service") {

            cachingInfo.cacheTTL = 7200; // In Seconds thus it becomes 7200/60 = 120 Minutes = 2 Hours


            let queryResult;
            const { isValueFound, value } = await getFromCache(cachingInfo.cacheKey);

            // Search in the Cache If Available then Send via here
           if (isValueFound && !(Array.isArray(value) && value.length === 0)) {
    queryResult = value;
    metadata.cache.hits++;
}
            else {

                // Get The Specific Problem's Details
                const problem = await Problem.findOne(filter).lean();

                queryResult = problem;
                metadata.cache.misses++;
            }




            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!queryResult) {
                metadata.success = false;
                metadata.message = "Problem Not Found. Please Provide Correct Fields....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            // Set The Successful Result to Cache Not Using Await as we don't want to be Waiting while It Cache Up Things for us we have sent please cache it if it does then ok or else we will try from DB until it set things right up in the cache
           if (!(Array.isArray(queryResult) && queryResult.length === 0)) {
    setToCache(cachingInfo.cacheKey, queryResult, cachingInfo.cacheTTL);
}

            // Process the data and prepare the Response

            // Filter Out The Private Test Cases As they are Private For that Reason Obviously We will be sending the Private Test cases in the Submission Part but this is for users so they should not see the Private Test Cases 
            queryResult.test_cases = (queryResult.test_cases).map((testCase) => {
                return {
                    language_id: testCase.language_id,
                    public_test_cases: testCase.public_test_cases,
                };
            });

            data = { ...data, result: queryResult };

            metadata.success = true;
            metadata.message = "Problem Found Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));


            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in PROBLEM SERVICE while Getting Specific Problem Details....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }
};




export { searchProblems, getAllProblems, getSpecificProblemDetails };
