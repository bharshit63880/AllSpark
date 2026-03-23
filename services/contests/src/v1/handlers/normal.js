import Contest from "../../../models/v1/contests.js";
import Participant from "../../../models/v1/participants.js";
import getPartition from "../../utils/getPartition.js";
import { sendEvent } from "../../utils/kafkaProducer.js";
import { publishToRedisPubSub } from "../../utils/redisPublisher.js";
import { getFromCache, setToCache } from "../../utils/redisCacheManagement.js";
import { getActiveSpecialAccessForContest } from "../specialAccessEnforcement.js";


const CURR_SERVICE_NAME = "contest-service";




const searchContests = async (data, metadata) => {
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
            support_team: 0,
            problems: 0,
        }


        if (metadata.source === "permission-service") {


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

            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in CONTEST SERVICE while Searching Contests....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};


const getAllContests = async (data, metadata) => {
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




        const filter = {};

        const projection = {
            support_team: 0,
            problems: 0,
        }

        const cachingInfo = {};
        metadata.cache = {
            hits: 0,
            misses: 0,
        };

        if (metadata.source === "permission-service") {

            cachingInfo.cacheKey = "contests:v1:all";
            cachingInfo.cacheTTL = 14400; // In Seconds thus it becomes 14400/60 = 240 Minutes = 4 Hours

            let queryResult;
            const { isValueFound, value } = await getFromCache(cachingInfo.cacheKey);

            // Search in the Cache If Available then Send via here
            if (isValueFound) {
                queryResult = value;
                metadata.cache.hits++;
            }
            else {
                // Get The List of All Contests and In the List Who is Support that is somewhat unneccessary to send and also problems in that are too unneccessary to send thus remove them and remember that the id are string format however they are actually the Foreign Keys in string form and since we have used lean thus they will not be populated if later implementation tries to populate then please change the DB models before that
                const contest = await Contest.find(filter).select(projection).lean();
                queryResult = contest;
                metadata.cache.misses++;
            }




            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!queryResult) {
                metadata.success = false;
                metadata.message = "Contests Not Found. Please Provide Correct Fields....";
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
            metadata.message = "Contests Found Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));

            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in CONTEST SERVICE while Getting All Contests....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }
};


const getSpecificContestDetails = async (data, metadata) => {
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
        const cachingInfo = {};
        metadata.cache = {
            hits: 0,
            misses: 0,
        };

        if (_id) {
            filter._id = _id;
            cachingInfo.cacheKey = `contests:v1:_id:${_id}`;
        }

        if (slug) {
            filter.slug = slug;
            cachingInfo.cacheKey = `contests:v1:slug:${slug}`;
        }


        if (metadata.source === "permission-service") {


            cachingInfo.cacheTTL = 7200; // In Seconds thus it becomes 7200/60 = 120 Minutes = 2 Hours


            let queryResult;
            const { isValueFound, value } = await getFromCache(cachingInfo.cacheKey);

            // Search in the Cache If Available then Send via here
            if (isValueFound) {
                queryResult = value;
                metadata.cache.hits++;
            }
            else {

                // Get The Specific Contest's Details
                const contest = await Contest.findOne(filter).lean();

                queryResult = contest;
                metadata.cache.misses++;
            }


            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (!queryResult) {
                metadata.success = false;
                metadata.message = "Contest Not Found. Please Provide Correct Fields....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            // Set The Successful Result to Cache Not Using Await as we don't want to be Waiting while It Cache Up Things for us we have sent please cache it if it does then ok or else we will try from DB until it set things right up in the cache
            setToCache(`contests:v1:_id:${queryResult._id}`, queryResult, cachingInfo.cacheTTL);
            setToCache(`contests:v1:slug:${queryResult.slug}`, queryResult, cachingInfo.cacheTTL);


            // Process the data and prepare the Response


            // Hide only support-team contacts for normal users.
            // Keep contest problem IDs so UI can show contest problem count/list and allow play flow.
            queryResult = { ...queryResult, support_team: [] };

            data = { ...data, result: queryResult };

            metadata.success = true;
            metadata.message = "Contest Found Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));

            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in CONTEST SERVICE while Getting Specific Contest Details....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }
};


const registerForContest = async (data, metadata) => {
    try {


        // const data = {
        // contest_id: <contest_id>,
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




        const { contest_id } = data;
        const user_id = metadata.actor.userId;

        const filter = {
            user_id: user_id,
            contest_id: contest_id,
        }

        if (metadata.source === "permission-service") {
            
            metadata.source = CURR_SERVICE_NAME;

            // We are considering that the Contest and User with given Id exists thus creating the Participant for that 
            const participantData = {
                user_id: user_id,
                contest_id: contest_id,
            };

            // Before Creating Object check if Already Registered User
            const existingParticipant = await Participant.findOne(filter).lean();
            if (existingParticipant) {
                data = { ...data, result: existingParticipant };
                metadata.success = false;
                metadata.message = "Already Registered For The Contest....";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }


            // Before Creating Object Check if contest is still open for registration.
            // Allow live registration until contest end-time to support late join flow.
            const currentDate = new Date();
            const contest = await Contest.findById(contest_id).lean();
            if (!contest) {
                data = { ...data, result: "Either Contest Not Found Or Ended" };
                metadata.success = false;
                metadata.message = "Sorry!! Contest not found. Please register in upcoming contests before start time....";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            const contestEndMs = new Date(contest.end_time).getTime();
            if (!Number.isFinite(contestEndMs)) {
                data = { ...data, result: "Either Contest Not Found Or Ended" };
                metadata.success = false;
                metadata.message = "Contest timing is invalid. Please contact support....";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            if (currentDate.getTime() >= contestEndMs) {
                const specialAccess = await getActiveSpecialAccessForContest({
                    user_id: user_id,
                    contest_id: contest_id,
                    allowed_access_types: ["CONTEST_REOPEN", "TIME_EXTENSION", "PROBLEM_ACCESS", "SUBMISSION_ONLY"],
                });

                if (!specialAccess) {
                    data = { ...data, result: "Either Contest Not Found Or Ended" };
                    metadata.success = false;
                    metadata.message =
                        "Sorry!! Contest already ended and no approved active special access found for this contest....";
                    metadata.updatedAt = (new Date()).toISOString();
                    await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                    return;
                }
            }


            // Register Participant
            const newParticipant = await new Participant(participantData).save();

            metadata.updatedAt = (new Date()).toISOString();

            if (!newParticipant) {
                metadata.success = false;
                metadata.message = "Not Registered for the Contest....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            
            // Process the data and prepare the Response
            data = { ...data, result: newParticipant };

            metadata.success = true;
            metadata.message = "Registered for the Contest Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));

            
            // Prepare _system data and emit event "contests.register.complete" so that relevant actions like updating in User's "participated_in_contests" fields can be done 
            
            // This is Objest's Structure for the System's Internal Data Flow unlike everything flowing in the Project this will also tell what data it has and information about that data will be in metadata
            const _system = {
                data: {
                    user_id: user_id,
                    contest_id: contest_id,
                },
                metadata: {
                    createdAt: (new Date()).toISOString(),
                    cache: {
                        hits: 0,
                        misses: 0,
                    },
                }
            };

            _system.metadata.success = true;
            _system.metadata.message = "Details of the Participant who Registered for Contest....";
            _system.metadata.source = CURR_SERVICE_NAME;
            _system.metadata.updatedAt = (new Date()).toISOString();

            // Add _system data to the data field of the Event
            data = {...data, _system: _system };

            // Send Event to topic "contests.register.complete"
            await sendEvent("contests.register.complete", await getPartition(), data, metadata);

            

            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in CONTEST SERVICE while Registering for Contest Details....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }
};


const startContest = async (data, metadata) => {


    try {


        // const data = {
        // contest_id: <contest_id>,
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




        const { contest_id } = data;
        const user_id = metadata.actor.userId;

        const filter = {
            user_id: user_id,
            contest_id: contest_id,
        }

        if (metadata.source === "permission-service") {

            metadata.source = CURR_SERVICE_NAME;

            const start_time = new Date();


            // At this Point it is Clear that User Have to Either Start Contest or have clicked on again on Start Button thus we have to get the Contest Problems thus have to get the List of Problems' Ids thus get the Problems from the "problems" field of the Contest Thus First of All Get The Contest Object and Put that into the "internal" Field of the "data" that will be used for internal operations

            // This is Objest's Structure for the System's Internal Data Flow unlike everything flowing in the Project this will also tell what data it has and information about that data will be in metadata
            const _system = {
                data: {},
                metadata: {
                    createdAt: (new Date()).toISOString(),
                    cache: {
                        hits: 0,
                        misses: 0,
                    },
                }
            };
            
            // First Of All Try to find From the Cache Else Find From the DB
            
            let queryResult;
            const { isValueFound, value } = await getFromCache(`contests:v1:_id:${contest_id}`);

            // Search in the Cache If Available then Send via here
            if (isValueFound) {
                queryResult = value;

                // This will tell in Observability that finding Objects or data from DB for internal work was found from the cache 
                _system.metadata.cache.hits++;
            }
            else {

                // Get The Specific Contest's Details
                const contest = await Contest.findById(contest_id).lean();

                
                queryResult = contest;
                // This will tell in Observability that finding Objects or data from DB for internal work was found from the DB 
                _system.metadata.cache.misses++;
            }
            
            
            // Although The Registered User for Contest will always Ensure for the Existance of the Contest But good to have check for unavailability of The Contest and Send Response if Some Misunderstanding has been developed
            if (!queryResult) {
                metadata.success = false;
                metadata.message = "The Contest doesn't Exists....";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }


            // Set The Successful Result to Cache Not Using Await as we don't want to be Waiting while It Cache Up Things for us we have sent please cache it if it does then ok or else we will try from DB until it set things right up in the cache
            setToCache(`contests:v1:_id:${queryResult._id}`, queryResult, 7200); // In Seconds thus it becomes 7200/60 = 120 Minutes = 2 Hours
            setToCache(`contests:v1:slug:${queryResult.slug}`, queryResult, 7200); // In Seconds thus it becomes 7200/60 = 120 Minutes = 2 Hours



            const partition = getPartition();

            // Before Starting Object check if User Already Registered for the Contest or not
            let existingParticipant = await Participant.findOne(filter);

            if (!existingParticipant) {
                metadata.success = false;
                metadata.message = "Not Registered for the Contest thus Sorry for this Contest You are not allowed to participate....";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }


            // Check if current time is inside contest running window using numeric timestamps
            const contestStartMs = new Date(queryResult.start_time).getTime();
            const contestEndMs = new Date(queryResult.end_time).getTime();
            const currentMs = start_time.getTime();
            let specialAccess = null;

            if (!Number.isFinite(contestStartMs) || !Number.isFinite(contestEndMs)) {
                metadata.success = false;
                metadata.message = "Contest timing is invalid. Please contact support....";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            if (currentMs < contestStartMs) {
                metadata.success = false;
                metadata.message = "Sorry! Contest has not started yet....";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            if (currentMs > contestEndMs) {
                specialAccess = await getActiveSpecialAccessForContest({
                    user_id: user_id,
                    contest_id: contest_id,
                    allowed_access_types: ["CONTEST_REOPEN", "TIME_EXTENSION", "PROBLEM_ACCESS", "SUBMISSION_ONLY"],
                });

                if (!specialAccess) {
                    metadata.success = false;
                    metadata.message = "Sorry! Contest is Over and no approved active special access exists....";
                    metadata.updatedAt = (new Date()).toISOString();
                    await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                    return;
                }
            }


            

            // Put the Contest's Details (stored in "queryResult" at that point) into the "internal" object's field so that other Microservices running can perform their tasks

            _system.data = {
                _id: queryResult._id, // Required to Trace Back Contest's Details again If required while Observability and more
                name: queryResult.name, // Required to Identify Easily Via Name and more
                created_by: queryResult.created_by, // Required to Contact the Concerned Person If required while Observability and more
                support_team: queryResult.support_team, // Required to Contact the Concerned Team If required while Observability and more
                problems: queryResult.problems, // Required to Get Problems If required while Observability and more
                start_time: queryResult.start_time, // Analytics Part May need it and more
                end_time: queryResult.end_time, // Analytics Part May need it and more
                duration: queryResult.duration, // Analytics Part May need it and more
                support_end_time: queryResult.support_end_time, // Analytics Part May need it and more
            };
            _system.metadata.success = true;
            _system.metadata.message = "Details of the Started Contest By Participant....";
            _system.metadata.source = CURR_SERVICE_NAME;
            _system.metadata.updatedAt = (new Date()).toISOString();


            const existingParticipantEndMs = existingParticipant.end_time
                ? (new Date(existingParticipant.end_time)).getTime()
                : NaN;

            if (existingParticipant.start_time && Number.isFinite(existingParticipantEndMs) && existingParticipantEndMs > currentMs) {
                data = { ...data, result: existingParticipant, _system: _system };
                metadata.success = true;
                metadata.message = "Already Started The Contest....";
                metadata.updatedAt = (new Date()).toISOString();
                await sendEvent("contests.startContest.complete", partition, data, metadata);
                return;
            }

            // Set Total Duration Allowed from the Contest Duration So that It can be compared later when the User Starts the Contest and Thus User's Contest is Auto Ended and if The User tries to make Submissions then they will be discarded by checking the "end_time" field which will be set post "total_duration" from "start_time" within the Range Of Contest's Running Window

            // Since The User Started at "start_time.getTime()" thus User Should get the Minimum of(Contest's Duration, (Contest's End Time - start_time.getTime())) as the Contest's Running Window is "Contest's Start Time to End Time" thus User Should not get the Time Past the End Time of the Contest
            const contestDuration = queryResult.duration;
            const timeToEndTimeOfContest = (new Date(queryResult.end_time)).getTime() - start_time.getTime();
            let end_time;

            if (specialAccess) {
                const accessEndTimeMs = (new Date(specialAccess.expires_at)).getTime();
                const timeToSpecialAccessEnd = accessEndTimeMs - start_time.getTime();
                if (!Number.isFinite(timeToSpecialAccessEnd) || timeToSpecialAccessEnd <= 0) {
                    metadata.success = false;
                    metadata.message = "Special access is expired or invalid for contest start....";
                    metadata.updatedAt = (new Date()).toISOString();
                    await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                    return;
                }

                existingParticipant.total_duration = timeToSpecialAccessEnd;
                end_time = new Date(accessEndTimeMs);
            }
            else {
                // The Total Time Should be Allowed to the Participant will be Minimum of (contestDuration, timeToEndTimeOfContest)
                existingParticipant.total_duration = contestDuration < timeToEndTimeOfContest ? contestDuration : timeToEndTimeOfContest;

                // Update the End Time So that It can Be compared when the Submission is Made & If The Submission Exceeds the "end_time" then Submission will not be Processed
                const liberty_of_time = 900000; // 15 Minutes Liberty is given to the Participants to Balance the Trade Off of the Processing Of The Events
                end_time = new Date(start_time.getTime() + existingParticipant.total_duration + liberty_of_time);
            }

            // Update And Save Changes
            existingParticipant.start_time = start_time;
            existingParticipant.end_time = end_time;

            await existingParticipant.save();
            
            
            
            
            // Process the data and prepare the Response
            data = { ...data, result: existingParticipant, _system: _system };
            
            metadata.success = true;
            metadata.message = "Started the Contest Successfully....";
            metadata.updatedAt = (new Date()).toISOString();
            await sendEvent("contests.startContest.complete", partition, data, metadata);

            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in CONTEST SERVICE while Starting the Contest....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details and/or Try Logging in again....";
        metadata.updatedAt = (new Date()).toISOString();
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};




export {
    searchContests,
    getAllContests,
    getSpecificContestDetails,
    registerForContest,
    startContest,

};
