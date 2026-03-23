import Problem from "../../../models/v1/problems.js";
import { getFromCache, setToCache } from "../../utils/redisCacheManagement.js";
import { publishToRedisPubSub } from "../../utils/redisPublisher.js";
import sanitizeResponse from "../../utils/sanitizeResponse.js";
import { sendEvent } from "../../utils/kafkaProducer.js";
import getPartition from "../../utils/getPartition.js";


const CURR_SERVICE_NAME = "problem-service";
const LANGUAGE_ID_ALIASES = {
    52: [52, 54], // C++ (GCC 7.4.0) / C++ (GCC 9.2.0)
    54: [54, 52],
};

const getLanguageIdsForLookup = (languageId) => {
    const normalizedLanguageId = Number(languageId);
    if (!Number.isFinite(normalizedLanguageId)) {
        return [];
    }

    const aliases = LANGUAGE_ID_ALIASES[normalizedLanguageId] || [normalizedLanguageId];
    return [...new Set(aliases.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)))];
};




const _systemGetProblemsOfStartedContest = async (data, metadata) => {
    try {


        // const data = {
        //     ...(Some Data Recieved From The Client Side or Initial Request to the API),
        //     result: { 
        //              <result> 
        //     }, // Some Data Required To Send to Client Side or to source who does the Initial Request to the API
        //     _system: {
        //         data: {
        //             problems: <problems>, // Required to Get Problems If required while Observability and more
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

        metadata.cache = {
            hits: 0,
            misses: 0,
        };

        if (data._system.metadata.source === "contest-service") {

            data._system.metadata.source = CURR_SERVICE_NAME;


            // The List Of Problems to send to the Participant of the Contest 
            let resultOfProblemsList = [];

            const listOfProblemsToFind = data._system.data.problems;

            // Find all the Problems
            for (let index = 0; index < listOfProblemsToFind.length; index++) {
                const idOfProblem = listOfProblemsToFind[index];

                const cachingInfo = {
                    cacheKey: `problems:v1:_id:${idOfProblem}`,
                    cacheTTL: 7200, // In Seconds thus it becomes 7200/60 = 120 Minutes = 2 Hours
                };


                let queryResult;
                const { isValueFound, value } = await getFromCache(cachingInfo.cacheKey);

                // Search in the Cache If Available then Send from the Cache
                if (isValueFound) {
                    queryResult = value;
                    metadata.cache.hits++;
                }
                else {

                    // Get The Specific Problem's Details
                    const problem = await Problem.findById(idOfProblem).lean();

                    queryResult = problem;
                    metadata.cache.misses++;
                }


                if (queryResult) {
                    // Set The Successful Result to Cache Not Using Await as we don't want to be Waiting while It Cache Up Things for us we have sent please cache it if it does then ok or else we will try from DB until it set things right up in the cache
                    setToCache(cachingInfo.cacheKey, queryResult, cachingInfo.cacheTTL);

                    // Save the Problem into the Final Result to send Participant & Remeber to Remove Private Test Case as they are private thus not to be shown to Users :)
                    queryResult.test_cases = (queryResult.test_cases).map((test_case) => {
                        return {
                            language_id: test_case.language_id,
                            public_test_cases: test_case.public_test_cases,
                        };
                    })
                    resultOfProblemsList = [...resultOfProblemsList, queryResult];
                }

            }


            // Drop the "data._system" as that field is required for only tasks in the System it has no significance to Users other than revealing our business flow which is kind of also reveal already if your'e reading this as it is Open source (But why to even send which is not required probably You got the point i guess) :) 
            data = await sanitizeResponse(data);

            metadata.source = CURR_SERVICE_NAME;
            metadata.updatedAt = (new Date()).toISOString();

            if (resultOfProblemsList.length !== listOfProblemsToFind.length) {

                metadata.success = false;
                metadata.message = "Problems for the Contest Not Found. Although Contest Started. Sorry for the trouble Please Contact the Support Team or Admins....";
                await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
                return;
            }


            metadata.success = true;
            metadata.message = "Contest Started and the Problems for the Contest are Successfully Found....";

            // Carefully Look here We Are Appending problems' list to the existing "data.result" which is object of the Participant Contains Id of the Contest for which the User has Requested to Start the Contest
            data = { ...data, result: { ...data.result, problems: resultOfProblemsList } };

            // Send Response Back to the User Via Response Channel
            await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
            return;
        }




    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in PROBLEM SERVICE while Getting the Contest's Problems but Contest Started....");
        metadata.source = CURR_SERVICE_NAME;
        metadata.success = false;
        metadata.message = "Contest Started but Something Went Wrong while Getting Contest's Problems. Please Check if Contest Exists and/or Try Logging in again....";
        metadata.updatedAt = (new Date()).toISOString();
        await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));
        return;
    }
};



const _systemGetTestCasesOfPracticeProblem = async (data, metadata) => {


    try {
        // const data = {
        //     ...(Some Data Recieved From The Client Side or Initial Request to the API),
        //     result: <result>, // Some Data Required To Send to Client Side or to source who does the Initial Request to the API
        //     _system: {
        //         data: {
        //             _id: submission._id, // Required to Further Identify Which Submission has been Judged and needs to be Updated
        //             problem_id: submission.problem_id, // The Problem Id which is Related to the Submission
        //             is_for_public_test_cases: submission.is_for_public_test_cases, // Tells Info About the Test Cases Whether it was for the Public Test Cases or Private Test Cases
        //             is_cpu_executed: submission.is_cpu_executed, // This Should Be Marked True After the Execution onto the CPU  
        //             created_by: submission.created_by,
        //             source_code: submission.source_code,
        //             language_id: submission.language_id,
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


        const {
            problem_id,
            is_for_public_test_cases,
            language_id,
        } = data._system.data;

        if (data._system.metadata.source === "submission-service") {

            data._system.metadata.source = CURR_SERVICE_NAME;

            // Find the Problem By The Id

            // First try to find the Problem in the Cache and if not found in the Cache then From DB and then save into the Cache

            let queryResult;
            const { isValueFound, value } = await getFromCache(`problems:v1:_id:${problem_id}`);

            // Search in the Cache If Available then Send from the Cache
            if (isValueFound) {
                queryResult = value;
                data._system.metadata.cache.hits++;
            }
            else {
                // Get Details of Specific Problem
                const problem = await Problem.findById(problem_id).lean();
                queryResult = problem;
                data._system.metadata.cache.misses++;
            }



            // If the Problem Doesn't Exists then Send Event to the "problems.practiceSubmission.getTestCases.corrupt" topic Else Send Event to the "problems.practiceSubmission.getTestCases.complete"
            const completeTopic = "problems.practiceSubmission.getTestCases.complete";
            const corruptTopic = "problems.practiceSubmission.getTestCases.corrupt";
            const partition = await getPartition();

            if (!queryResult) {
                data._system.metadata.success = false;
                data._system.metadata.message = "Practice Problem Doesn't Exists....";
                data._system.metadata.updatedAt = (new Date()).toISOString();

                await sendEvent(corruptTopic, partition, data, metadata);
                return;
            }


            // Set The Successful Result to Cache Not Using Await as we don't want to be Waiting while It Cache Up Things for us we have sent please cache it if it does then ok or else we will try from DB until it set things right up in the cache
            setToCache(`problems:v1:_id:${problem_id}`, queryResult, 7200); // In Seconds 7200/60 = 120 Minutes = 120/60 = 2 Hours

            // Check Which Language's Test Cases are Required and whether the Public Test Cases Are Required or Private Test Cases are Required by the Data provided in the "data._system"
            const requiredLanguageIds = getLanguageIdsForLookup(language_id);
            const requiredLanguageTestCases = (queryResult.test_cases || []).find((testCase) => requiredLanguageIds.includes(Number(testCase.language_id)));

            if (!requiredLanguageTestCases) {
                data._system.metadata.success = false;
                data._system.metadata.message = "Practice Problem Exists but Test Cases are Missing for the Given Language Id....";
                data._system.metadata.updatedAt = (new Date()).toISOString();

                await sendEvent(corruptTopic, partition, data, metadata);
                return;
            }


            const requiredTestCases = is_for_public_test_cases === true ? requiredLanguageTestCases.public_test_cases : requiredLanguageTestCases.private_test_cases;

            if (!Array.isArray(requiredTestCases) || requiredTestCases.length === 0) {
                data._system.metadata.success = false;
                data._system.metadata.message = "Practice Problem Exists but Test Cases are Missing for the Given Language Id....";
                data._system.metadata.updatedAt = (new Date()).toISOString();

                await sendEvent(corruptTopic, partition, data, metadata);
                return;
            }


            // Embed the Test Cases So That the JUDGE SERVICE can run the Test Cases for the Given Language
            data._system.data = { ...data._system.data, test_cases: requiredTestCases };

            data._system.metadata.success = true;
            data._system.metadata.message = "Practice Problem's Test Cases Found Successfully....";
            data._system.metadata.updatedAt = (new Date()).toISOString();
            await sendEvent(completeTopic, partition, data, metadata);
            return;
        }


    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in PROBLEM SERVICE while Getting the Practice Problem's Details....");
        data._system.metadata.source = CURR_SERVICE_NAME;
        data._system.metadata.success = false;
        data._system.metadata.message = "Something went wrong while Getting the Practice Problem's Details....";
        data._system.metadata.updatedAt = (new Date()).toISOString();
        await sendEvent("problems.practiceSubmission.getTestCases.corrupt", 0, data, metadata);
        return;
    }

};


const _systemGetTestCasesOfContestProblem = async (data, metadata) => {



    try {
        // const data = {
        //     ...(Some Data Recieved From The Client Side or Initial Request to the API),
        //     result: <result>, // Some Data Required To Send to Client Side or to source who does the Initial Request to the API
        //     _system: {
        //         data: {
        //             _id: submission._id, // Required to Further Identify Which Submission has been Judged and needs to be Updated
        //             problem_id: submission.problem_id, // The Problem Id which is Related to the Submission
        //             is_for_public_test_cases: submission.is_for_public_test_cases, // Tells Info About the Test Cases Whether it was for the Public Test Cases or Private Test Cases
        //             is_cpu_executed: submission.is_cpu_executed, // This Should Be Marked True After the Execution onto the CPU  
        //             created_by: submission.created_by,
        //             source_code: submission.source_code,
        //             language_id: submission.language_id,
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


        const {
            problem_id,
            is_for_public_test_cases,
            language_id,
        } = data._system.data;

        if (data._system.metadata.source === "submission-service") {

            data._system.metadata.source = CURR_SERVICE_NAME;

            // Find the Problem By The Id

            // First try to find the Problem in the Cache and if not found in the Cache then From DB and then save into the Cache

            let queryResult;
            const { isValueFound, value } = await getFromCache(`problems:v1:_id:${problem_id}`);

            // Search in the Cache If Available then Send from the Cache
            if (isValueFound) {
                queryResult = value;
                data._system.metadata.cache.hits++;
            }
            else {
                // Get Details of Specific Problem
                const problem = await Problem.findById(problem_id).lean();
                queryResult = problem;
                data._system.metadata.cache.misses++;
            }


            // If the Problem Doesn't Exists then Send Event to the "problems.contestSubmission.getTestCases.corrupt" topic Else Send Event to the "problems.contestSubmission.getTestCases.complete"
            const completeTopic = "problems.contestSubmission.getTestCases.complete";
            const corruptTopic = "problems.contestSubmission.getTestCases.corrupt";
            const partition = await getPartition();

            if (!queryResult) {
                data._system.metadata.success = false;
                data._system.metadata.message = "Contest's Problem Doesn't Exists....";
                data._system.metadata.updatedAt = (new Date()).toISOString();

                await sendEvent(corruptTopic, partition, data, metadata);
                return;
            }


            // Set The Successful Result to Cache Not Using Await as we don't want to be Waiting while It Cache Up Things for us we have sent please cache it if it does then ok or else we will try from DB until it set things right up in the cache
            setToCache(`problems:v1:_id:${problem_id}`, queryResult, 7200); // In Seconds 7200/60 = 120 Minutes = 120/60 = 2 Hours

            // Check Which Language's Test Cases are Required and whether the Public Test Cases Are Required or Private Test Cases are Required by the Data provided in the "data._system"
            const requiredLanguageIds = getLanguageIdsForLookup(language_id);
            const requiredLanguageTestCases = (queryResult.test_cases || []).find((testCase) => requiredLanguageIds.includes(Number(testCase.language_id)));

            if (!requiredLanguageTestCases) {
                data._system.metadata.success = false;
                data._system.metadata.message = "Contest's Problem Exists but Test Cases are Missing for the Given Language Id....";
                data._system.metadata.updatedAt = (new Date()).toISOString();

                await sendEvent(corruptTopic, partition, data, metadata);
                return;
            }


            const requiredTestCases = is_for_public_test_cases === true ? requiredLanguageTestCases.public_test_cases : requiredLanguageTestCases.private_test_cases;

            if (!Array.isArray(requiredTestCases) || requiredTestCases.length === 0) {
                data._system.metadata.success = false;
                data._system.metadata.message = "Contest's Problem Exists but Test Cases are Missing for the Given Language Id....";
                data._system.metadata.updatedAt = (new Date()).toISOString();

                await sendEvent(corruptTopic, partition, data, metadata);
                return;
            }


            // Embed the Test Cases So That the JUDGE SERVICE can run the Test Cases for the Given Language
            data._system.data = { ...data._system.data, test_cases: requiredTestCases };

            data._system.metadata.success = true;
            data._system.metadata.message = "Contest's Problem's Test Cases Found Successfully....";
            data._system.metadata.updatedAt = (new Date()).toISOString();
            await sendEvent(completeTopic, partition, data, metadata);
            return;
        }


    } catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in PROBLEM SERVICE while Getting the Contest's  Problem's Details....");
        data._system.metadata.source = CURR_SERVICE_NAME;
        data._system.metadata.success = false;
        data._system.metadata.message = "Something went Wrong while Getting the Contest's Problem's Details....";
        data._system.metadata.updatedAt = (new Date()).toISOString();
        await sendEvent("problems.contestSubmission.getTestCases.corrupt", 0, data, metadata);
        return;
    }


};








export {
    _systemGetProblemsOfStartedContest,
    _systemGetTestCasesOfPracticeProblem,
    _systemGetTestCasesOfContestProblem,
};
