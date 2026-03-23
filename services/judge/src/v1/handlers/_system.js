import "dotenv/config";
import { getFromCache, setToCache } from "../../utils/redisCacheManagement.js";
import { publishToRedisPubSub } from "../../utils/redisPublisher.js";
import sanitizeResponse from "../../utils/sanitizeResponse.js";
import { sendEvent } from "../../utils/kafkaProducer.js";
import getPartition from "../../utils/getPartition.js";

import axios from "axios";


const CURR_SERVICE_NAME = "judge-service";
const CODE_EXECUTION_ENGINE_API_URL = process.env.CODE_EXECUTION_ENGINE_API_URL;
const JUDGE_POLL_DELAY_MS = Math.max(200, Number(process.env.JUDGE_POLL_DELAY_MS) || 1500);
const JUDGE_MAX_POLL_ATTEMPTS = Math.max(1, Number(process.env.JUDGE_MAX_POLL_ATTEMPTS) || 80);
const JUDGE_MAX_STACK_LIMIT = Math.max(1, Number(process.env.JUDGE_MAX_STACK_LIMIT) || 128000);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(1, ms)));

const toBase64 = (value) => Buffer.from(String(value ?? ""), "utf8").toString("base64");

const fromBase64 = (value) => {
    if (value == null || value === "") return "";
    try {
        return Buffer.from(String(value), "base64").toString("utf8");
    } catch {
        return "";
    }
};

const isPendingStatus = (statusId) => {
    const parsed = Number(statusId);
    return !parsed || parsed <= 2;
};

const toFiniteNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const buildJudgeBatchSubmission = (testCase, languageId, sourceCodeBase64) => {
    // Judge0 rejects unknown keys, so only send allowed execution fields.
    const submission = {
        language_id: Number(languageId),
        source_code: sourceCodeBase64,
        stdin: toBase64(testCase?.stdin ?? ""),
        expected_output: toBase64(testCase?.expected_output ?? ""),
    };

    const cpuTimeLimit = toFiniteNumber(testCase?.cpu_time_limit);
    const memoryLimit = toFiniteNumber(testCase?.memory_limit);
    const stackLimit = toFiniteNumber(testCase?.stack_limit);
    const wallTimeLimit = toFiniteNumber(testCase?.wall_time_limit);

    if (cpuTimeLimit !== undefined) submission.cpu_time_limit = cpuTimeLimit;
    if (memoryLimit !== undefined) submission.memory_limit = memoryLimit;
    if (stackLimit !== undefined) submission.stack_limit = Math.min(stackLimit, JUDGE_MAX_STACK_LIMIT);
    if (wallTimeLimit !== undefined) submission.wall_time_limit = wallTimeLimit;

    return submission;
};



const _systemExecuteSubmissionOfPracticeProblem = async (data, metadata) => {

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
        //             test_cases: test_cases, // These Test Cases Will be Supplied to the Code Execution Engine to Test if the Source Code is Running it Correctly with the Constraints Provided in the Individual Test Cases & They Have Fetched From the PROBLEM SERVICE thus find Structure of these test cases from there and after the completion of the CPU execution these will be updated into the "submission.test_cases"
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



        // Make Batch Submissions for The Given Test Cases and if Anything Breaks then Send Event to the "judges.execution.practice.corrupt" topic and if all things goes smooth then push to "judges.execution.practice.getUpdates" and then if all submissions got its status other than "In Queue" or "Processing" then Send Event to "judges.execution.practice.complete"

        if (data._system.metadata.source === "problem-service") {

            data._system.metadata.source = CURR_SERVICE_NAME;

            const { language_id, source_code, test_cases } = data._system.data;

            const encodedSourceCode = toBase64(source_code);
            const submissions = test_cases.map((testCase) => buildJudgeBatchSubmission(testCase, language_id, encodedSourceCode));

            const payload = {
                submissions: submissions,
            };


            // Make Request to the Code Execution Engine 
            const response = await axios.post(`${CODE_EXECUTION_ENGINE_API_URL}/submissions/batch?base64_encoded=true`, payload);

            const submissionResponseTokens = response.data; // [ {token: "...."}, {token: "...."}, .... ] we will get as response the respective submission token for identifying it later on to request the final status of the submission  

            const updatedTestCases = test_cases.map((testCase, index) => {
                return {
                    ...testCase,
                    ...submissionResponseTokens[index],
                };
            })

            // Update the Test Cases in the System only data so that these corresponding tokens can be used to request the final status of the submission
            data._system.data = { ...data._system.data, test_cases: updatedTestCases };

            // Update the Time to Update the Event's Data 
            data._system.metadata.success = true;
            data._system.metadata.updatedAt = (new Date()).toISOString();
            data._system.metadata.message = "Submissions for the Test Cases are Made Successfully to the Code Execution Engine....";
            data._system.metadata.pollAttempts = 0;


            // Send Event "judges.execution.practice.getUpdates" topic to Get Updates of the Submissions made for the Each Test Case
            const topic = "judges.execution.practice.getUpdates";
            const partition = await getPartition();
            await sendEvent(topic, partition, data, metadata);
            return;
        }


    }
    catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in JUDGE SERVICE while Creating Submission Request for the Practice Problem's Test Cases to the Code Execution Engine....");

        data._system.metadata.source = CURR_SERVICE_NAME;
        data._system.metadata.success = false;
        data._system.metadata.updatedAt = (new Date()).toISOString();
        data._system.metadata.message = "Something went wrong while Creating Submission Request for the Practice Problem's Test Cases to the Code Execution Engine....";

        const topic = "judges.execution.practice.corrupt";
        const partition = await getPartition();
        await sendEvent(topic, partition, data, metadata);

        return;

    }

};


const _systemExecuteSubmissionOfContestProblem = async (data, metadata) => {


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
        //             test_cases: test_cases, // These Test Cases Will be Supplied to the Code Execution Engine to Test if the Source Code is Running it Correctly with the Constraints Provided in the Individual Test Cases & They Have Fetched From the PROBLEM SERVICE thus find Structure of these test cases from there and after the completion of the CPU execution these will be updated into the "submission.test_cases"
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



        // Make Batch Submissions for The Given Test Cases and if Anything Breaks then Send Event to the "judges.execution.contest.corrupt" topic and if all things goes smooth then push to "judges.execution.contest.getUpdates" and then if all submissions got its status other than "In Queue" or "Processing" then Send Event to "judges.execution.contest.complete"


        if (data._system.metadata.source === "problem-service") {

            data._system.metadata.source = CURR_SERVICE_NAME;

            const { language_id, source_code, test_cases } = data._system.data;

            const encodedSourceCode = toBase64(source_code);
            const submissions = test_cases.map((testCase) => buildJudgeBatchSubmission(testCase, language_id, encodedSourceCode));

            const payload = {
                submissions: submissions,
            };


            // Make Request to the Code Execution Engine 
            const response = await axios.post(`${CODE_EXECUTION_ENGINE_API_URL}/submissions/batch?base64_encoded=true`, payload);

            const submissionResponseTokens = response.data; // [ {token: "...."}, {token: "...."}, .... ] we will get as response the respective submission token for identifying it later on to request the final status of the submission  

            const updatedTestCases = test_cases.map((testCase, index) => {
                return {
                    ...testCase,
                    ...submissionResponseTokens[index],
                };
            });

            // Update the Test Cases in the System only data so that these corresponding tokens can be used to request the final status of the submission
            data._system.data = { ...data._system.data, test_cases: updatedTestCases };

            // Update the Time to Update the Event's Data 
            data._system.metadata.success = true;
            data._system.metadata.updatedAt = (new Date()).toISOString();
            data._system.metadata.message = "Submissions for the Test Cases are Made Successfully to the Code Execution Engine....";
            data._system.metadata.pollAttempts = 0;


            // Send Event "judges.execution.contest.getUpdates" topic to Get Updates of the Submissions made for the Each Test Case
            const topic = "judges.execution.contest.getUpdates";
            const partition = await getPartition();
            await sendEvent(topic, partition, data, metadata);
            return;
        }

    }
    catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in JUDGE SERVICE while Creating Submission Request for the Contest's Problem's Test Cases to the Code Execution Engine....");

        data._system.metadata.source = CURR_SERVICE_NAME;
        data._system.metadata.success = false;
        data._system.metadata.updatedAt = (new Date()).toISOString();
        data._system.metadata.message = "Something went wrong while Creating Submission Request for the Contest's Problem's Test Cases to the Code Execution Engine....";

        const topic = "judges.execution.contest.corrupt";
        const partition = await getPartition();
        await sendEvent(topic, partition, data, metadata);

        return;

    }
};


const _systemGetUpdatesOfTheSubmissionOfPracticeProblem = async (data, metadata) => {

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
        //             test_cases: test_cases, // These Test Cases Will be Supplied to the Code Execution Engine to Test if the Source Code is Running it Correctly with the Constraints Provided in the Individual Test Cases & They Have Fetched From the PROBLEM SERVICE thus find Structure of these test cases from there and after the completion of the CPU execution these will be updated into the "submission.test_cases"
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


        if (data._system.metadata.source === "judge-service") {

            data._system.metadata.source = CURR_SERVICE_NAME;

            const { test_cases } = data._system.data;

            const submissionTokens = test_cases.map((testCase) => {
                return testCase.token;
            });

            const allTokenString = submissionTokens.join(',');


            // Make Request to the Code Execution Engine 
            const response = await axios.get(`${CODE_EXECUTION_ENGINE_API_URL}/submissions/batch?tokens=${allTokenString}&base64_encoded=true`);

            const allTokenStringResponseStatuses = response.data.submissions;
            /*
             [ 
                {
                    ..., 
                    language_id: "....", 
                    status: {
                        id: <Integer Like 1,2,3,4,...14>, 
                        description: <Info>
                    },  
                    std_out: <String>, Encoded in Base64
                    stderr: <String>, Encoded in Base64
                    message: <String>, Encoded in Base64
                    compile_output: <String>, Encoded in Base64
                    ....
                }, 
                {
                    ..., 
                    language_id: "....", 
                    status: {
                        id: <Integer Like 1,2,3,4,...14>, 
                        description: <Info>
                    },  
                    std_out: <String>, Encoded in Base64
                    stderr: <String>, Encoded in Base64
                    message: <String>, Encoded in Base64
                    compile_output: <String>, Encoded in Base64
                    ....
                }, 
                ....
            ] we will get as response the respective submission token for identifying it later on to request the final status of the submission  
    
            */


            // Check if Any of the Submission has got the status as the 1,2 means they are "In Queue", "Processing" thus Again Push this Event to the "judges.execution.practice.getUpdates" else Push this event to the "judges.execution.practice.complete" as a marking that they got their final status
            const isAnyTestCaseRunningIsPending = allTokenStringResponseStatuses.find((tokenResponseStatus) => isPendingStatus(tokenResponseStatus?.status?.id));

            if (isAnyTestCaseRunningIsPending) {
                const pollAttempts = Number(data?._system?.metadata?.pollAttempts || 0) + 1;
                data._system.metadata.pollAttempts = pollAttempts;

                if (pollAttempts >= JUDGE_MAX_POLL_ATTEMPTS) {
                    data._system.metadata.source = CURR_SERVICE_NAME;
                    data._system.metadata.success = false;
                    data._system.metadata.message = "Execution timed out while waiting for Judge0 final status.";
                    data._system.metadata.updatedAt = (new Date()).toISOString();
                    const timeoutTopic = "judges.execution.practice.corrupt";
                    const timeoutPartition = await getPartition();
                    await sendEvent(timeoutTopic, timeoutPartition, data, metadata);
                    return;
                }

                data._system.metadata.success = false;
                data._system.metadata.message = `Still processing test cases (attempt ${pollAttempts}/${JUDGE_MAX_POLL_ATTEMPTS})....`;
                data._system.metadata.updatedAt = (new Date()).toISOString();
                const topic = "judges.execution.practice.getUpdates";
                const partition = await getPartition();
                await sleep(JUDGE_POLL_DELAY_MS);
                await sendEvent(topic, partition, data, metadata);
                return;
            }


            const updatedTestCases = test_cases.map((testCase, index) => {
                // console.log("stdout in response: ", allTokenStringResponseStatuses[index].stdout);
                const decodedOutputIfExists = fromBase64(allTokenStringResponseStatuses[index].stdout);
                const decodedErrorIfExists = fromBase64(allTokenStringResponseStatuses[index].stderr);
                const decodedMessageIfExists = fromBase64(allTokenStringResponseStatuses[index].message);
                const decodedCompileOutputIfExists = fromBase64(allTokenStringResponseStatuses[index].compile_output);
                return {
                    ...testCase,
                    ...allTokenStringResponseStatuses[index],
                    // Decode Output From Base64 to String
                    ["stdout"]: decodedOutputIfExists,
                    ["stderr"]: decodedErrorIfExists,
                    ["message"]: decodedMessageIfExists,
                    ["compile_output"]: decodedCompileOutputIfExists,

                };
            });

            // Update the Test Cases in the System only data so that these corresponding details can be used to update the final status of the submission in the SUBMISSION SERVICE and therefore can be sent to the Client who initiated this request
            data._system.data = { ...data._system.data, test_cases: updatedTestCases };

            // Update the Time to Update the Event's Data 
            data._system.metadata.success = true;
            data._system.metadata.updatedAt = (new Date()).toISOString();
            data._system.metadata.message = "Submissions for the Test Cases are Made Successfully to the Code Execution Engine....";


            // Send Event "judges.execution.practice.complete" topic to let SUBMISSION SERVICE Update the Submission's Details
            const topic = "judges.execution.practice.complete";
            const partition = await getPartition();
            await sendEvent(topic, partition, data, metadata);
            return;
        }


    }
    catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in JUDGE SERVICE while Getting Submission Request's Details for the Practice Problem's Test Cases from the Code Execution Engine....");

        data._system.metadata.source = CURR_SERVICE_NAME;
        data._system.metadata.success = false;
        data._system.metadata.updatedAt = (new Date()).toISOString();
        data._system.metadata.message = "Something went wrong while Getting Submission Request's Details for the Practice Problem's Test Cases from the Code Execution Engine....";

        const topic = "judges.execution.practice.corrupt";
        const partition = await getPartition();
        await sendEvent(topic, partition, data, metadata);

        return;

    }

};


const _systemGetUpdatesOfTheSubmissionOfContestProblem = async (data, metadata) => {

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
        //             test_cases: test_cases, // These Test Cases Will be Supplied to the Code Execution Engine to Test if the Source Code is Running it Correctly with the Constraints Provided in the Individual Test Cases & They Have Fetched From the PROBLEM SERVICE thus find Structure of these test cases from there and after the completion of the CPU execution these will be updated into the "submission.test_cases"
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


        if (data._system.metadata.source === "judge-service") {

            data._system.metadata.source = CURR_SERVICE_NAME;


            const { test_cases } = data._system.data;

            const submissionTokens = test_cases.map((testCase) => {
                return testCase.token;
            });

            const allTokenString = submissionTokens.join(',');


            // Make Request to the Code Execution Engine 
            const response = await axios.get(`${CODE_EXECUTION_ENGINE_API_URL}/submissions/batch?tokens=${allTokenString}&base64_encoded=true`);

            const allTokenStringResponseStatuses = response.data.submissions;
            /*
             [ 
                {
                    ..., 
                    language_id: "....", 
                    status: {
                        id: <Integer Like 1,2,3,4,...14>, 
                        description: <Info>
                    },  
                    std_out: <String>, Encoded in Base64
                    stderr: <String>, Encoded in Base64
                    message: <String>, Encoded in Base64
                    compile_output: <String>, Encoded in Base64
                    ....
                }, 
                {
                    ..., 
                    language_id: "....", 
                    status: {
                        id: <Integer Like 1,2,3,4,...14>, 
                        description: <Info>
                    },  
                    std_out: <String>, Encoded in Base64
                    stderr: <String>, Encoded in Base64
                    message: <String>, Encoded in Base64
                    compile_output: <String>, Encoded in Base64
                    ....
                }, 
                ....
            ] we will get as response the respective submission token for identifying it later on to request the final status of the submission  
    
            */


            // Check if Any of the Submission has got the status as the 1,2 means they are "In Queue", "Processing" thus Again Push this Event to the "judges.execution.contest.getUpdates" else Push this event to the "judges.execution.contest.complete" as a marking that they got their final status
            const isAnyTestCaseRunningIsPending = allTokenStringResponseStatuses.find((tokenResponseStatus) => isPendingStatus(tokenResponseStatus?.status?.id));

            if (isAnyTestCaseRunningIsPending) {
                const pollAttempts = Number(data?._system?.metadata?.pollAttempts || 0) + 1;
                data._system.metadata.pollAttempts = pollAttempts;

                if (pollAttempts >= JUDGE_MAX_POLL_ATTEMPTS) {
                    data._system.metadata.source = CURR_SERVICE_NAME;
                    data._system.metadata.success = false;
                    data._system.metadata.message = "Execution timed out while waiting for Judge0 final status.";
                    data._system.metadata.updatedAt = (new Date()).toISOString();
                    const timeoutTopic = "judges.execution.contest.corrupt";
                    const timeoutPartition = await getPartition();
                    await sendEvent(timeoutTopic, timeoutPartition, data, metadata);
                    return;
                }

                data._system.metadata.success = false;
                data._system.metadata.message = `Still processing test cases (attempt ${pollAttempts}/${JUDGE_MAX_POLL_ATTEMPTS})....`;
                data._system.metadata.updatedAt = (new Date()).toISOString();
                const topic = "judges.execution.contest.getUpdates";
                const partition = await getPartition();
                await sleep(JUDGE_POLL_DELAY_MS);
                await sendEvent(topic, partition, data, metadata);
                return;
            }


            const updatedTestCases = test_cases.map((testCase, index) => {
                // console.log("stdout in response: ", allTokenStringResponseStatuses[index].stdout);
                const decodedOutputIfExists = fromBase64(allTokenStringResponseStatuses[index].stdout);
                const decodedErrorIfExists = fromBase64(allTokenStringResponseStatuses[index].stderr);
                const decodedMessageIfExists = fromBase64(allTokenStringResponseStatuses[index].message);
                const decodedCompileOutputIfExists = fromBase64(allTokenStringResponseStatuses[index].compile_output);
                return {
                    ...testCase,
                    ...allTokenStringResponseStatuses[index],
                    // Decode Output From Base64 to String
                    ["stdout"]: decodedOutputIfExists,
                    ["stderr"]: decodedErrorIfExists,
                    ["message"]: decodedMessageIfExists,
                    ["compile_output"]: decodedCompileOutputIfExists,

                };
            });

            // Update the Test Cases in the System only data so that these corresponding details can be used to update the final status of the submission in the SUBMISSION SERVICE and therefore can be sent to the Client who initiated this request
            data._system.data = { ...data._system.data, test_cases: updatedTestCases };

            // Update the Time to Update the Event's Data 
            data._system.metadata.success = true;
            data._system.metadata.updatedAt = (new Date()).toISOString();
            data._system.metadata.message = "Submissions for the Test Cases are Made Successfully to the Code Execution Engine....";


            // Send Event "judges.execution.contest.complete" topic to let SUBMISSION SERVICE Update the Submission's Details
            const topic = "judges.execution.contest.complete";
            const partition = await getPartition();
            await sendEvent(topic, partition, data, metadata);
            return;
        }

    }
    catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in JUDGE SERVICE while Getting Submission Request's Details for the Contest's Problem's Test Cases from the Code Execution Engine....");

        data._system.metadata.source = CURR_SERVICE_NAME;
        data._system.metadata.success = false;
        data._system.metadata.updatedAt = (new Date()).toISOString();
        data._system.metadata.message = "Something went wrong while Getting Submission Request's Details for the Contest's Problem's Test Cases from the Code Execution Engine....";

        const topic = "judges.execution.contest.corrupt";
        const partition = await getPartition();
        await sendEvent(topic, partition, data, metadata);

        return;

    }

};


const _systemDeletePracticeProblemSubmissionsFromTheExecutionEngine = async (data, metadata) => {


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
        //             test_cases: test_cases, // These Test Cases Will be Supplied to the Code Execution Engine to Test if the Source Code is Running it Correctly with the Constraints Provided in the Individual Test Cases & They Have Fetched From the PROBLEM SERVICE thus find Structure of these test cases from there and after the completion of the CPU execution these will be updated into the "submission.test_cases"
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


        if (data._system.metadata.source === "judge-service") {


            const { test_cases } = data._system.data;

            const submissionTokens = test_cases.map((testCase) => {
                return testCase.token;
            });



            // Make Request to the Code Execution Engine 
            for (let index = 0; index < submissionTokens.length; index++) {
                const token = submissionTokens[index];
                const response = await axios.delete(`${CODE_EXECUTION_ENGINE_API_URL}/submissions/${token}`);

                // After Deletion of The Submission Details from the Code Execution Engine if Any Operations are required then can be added from here
            }
            return;
        }


    }
    catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in JUDGE SERVICE while Deleting Submission Request's Details for the Practice Problem's Test Cases from the Code Execution Engine....");

        return;

    }

};


const _systemDeleteContestProblemSubmissionsFromTheExecutionEngine = async (data, metadata) => {


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
        //             test_cases: test_cases, // These Test Cases Will be Supplied to the Code Execution Engine to Test if the Source Code is Running it Correctly with the Constraints Provided in the Individual Test Cases & They Have Fetched From the PROBLEM SERVICE thus find Structure of these test cases from there and after the completion of the CPU execution these will be updated into the "submission.test_cases"
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




        if (data._system.metadata.source === "judge-service") {


            const { test_cases } = data._system.data;

            const submissionTokens = test_cases.map((testCase) => {
                return testCase.token;
            });



            // Make Request to the Code Execution Engine 
            for (let index = 0; index < submissionTokens.length; index++) {
                const token = submissionTokens[index];
                const response = await axios.delete(`${CODE_EXECUTION_ENGINE_API_URL}/submissions/${token}`);

                // After Deletion of The Submission Details from the Code Execution Engine if Any Operations are required then can be added from here
            }
            return;
        }


    }
    catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in JUDGE SERVICE while Deleting Submission Request's Details for the Contest's Problem's Test Cases from the Code Execution Engine....");

        return;

    }

};








export {
    _systemExecuteSubmissionOfPracticeProblem,
    _systemExecuteSubmissionOfContestProblem,
    _systemGetUpdatesOfTheSubmissionOfPracticeProblem,
    _systemGetUpdatesOfTheSubmissionOfContestProblem,
    _systemDeletePracticeProblemSubmissionsFromTheExecutionEngine,
    _systemDeleteContestProblemSubmissionsFromTheExecutionEngine,
};
