import Submission from "../../../models/v1/submissions.js";
import getPartition from "../../utils/getPartition.js";
import { sendEvent } from "../../utils/kafkaProducer.js";
import { deleteFromCache, getFromCache, setInCache } from "../../utils/redisCacheManager.js";
import { publishToRedisPubSub } from "../../utils/v1/redisPublisher.js";
import sanitizeResponse from "../../utils/sanitizeResponse.js";


const CURR_SERVICE_NAME = "submission-service";




const _systemUpdateSubmissionDetailsOfPracticeProblemSubmission = async (data, metadata) => {

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
        //             source: "judge-service",
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



        // These are the Updated Test Cases which are needed to Update in the Submission Object and thus it is required to Publish the relevant Update to the "response" Channel so that it can be sent to the Client after sanitizing the Response Obviously
        if (data._system.metadata.source === "judge-service") {

            data._system.metadata.source = CURR_SERVICE_NAME;

            const {
                _id,
                contest_id,
                problem_id,
                is_cpu_executed,
                is_for_public_test_cases,
                test_cases,
                created_by,
                source_code,
                language_id,
            } = data._system.data;


            const updateDataOfSubmission = {
                _id: _id,
                contest_id: contest_id,
                problem_id: problem_id,
                is_cpu_executed: true,
                is_for_public_test_cases: is_for_public_test_cases,
                test_cases: test_cases,
                created_by: created_by,
                source_code: source_code,
                language_id: language_id,
            };

            // Send Response to the Client and Update to Cache
            setInCache(`submissions:v1:_id:${_id}`, updateDataOfSubmission, 7200); // In Seconds thus it becomes 7200/60 = 120 Minutes = 2 Hours

            data = { ...data, result: updateDataOfSubmission };

            // Drop The System Only Data From the Data Before Sending it to "response" channel

            // If Your'e Wondering why we did that JSON.parse() JSON.stringify() why not just simple const updatedDataToSendToResponseChannel = await sanitizeResponse(data); then that is done due the fact the JavaScript Does the Shallow Copy in that way but we need the data._system later that's why we did a deep copy via this however more standard way can be to use something custom classes or third party packages but this is just fast and easy for now later can be changed
            const updatedDataToSendToResponseChannel = await sanitizeResponse(JSON.parse(JSON.stringify(data)));

            // Update the "metadata" Before Sending it to "response" channel
            metadata.source = CURR_SERVICE_NAME;
            metadata.success = true;
            metadata.message = "Submission Executed on CPU successfully....";
            metadata.updatedAt = (new Date()).toISOString();
            await publishToRedisPubSub("response", JSON.stringify({ data: updatedDataToSendToResponseChannel, metadata: metadata }));



            const filter = {
                _id: _id,
                is_cpu_executed: false,
            };


            const submission = await Submission.findOneAndUpdate(filter, updateDataOfSubmission);
            if (!submission) {
                console.log("Sorry! This Submission with _id: ", _id, " doesn't Exists....");

                data._system.metadata.success = false;
                data._system.metadata.message = `Sorry! This Submission with _id: ${_id} doesn't Exists....`;
                data._system.metadata.updatedAt = (new Date()).toISOString();

                const topic = "submissions.practice.update.corrupt";
                const partition = await getPartition();
                await sendEvent(topic, partition, data, metadata);
                return;
            }

            data._system.metadata.success = true;
            data._system.metadata.message = `This Submission with _id: ${_id} updated Successfully....`;
            data._system.metadata.updatedAt = (new Date()).toISOString();

            const topic = "submissions.practice.update.complete";
            const partition = await getPartition();
            await sendEvent(topic, partition, data, metadata);
            return;
        }

    }
    catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in SUBMISSION SERVICE while Updating the Practice Problem's Submission's Details....");
        data._system.metadata.source = CURR_SERVICE_NAME;
        data._system.metadata.success = false;
        data._system.metadata.message = "Something went Wrong while Updating the Submission's Details....";
        data._system.metadata.updatedAt = (new Date()).toISOString();
        const topic = "submissions.practice.update.corrupt";
        const partition = await getPartition();
        await sendEvent(topic, partition, data, metadata);
        return;

    }

};


const _systemUpdateSubmissionDetailsOfContestProblemSubmission = async (data, metadata) => {

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
        //             source: "judge-service",
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



        // These are the Updated Test Cases which are needed to Update in the Submission Object and thus it is required to Publish the relevant Update to the "response" Channel so that it can be sent to the Client after sanitizing the Response Obviously
        if (data._system.metadata.source === "judge-service") {

            data._system.metadata.source = CURR_SERVICE_NAME;

            const {
                _id,
                problem_id,
                is_cpu_executed,
                is_for_public_test_cases,
                test_cases,
                created_by,
                source_code,
                language_id,
            } = data._system.data;


            const updateDataOfSubmission = {
                _id: _id,
                problem_id: problem_id,
                is_cpu_executed: true,
                is_for_public_test_cases: is_for_public_test_cases,
                test_cases: test_cases,
                created_by: created_by,
                source_code: source_code,
                language_id: language_id,
            };

            // Send Response to the Client and Update to Cache
            setInCache(`submissions:v1:_id:${_id}`, updateDataOfSubmission, 7200); // In Seconds thus it becomes 7200/60 = 120 Minutes = 2 Hours

            data = { ...data, result: updateDataOfSubmission };

            // Drop The System Only Data From the Data Before Sending it to "response" channel
            
            // If Your'e Wondering why we did that JSON.parse() JSON.stringify() why not just simple const updatedDataToSendToResponseChannel = await sanitizeResponse(data); then that is done due the fact the JavaScript Does the Shallow Copy in that way but we need the data._system later that's why we did a deep copy via this however more standard way can be to use something custom classes or third party packages but this is just fast and easy for now later can be changed
            const updatedDataToSendToResponseChannel = await sanitizeResponse(JSON.parse(JSON.stringify(data)));

            // Update the "metadata" Before Sending it to "response" channel
            metadata.source = CURR_SERVICE_NAME;
            metadata.success = true;
            metadata.message = "Submission Executed on CPU successfully....";
            metadata.updatedAt = (new Date()).toISOString();
            await publishToRedisPubSub("response", JSON.stringify({ data: updatedDataToSendToResponseChannel, metadata: metadata }));



            const filter = {
                _id: _id,
                is_cpu_executed: false,
            };


            const submission = await Submission.findOneAndUpdate(filter, updateDataOfSubmission);
            if (!submission) {
                console.log("Sorry! This Submission with _id: ", _id, " doesn't Exists....");

                data._system.metadata.success = false;
                data._system.metadata.message = `Sorry! This Submission with _id: ${_id} doesn't Exists....`;
                data._system.metadata.updatedAt = (new Date()).toISOString();

                const topic = "submissions.contest.update.corrupt";
                const partition = await getPartition();
                await sendEvent(topic, partition, data, metadata);
                return;
            }

            data._system.metadata.success = true;
            data._system.metadata.message = `This Submission with _id: ${_id} updated Successfully....`;
            data._system.metadata.updatedAt = (new Date()).toISOString();

            // Include contest_id for leaderboard service (submission events)
            data.contest_id = submission.contest_id;
            data.createdAt = submission.createdAt;
            data._system.data.contest_id = submission.contest_id;

            const topic = "submissions.contest.update.complete";
            const partition = await getPartition();
            await sendEvent(topic, partition, data, metadata);
            return;
        }

    }
    catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in SUBMISSION SERVICE while Updating the Contest's Problem's Submission's Details....");
        data._system.metadata.source = CURR_SERVICE_NAME;
        data._system.metadata.success = false;
        data._system.metadata.message = "Something went Wrong while Updating the Submission's Details....";
        data._system.metadata.updatedAt = (new Date()).toISOString();
        const topic = "submissions.contest.update.corrupt";
        const partition = await getPartition();
        await sendEvent(topic, partition, data, metadata);
        return;

    }

};


const _systemSendResponseToClientThatSomethingWrongWhileGettingPracticeProblemTestCases = async (data, metadata) => {

    try {


        // const data = {
        //     ...(Some Data Recieved From The Client Side or Initial Request to the API),
        //     result: <result>, // Some Data Required To Send to Client Side or to source who does the Initial Request to the API
        //     _system: {
        //         data: {
        //         // Some Data About the Event that required to get Further information now happened to be Corrupt while Getting Problem and Its Test Cases
        //          _id: submission._id, // Required to delete the Submission as the Relevant problem for this Cannot be found and since this is not critical data thus delete it to avoid un-neccessary storage of the Submissions that are invalid
        //         },
        //         metadata: {
        //             source: "problem-service",
        //             success: <true or false>,
        //             message: <Some Information that what happened while getting further information of the problem and its test cases>,
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



        // Send Response to the Client that There is something wrong while Getting the Problem and its Test Cases Details thus try again to make the Submission with correct details or contact to the Support
        if (data._system.metadata.source === "problem-service") {

            data._system.metadata.source = CURR_SERVICE_NAME;

            const {
                success,
                message
            } = data._system.metadata;

            const {
                _id,
            } = data._system.data;
            

            // Send Response to the Client and Delete from Cache
            deleteFromCache(`submissions:v1:_id:${_id}`);

            
            // Drop The System Only Data From the Data Before Sending it to "response" channel
            
            // If Your'e Wondering why we did that JSON.parse() JSON.stringify() why not just simple const updatedDataToSendToResponseChannel = await sanitizeResponse(data); then that is done due the fact the JavaScript Does the Shallow Copy in that way but we need the data._system later that's why we did a deep copy via this however more standard way can be to use something custom classes or third party packages but this is just fast and easy for now later can be changed
            const updatedDataToSendToResponseChannel = await sanitizeResponse(JSON.parse(JSON.stringify(data)));

            // Update the Source of the Event as CURR_SERVICE_NAME because from here we will be sending the response to the Client or "response" channel to be precisely correct 
            metadata.source = CURR_SERVICE_NAME;
            metadata.success = success;
            metadata.message = message;
            metadata.updatedAt = (new Date()).toISOString();
            
            await publishToRedisPubSub("response", JSON.stringify({ data: updatedDataToSendToResponseChannel, metadata: metadata }));



            const filter = {
                _id: _id,
                is_cpu_executed: false,
            };


            const submission = await Submission.findOneAndDelete(filter);
            if (!submission) {
                console.log("Sorry! This Submission with _id: ", _id, " doesn't Exists....");

                data._system.metadata.success = false;
                data._system.metadata.message = `Sorry! This Submission with _id: ${_id} doesn't Exists....`;
                data._system.metadata.updatedAt = (new Date()).toISOString();

                const topic = "submissions.practice.delete.corrupt";
                const partition = await getPartition();
                await sendEvent(topic, partition, data, metadata);
                return;
            }

            data._system.metadata.success = true;
            data._system.metadata.message = `This Submission with _id: ${_id} updated Successfully....`;
            data._system.metadata.updatedAt = (new Date()).toISOString();

            const topic = "submissions.practice.delete.complete";
            const partition = await getPartition();
            await sendEvent(topic, partition, data, metadata);
            return;
        }

    }
    catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in SUBMISSION SERVICE while Deleting the Practice's Problem's Submission's Details....");
        data._system.metadata.source = CURR_SERVICE_NAME;
        data._system.metadata.success = false;
        data._system.metadata.message = "Something went Wrong while Deleting the Submission's Details....";
        data._system.metadata.updatedAt = (new Date()).toISOString();
        const topic = "submissions.practice.delete.corrupt";
        const partition = await getPartition();
        await sendEvent(topic, partition, data, metadata);
        return;

    }

};


const _systemSendResponseToClientThatSomethingWrongWhileGettingContestProblemTestCases = async (data, metadata) => {

        try {


        // const data = {
        //     ...(Some Data Recieved From The Client Side or Initial Request to the API),
        //     result: <result>, // Some Data Required To Send to Client Side or to source who does the Initial Request to the API
        //     _system: {
        //         data: {
        //         // Some Data About the Event that required to get Further information now happened to be Corrupt while Getting Problem and Its Test Cases
        //          _id: submission._id, // Required to delete the Submission as the Relevant problem for this Cannot be found and since this is not critical data thus delete it to avoid un-neccessary storage of the Submissions that are invalid
        //         },
        //         metadata: {
        //             source: "problem-service",
        //             success: <true or false>,
        //             message: <Some Information that what happened while getting further information of the problem and its test cases>,
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



        // Send Response to the Client that There is something wrong while Getting the Problem and its Test Cases Details thus try again to make the Submission with correct details or contact to the Support
        if (data._system.metadata.source === "problem-service") {

            data._system.metadata.source = CURR_SERVICE_NAME;

            const {
                success,
                message
            } = data._system.metadata;

            const {
                _id,
            } = data._system.data;
            

            // Send Response to the Client and Delete from Cache
            deleteFromCache(`submissions:v1:_id:${_id}`);

            
            // Drop The System Only Data From the Data Before Sending it to "response" channel
            
            // If Your'e Wondering why we did that JSON.parse() JSON.stringify() why not just simple const updatedDataToSendToResponseChannel = await sanitizeResponse(data); then that is done due the fact the JavaScript Does the Shallow Copy in that way but we need the data._system later that's why we did a deep copy via this however more standard way can be to use something custom classes or third party packages but this is just fast and easy for now later can be changed
            const updatedDataToSendToResponseChannel = await sanitizeResponse(JSON.parse(JSON.stringify(data)));

            // Update the Source of the Event as CURR_SERVICE_NAME because from here we will be sending the response to the Client or "response" channel to be precisely correct 
            metadata.source = CURR_SERVICE_NAME;
            metadata.success = success;
            metadata.message = message;
            metadata.updatedAt = (new Date()).toISOString();
            
            await publishToRedisPubSub("response", JSON.stringify({ data: updatedDataToSendToResponseChannel, metadata: metadata }));



            const filter = {
                _id: _id,
                is_cpu_executed: false,
            };


            const submission = await Submission.findOneAndDelete(filter);
            if (!submission) {
                console.log("Sorry! This Submission with _id: ", _id, " doesn't Exists....");

                data._system.metadata.success = false;
                data._system.metadata.message = `Sorry! This Submission with _id: ${_id} doesn't Exists....`;
                data._system.metadata.updatedAt = (new Date()).toISOString();

                const topic = "submissions.contest.delete.corrupt";
                const partition = await getPartition();
                await sendEvent(topic, partition, data, metadata);
                return;
            }

            data._system.metadata.success = true;
            data._system.metadata.message = `This Submission with _id: ${_id} updated Successfully....`;
            data._system.metadata.updatedAt = (new Date()).toISOString();

            const topic = "submissions.contest.delete.complete";
            const partition = await getPartition();
            await sendEvent(topic, partition, data, metadata);
            return;
        }

    }
    catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in SUBMISSION SERVICE while Deleting the Contest's Problem's Submission's Details....");
        data._system.metadata.source = CURR_SERVICE_NAME;
        data._system.metadata.success = false;
        data._system.metadata.message = "Something went Wrong while Deleting the Submission's Details....";
        data._system.metadata.updatedAt = (new Date()).toISOString();
        const topic = "submissions.contest.delete.corrupt";
        const partition = await getPartition();
        await sendEvent(topic, partition, data, metadata);
        return;

    }

};


const _systemSendResponseToClientThatPracticeProblemSubmissionCannotBeExecuted = async (data, metadata) => {

        try {


        // const data = {
        //     ...(Some Data Recieved From The Client Side or Initial Request to the API),
        //     result: <result>, // Some Data Required To Send to Client Side or to source who does the Initial Request to the API
        //     _system: {
        //         data: {
        //         // Some Data About the Event that required to get Further information now happened to be Corrupt while Getting Problem and Its Test Cases
        //          _id: submission._id, // Required to delete the Submission as the Relevant problem for this Cannot be found and since this is not critical data thus delete it to avoid un-neccessary storage of the Submissions that are invalid
        //         },
        //         metadata: {
        //             source: "judge-service",
        //             success: <true or false>,
        //             message: <Some Information that what happened while getting further information of the problem and its test cases>,
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



        // Send Response to the Client that There is something wrong while Getting the Problem and its Test Cases Details thus try again to make the Submission with correct details or contact to the Support
        if (data._system.metadata.source === "judge-service") {

            data._system.metadata.source = CURR_SERVICE_NAME;

            const {
                _id,
            } = data._system.data;
            

            // Send Response to the Client and Delete from Cache
            deleteFromCache(`submissions:v1:_id:${_id}`);

            
            // Drop The System Only Data From the Data Before Sending it to "response" channel
            
            // If Your'e Wondering why we did that JSON.parse() JSON.stringify() why not just simple const updatedDataToSendToResponseChannel = await sanitizeResponse(data); then that is done due the fact the JavaScript Does the Shallow Copy in that way but we need the data._system later that's why we did a deep copy via this however more standard way can be to use something custom classes or third party packages but this is just fast and easy for now later can be changed
            const updatedDataToSendToResponseChannel = await sanitizeResponse(JSON.parse(JSON.stringify(data)));

            // Update the Source of the Event as CURR_SERVICE_NAME because from here we will be sending the response to the Client or "response" channel to be precisely correct 
            metadata.source = CURR_SERVICE_NAME;
            metadata.success = false;
            metadata.message = "Sorry! Your Submission Cannot Be Executed....";
            metadata.updatedAt = (new Date()).toISOString();
            
            await publishToRedisPubSub("response", JSON.stringify({ data: updatedDataToSendToResponseChannel, metadata: metadata }));



            const filter = {
                _id: _id,
                is_cpu_executed: false,
            };


            const submission = await Submission.findOneAndDelete(filter);
            if (!submission) {
                console.log("Sorry! This Submission with _id: ", _id, " doesn't Exists....");

                data._system.metadata.success = false;
                data._system.metadata.message = `Sorry! This Submission with _id: ${_id} doesn't Exists....`;
                data._system.metadata.updatedAt = (new Date()).toISOString();

                const topic = "submissions.practice.delete.corrupt";
                const partition = await getPartition();
                await sendEvent(topic, partition, data, metadata);
                return;
            }

            data._system.metadata.success = true;
            data._system.metadata.message = `This Submission with _id: ${_id} updated Successfully....`;
            data._system.metadata.updatedAt = (new Date()).toISOString();

            const topic = "submissions.practice.delete.complete";
            const partition = await getPartition();
            await sendEvent(topic, partition, data, metadata);
            return;
        }

    }
    catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in SUBMISSION SERVICE while Deleting the Practice's Problem's Submission's Details....");
        data._system.metadata.source = CURR_SERVICE_NAME;
        data._system.metadata.success = false;
        data._system.metadata.message = "Something went Wrong while Deleting the Submission's Details....";
        data._system.metadata.updatedAt = (new Date()).toISOString();
        const topic = "submissions.practice.delete.corrupt";
        const partition = await getPartition();
        await sendEvent(topic, partition, data, metadata);
        return;

    }

};


const _systemSendResponseToClientThatContestProblemSubmissionCannotBeExecuted = async (data, metadata) => {


        try {


        // const data = {
        //     ...(Some Data Recieved From The Client Side or Initial Request to the API),
        //     result: <result>, // Some Data Required To Send to Client Side or to source who does the Initial Request to the API
        //     _system: {
        //         data: {
        //         // Some Data About the Event that required to get Further information now happened to be Corrupt while Getting Problem and Its Test Cases
        //          _id: submission._id, // Required to delete the Submission as the Relevant problem for this Cannot be found and since this is not critical data thus delete it to avoid un-neccessary storage of the Submissions that are invalid
        //         },
        //         metadata: {
        //             source: "judge-service",
        //             success: <true or false>,
        //             message: <Some Information that what happened while getting further information of the problem and its test cases>,
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



        // Send Response to the Client that There is something wrong while Getting the Problem and its Test Cases Details thus try again to make the Submission with correct details or contact to the Support
        if (data._system.metadata.source === "judge-service") {

            data._system.metadata.source = CURR_SERVICE_NAME;

            const {
                _id,
            } = data._system.data;
            

            // Send Response to the Client and Delete from Cache
            deleteFromCache(`submissions:v1:_id:${_id}`);

            
            // Drop The System Only Data From the Data Before Sending it to "response" channel
            
            // If Your'e Wondering why we did that JSON.parse() JSON.stringify() why not just simple const updatedDataToSendToResponseChannel = await sanitizeResponse(data); then that is done due the fact the JavaScript Does the Shallow Copy in that way but we need the data._system later that's why we did a deep copy via this however more standard way can be to use something custom classes or third party packages but this is just fast and easy for now later can be changed
            const updatedDataToSendToResponseChannel = await sanitizeResponse(JSON.parse(JSON.stringify(data)));

            // Update the Source of the Event as CURR_SERVICE_NAME because from here we will be sending the response to the Client or "response" channel to be precisely correct 
            metadata.source = CURR_SERVICE_NAME;
            metadata.success = false;
            metadata.message = "Sorry! Your Submission Cannot Be Executed....";
            metadata.updatedAt = (new Date()).toISOString();
            
            await publishToRedisPubSub("response", JSON.stringify({ data: updatedDataToSendToResponseChannel, metadata: metadata }));



            const filter = {
                _id: _id,
                is_cpu_executed: false,
            };


            const submission = await Submission.findOneAndDelete(filter);
            if (!submission) {
                console.log("Sorry! This Submission with _id: ", _id, " doesn't Exists....");

                data._system.metadata.success = false;
                data._system.metadata.message = `Sorry! This Submission with _id: ${_id} doesn't Exists....`;
                data._system.metadata.updatedAt = (new Date()).toISOString();

                const topic = "submissions.contest.delete.corrupt";
                const partition = await getPartition();
                await sendEvent(topic, partition, data, metadata);
                return;
            }

            data._system.metadata.success = true;
            data._system.metadata.message = `This Submission with _id: ${_id} updated Successfully....`;
            data._system.metadata.updatedAt = (new Date()).toISOString();

            const topic = "submissions.contest.delete.complete";
            const partition = await getPartition();
            await sendEvent(topic, partition, data, metadata);
            return;
        }

    }
    catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in SUBMISSION SERVICE while Deleting the Contest's Problem's Submission's Details....");
        data._system.metadata.source = CURR_SERVICE_NAME;
        data._system.metadata.success = false;
        data._system.metadata.message = "Something went Wrong while Deleting the Submission's Details....";
        data._system.metadata.updatedAt = (new Date()).toISOString();
        const topic = "submissions.contest.delete.corrupt";
        const partition = await getPartition();
        await sendEvent(topic, partition, data, metadata);
        return;

    }

};




export {
    _systemUpdateSubmissionDetailsOfPracticeProblemSubmission,
    _systemUpdateSubmissionDetailsOfContestProblemSubmission,
    _systemSendResponseToClientThatSomethingWrongWhileGettingPracticeProblemTestCases,
    _systemSendResponseToClientThatSomethingWrongWhileGettingContestProblemTestCases,
    _systemSendResponseToClientThatPracticeProblemSubmissionCannotBeExecuted,
    _systemSendResponseToClientThatContestProblemSubmissionCannotBeExecuted,
};
