import Contest from "../../../models/v1/contests.js";
import { deleteFromCache, setToCache } from "../../utils/redisCacheManagement.js";
import { publishToRedisPubSub } from "../../utils/redisPublisher.js";
import { sendEvent } from "../../utils/kafkaProducer.js";
import getPartition from "../../utils/getPartition.js";


const CURR_SERVICE_NAME = "contest-service";




// PLEASE NOTE: Do Not Try to Implement Caching Here in Control Panel Functions as the operartions need consistency everytime and can tolerate the delay over the consistency. However it is not Strict Rule If required then we can implement caching here as well but just remember before being in hurry to implement the caching. Thanks :)




const controlSearchContests = async (data, metadata) => {
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




        const filter = data.filter || {};

        const projection = {
            description: 0,
            support_team: 0,
            problems: 0,
        }


        if (metadata.source === "permission-service") {

            // Here the Control Panel User Might want to see all the Details But again in the list Unneccessary to send description, support_time, problems
            const contest = await Contest.find(filter).select(projection).lean();


            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!contest) {
                metadata.success = false;
                metadata.message = "Contests Not Found. Please Provide Correct Fields....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            data = { ...data, result: contest };

            metadata.success = true;
            metadata.message = "Contests Found Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        }



    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in CONTEST SERVICE while Searching Contests via Control Panel....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};


const controlGetSpecificContestDetails = async (data, metadata) => {
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





        const { _id, slug } = data;

        const filter = {};

        if (_id) {
            filter._id = _id;
        }

        if (slug) {
            filter.slug = slug;
        }




        if (metadata.source === "permission-service") {


            // Get The Details of Specific Contest
            const contest = await Contest.findOne(filter);


            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!contest) {
                metadata.success = false;
                metadata.message = "Contest Not Found. Please Provide Correct Fields....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            data = { ...data, result: contest };

            metadata.success = true;
            metadata.message = "Contest Found Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));

            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in CONTEST SERVICE while Getting Specific Contest Details Via Control Panel....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};


const controlCreateContest = async (data, metadata) => {

    try {


        // const data = {
        //     name: <name>,
        //     slug: <slug>,
        //     description: <description>,
        //     support_team: <support_team>,
        //     problems: <problems>,
        //     start_time: <start_time>,
        //     end_time: <end_time>,
        //     duration: <duration>,
        //     support_end_time: <support_end_time>,
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



        const {
            name,
            slug,
            description,
            support_team,
            problems,
            start_time,
            end_time,
            duration,
            support_end_time,
        } = data;
        const created_by = metadata.actor.userId;

        const contestData = {
            name: name,
            slug: slug,
            description: description,
            created_by: created_by,
            support_team: support_team,
            problems: problems,
            start_time: start_time,
            end_time: end_time,
            duration: duration,
            support_end_time: support_end_time,
        };


        if (metadata.source === "permission-service" || metadata.source === "admin-service") {


            // Create New Contest
            const contest = await new Contest(contestData).save();


            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!contest) {
                metadata.success = false;
                metadata.message = "Contest Not Created. Please Provide Correct Fields....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }


            data = { ...data, result: contest };

            metadata.success = true;
            metadata.message = "Contest Created Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));

            await sendEvent("contests.created", getPartition(), { _id: contest._id, createdAt: contest.createdAt }, {});

            // Save to Cache 
            setToCache(`contests:v1:_id:${contest._id}`, contest, 7200);
            setToCache(`contests:v1:slug:${contest.slug}`, contest, 7200);
            deleteFromCache("contests:v1:all");

            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in CONTEST SERVICE while Creating Contest Via Control Panel....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};


const controlUpdateContest = async (data, metadata) => {

    try {

        // const data = {
        //     _id: <_id>,
        //     name: <name>,
        //     slug: <slug>,
        //     description: <description>,
        //     support_team: <support_team>,
        //     problems: <problems>,
        //     start_time: <start_time>,
        //     end_time: <end_time>,
        //     duration: <duration>,
        //     support_end_time: <support_end_time>,
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

        const {
            _id,
            name,
            slug,
            description,
            support_team,
            problems,
            start_time,
            end_time,
            duration,
            support_end_time,
        } = data;


        const updatedContestData = {};


        if (name) {
            updatedContestData.name = name;
        }

        if (slug) {
            updatedContestData.slug = slug;
        }

        if (description) {
            updatedContestData.description = description;
        }

        if (support_team) {
            updatedContestData.support_team = support_team;
        }

        if (problems) {
            updatedContestData.problems = problems;
        }

        if (start_time) {
            updatedContestData.start_time = start_time;
        }

        if (end_time) {
            updatedContestData.end_time = end_time;
        }

        if (duration) {
            updatedContestData.duration = duration;
        }

        if (support_end_time) {
            updatedContestData.support_end_time = support_end_time;
        }


        const created_by = metadata.actor?.userId;
        const filter = metadata.source === "admin-service"
            ? { _id: _id }
            : { _id: _id, created_by: created_by };


        if (metadata.source === "permission-service" || metadata.source === "admin-service") {


            // Update Contest
            const contest = await Contest.findOneAndUpdate(filter, updatedContestData);


            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!contest) {
                metadata.success = false;
                metadata.message = "Contest Not Updated. Please Provide Correct Fields....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            data = { ...data, result: contest };

            metadata.success = true;
            metadata.message = "Contest Updated Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));

            // Delete From Cache
            deleteFromCache(`contests:v1:_id:${contest._id}`);
            deleteFromCache(`contests:v1:slug:${contest.slug}`);
            deleteFromCache("contests:v1:all");


            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in CONTEST SERVICE while Updating Contest Via Control Panel....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};


const controlDeleteContest = async (data, metadata) => {


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


            // Delete the Contest
            const contest = await Contest.findOneAndDelete(filter);


            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!contest) {
                metadata.success = false;
                metadata.message = "Contest Not Deleted. Please Provide Correct Fields....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            data = { ...data, result: contest };

            metadata.success = true;
            metadata.message = "Contest Deleted Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));

            // Delete From Cache
            deleteFromCache(`contests:v1:_id:${contest._id}`);
            deleteFromCache(`contests:v1:slug:${contest.slug}`);
            deleteFromCache("contests:v1:all");

            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in CONTEST SERVICE while Deleting Contest Via Control Panel....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};




export {
    controlSearchContests,
    controlGetSpecificContestDetails,
    controlCreateContest,
    controlUpdateContest,
    controlDeleteContest

};
