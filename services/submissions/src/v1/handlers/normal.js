import Submission from "../../../models/v1/submissions.js";
import Contest from "../../../models/v1/contests.js";
import Participant from "../../../models/v1/participants.js";
import { getFromCache, setInCache } from "../../utils/redisCacheManager.js";
import { publishToRedisPubSub } from "../../utils/v1/redisPublisher.js";
import { sendEvent } from "../../utils/kafkaProducer.js";
import getPartition from "../../utils/getPartition.js";
import { getActiveSpecialAccessForContest } from "../specialAccessEnforcement.js";


const CURR_SERVICE_NAME = "submission-service";




const createSubmissionOfPracticeProblem = async (data, metadata) => {


    try {


        // const data = {
        //     problem_id: <"problem_id">,
        //     is_for_public_test_cases: <true or false>,
        //     source_code: <source_code>,
        //     language_id: <language_id>,
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




        if (metadata.source === "permission-service") {


            metadata.source = CURR_SERVICE_NAME;


            const {
                problem_id, // Assumes That the Problem Exists However required things to make the Submission is already in the Data this is here putted for Observability, Analytics Things or more 
                is_for_public_test_cases,
                source_code,
                language_id,
            } = data;

            // Logged In User's Id will be here to identify who created this Submission
            const created_by = metadata.actor.userId;
            const normalizedLanguageId = Number(language_id);

            if (!created_by) {
                metadata.success = false;
                metadata.message = "Invalid auth context for submission creation. Please login again.";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            if (!Number.isFinite(normalizedLanguageId)) {
                metadata.success = false;
                metadata.message = "Invalid language_id for submission.";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            // Since The Submission is Being Created Now Thus It is Not Executed on CPU thus Marking that
            const is_cpu_executed = false;

            // Prepare the Data of the Submission Object
            const submissionData = {
                problem_id: problem_id,
                is_for_public_test_cases: is_for_public_test_cases,
                is_cpu_executed: is_cpu_executed,
                created_by: created_by,
                source_code: source_code,
                language_id: normalizedLanguageId,
                test_cases: [],
            };

            // Save the Submission Data
            const submission = await new Submission(submissionData).save();

            // Update the time of Updation of the Event's Details
            metadata.updatedAt = (new Date()).toISOString();

            if (!submission) {
                metadata.success = false;
                metadata.message = "Submission Not Created. Please Provide All Details, Retry Practice Problem Submission and/or Try Logging in again....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }


            // Submission is Craeted Update About This to User and Send Event to "submissions.practice.create.complete" for further Processing Via JUDGE SERVICE to execute this Submission on CPU
            const _system = {
                data: {
                    _id: submission._id,
                    contest_id: submission.contest_id,
                    problem_id: submission.problem_id,
                    is_for_public_test_cases: submission.is_for_public_test_cases,
                    is_cpu_executed: submission.is_cpu_executed,
                    created_by: submission.created_by,
                    source_code: submission.source_code,
                    language_id: submission.language_id,
                },
                metadata: {
                    source: CURR_SERVICE_NAME,
                    createdAt: (new Date()).toISOString(),
                    cache: {
                        hits: 0,
                        misses: 0,
                    },
                },
            };

            // Add Result to the "data" to Send User
            data = { ...data, result: submission };
            metadata.success = true;
            metadata.message = "Submission for Practice Problem Created Successfully....";
            metadata.updatedAt = (new Date()).toISOString();
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));


            // Add "_system" details to the "data" to Send Kafka Queue so that Relevant Services can perform their Actions
            data = { ...data, _system: _system };
            const topic = "submissions.practice.create.complete";
            const partition = getPartition();

            // Send Event to Kafka Queue
            await sendEvent(topic, partition, data, metadata);
            await sendEvent("submissions.created", getPartition(), { _id: submission._id }, {});

            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in SUBMISSION SERVICE while Creating Submission for Practice Problem....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details, Retry Practice Problem Submission and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};


const createSubmissionOfContestProblem = async (data, metadata) => {


    try {


        // const data = {
        //     problem_id: <"problem_id">,
        //     contest_id: <"contest_id">,
        //     is_for_public_test_cases: <true or false>,
        //     source_code: <source_code>,
        //     language_id: <language_id>,
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




        if (metadata.source === "permission-service") {


            metadata.source = CURR_SERVICE_NAME;


            const {
                problem_id,
                contest_id,
                is_for_public_test_cases,
                source_code,
                language_id,
            } = data;

            // Logged In User's Id will be here to identify who created this Submission
            const created_by = metadata.actor.userId;
            const normalizedLanguageId = Number(language_id);

            if (!created_by) {
                metadata.success = false;
                metadata.message = "Invalid auth context for submission creation. Please login again.";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            if (!Number.isFinite(normalizedLanguageId)) {
                metadata.success = false;
                metadata.message = "Invalid language_id for submission.";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            if (!String(contest_id || "").trim()) {
                metadata.success = false;
                metadata.message = "contest_id is required for contest submissions.";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            if (!String(problem_id || "").trim()) {
                metadata.success = false;
                metadata.message = "problem_id is required for contest submissions.";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            const contest = await Contest.findById(contest_id).lean();
            if (!contest) {
                metadata.success = false;
                metadata.message = "Contest not found for contest submission.";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            const participant = await Participant.findOne({
                contest_id: contest_id,
                user_id: created_by,
            }).lean();

            if (!participant) {
                metadata.success = false;
                metadata.message = "Not registered/started for this contest. Please start contest workspace first.";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            const now = new Date();
            const nowMs = now.getTime();
            const contestStartMs = new Date(contest.start_time).getTime();
            const contestEndMs = new Date(contest.end_time).getTime();
            const participantStartMs = participant.start_time ? new Date(participant.start_time).getTime() : NaN;
            const participantEndMs = participant.end_time ? new Date(participant.end_time).getTime() : NaN;

            if (!Number.isFinite(contestStartMs) || !Number.isFinite(contestEndMs)) {
                metadata.success = false;
                metadata.message = "Contest timing is invalid for submission.";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            if (!Number.isFinite(participantStartMs) || !Number.isFinite(participantEndMs)) {
                metadata.success = false;
                metadata.message = "Contest not started for this user. Please start contest workspace first.";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            if (nowMs < participantStartMs) {
                metadata.success = false;
                metadata.message = "Contest has not started for your workspace yet.";
                metadata.updatedAt = (new Date()).toISOString();
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }

            const contestWindowClosed = Number.isFinite(contestEndMs) && nowMs > contestEndMs;
            const participantWindowClosed = Number.isFinite(participantEndMs) && nowMs > participantEndMs;

            if (contestWindowClosed || participantWindowClosed) {
                const specialAccess = await getActiveSpecialAccessForContest({
                    user_id: created_by,
                    contest_id: contest_id,
                    problem_id: problem_id,
                    allowed_access_types: ["SUBMISSION_ONLY", "CONTEST_REOPEN", "TIME_EXTENSION", "PROBLEM_ACCESS"],
                });

                if (!specialAccess) {
                    metadata.success = false;
                    metadata.message =
                        "Contest submission window is closed and no approved active special access exists.";
                    metadata.updatedAt = (new Date()).toISOString();
                    await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                    return;
                }
            }

            // Since The Submission is Being Created Now Thus It is Not Executed on CPU thus Marking that
            const is_cpu_executed = false;

            // Prepare the Data of the Submission Object
            const submissionData = {
                contest_id: contest_id,
                problem_id: problem_id,
                is_for_public_test_cases: is_for_public_test_cases,
                is_cpu_executed: is_cpu_executed,
                created_by: created_by,
                source_code: source_code,
                language_id: normalizedLanguageId,
                test_cases: [],
            };

            // Save the Submission Data
            const submission = await new Submission(submissionData).save();

            // Update the time of Updation of the Event's Details
            metadata.updatedAt = (new Date()).toISOString();

            if (!submission) {
                metadata.success = false;
                metadata.message = "Submission Not Created. Please Provide All Details, Retry Contest's Problem Submission and/or Try Logging in again....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }


            // Submission is Craeted Update About This to User and Send Event to \"submissions.contest.create.complete\" for further Processing Via JUDGE SERVICE to execute this Submission on CPU
            const _system = {
                data: {
                    _id: submission._id,
                    problem_id: submission.problem_id,
                    is_for_public_test_cases: submission.is_for_public_test_cases,
                    is_cpu_executed: submission.is_cpu_executed,
                    created_by: submission.created_by,
                    source_code: submission.source_code,
                    language_id: submission.language_id,
                },
                metadata: {
                    source: CURR_SERVICE_NAME,
                    createdAt: (new Date()).toISOString(),
                    cache: {
                        hits: 0,
                        misses: 0,
                    },
                },
            };

            // Add Result to the "data" to Send User
            data = { ...data, result: submission };
            metadata.success = true;
            metadata.message = "Submission for Contest's Problem Created Successfully....";
            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));


            // Add "_system" details to the "data" to Send Kafka Queue so that Relevant Services can perform their Actions
            data = { ...data, _system: _system };
            const topic = "submissions.contest.create.complete";
            const partition = getPartition();

            // Update the Time When the Data for Use of the System is Updated
            _system.metadata.updatedAt = (new Date()).toISOString();

            // Send Event to Kafka Queue
            await sendEvent(topic, partition, data, metadata);
            await sendEvent("submissions.created", getPartition(), { _id: submission._id }, {});

            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in SUBMISSION SERVICE while Creating Submission for Contest's Problem....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. Please Provide All Details, Retry Contest's Problem Submission and/or Try Logging in again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};


const getSpecificSubmissionDetails = async (data, metadata) => {


    try {


        // const data = {
        //     _id: <_id>, // Id Of the Submission
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




        if (metadata.source === "permission-service") {


            metadata.source = CURR_SERVICE_NAME;


            const {
                _id,
            } = data;


            const filter = {
                _id: _id,
            };

            // Get the Details of the Submission


            // First Try Getting the Details from the Cache and if not found then from DB
            metadata.cache = {
                hits: 0,
                misses: 0,
            };

            let queryResult;
            const { isValueFound, value } = await getFromCache(`submissions:v1:_id:${_id}`);

            if (isValueFound) {
                queryResult = value;
                metadata.cache.hits++;
            }
            else {
                const submission = await Submission.findOne(filter).lean();
                metadata.cache.misses++;
                queryResult = submission;
            }

            // Update the time of Updation of the Event's Details
            metadata.updatedAt = (new Date()).toISOString();

            if (!queryResult) {
                metadata.success = false;
                metadata.message = "Submission Not Found. Please Provide All Details and/or Try again....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }



            // Add Result to the "data" to Send User
            data = { ...data, result: queryResult };
            metadata.success = true;
            metadata.message = "Submission found Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));


            // Set The Successful Result to Cache Not Using Await as we don't want to be Waiting while It Cache Up Things for us we have sent please cache it if it does then ok or else we will try from DB until it set things right up in the cache
            setInCache(`submissions:v1:_id:${_id}`, queryResult, 7200); // In Seconds thus it becomes 7200/60 = 120 Minutes = 2 Hours

            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in SUBMISSION SERVICE while Getting Submission....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. While Getting Submission. Please Provide All Details and/or Try again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};


const getAllSubmissionsForProblemByUser = async (data, metadata) => {


    try {


        // const data = {
        //     problem_id: <problem_id>, // Id of the Problem
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




        if (metadata.source === "permission-service") {


            metadata.source = CURR_SERVICE_NAME;


            const {
                problem_id
            } = data;

            const created_by = metadata.actor.userId;

            const filter = {
                problem_id: problem_id,
                created_by: created_by,
            };

            // Get All Submissions Made by the User Related to the Specific Problem 
            const submission = await Submission.find(filter).lean();

           
            // Update the time of Updation of the Event's Details
            metadata.updatedAt = (new Date()).toISOString();

            if (!submission) {
                metadata.success = false;
                metadata.message = "Submissions Not Found. Please Provide All Details and/or Try again....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }



            // Add Result to the "data" to Send User
            data = { ...data, result: submission };
            metadata.success = true;
            metadata.message = "Submissions found Successfully....";
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));

            return;
        }




    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in SUBMISSION SERVICE while Getting All Submission Related to the Problem Id Made By the User....");
        metadata.success = false;
        metadata.message = "Something Went Wrong. while Getting All Submission Related to the Problem Id Made By the User. Please Provide All Details and/or Try again....";
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }

};








export {
    createSubmissionOfPracticeProblem,
    createSubmissionOfContestProblem,
    getSpecificSubmissionDetails,
    getAllSubmissionsForProblemByUser,
};
