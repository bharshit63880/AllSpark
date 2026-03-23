import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { sendEvent } from "../../utils/v1/kafkaProducer.js";
import getPartition from "../../utils/v1/getPartition.js";


const CURR_SERVICE_NAME = "api";
const DEFAULT_TOPIC_TO_PUBLISH = process.env.DEFAULT_TOPIC_TO_PUBLISH || "request";



const getSubmissionByIdController = async (req, res) => {

    try {

        const {
            _id,
        } = req.params;

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();


        const data = {
            _id: _id,
        };

        const userToken = req.headers.authorization;


        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "submissions.getSubmission", // This will tell about what initial request was and processing will be done as per this 
            createdAt: createdAt, // Time when this request was created

            // To be Changed Fields

            source: CURR_SERVICE_NAME,
            updatedAt: (new Date()).toISOString(), // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);
        return res.status(202).json({
            success: true,
            message: "Get Submission Request is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Getting Submission....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Getting Submission....",
            error
        });

    }


};


const getAllSubmissionOfUserForSpecificProblemController = async (req, res) => {

    try {

        const {
            problem_id,
        } = req.params;

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();


        const data = {
            problem_id: problem_id,
        };

        const userToken = req.headers.authorization;


        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "submissions.getAllSubmissionsForProblem", // This will tell about what initial request was and processing will be done as per this 
            createdAt: createdAt, // Time when this request was created

            // To be Changed Fields

            source: CURR_SERVICE_NAME,
            updatedAt: (new Date()).toISOString(), // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);
        return res.status(202).json({
            success: true,
            message: "Get All Submissions Related to the Problem Request is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Getting All Submissions Related to the Problem....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Getting All Submissions Related to the Problem....",
            error
        });

    }


};


const createSubmissionForPracticeProblemController = async (req, res) => {

    try {


        const {
            problem_id,
            is_for_public_test_cases,
            source_code,
            language_id,
        } = req.body;

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();


        const data = {
            problem_id: problem_id,
            is_for_public_test_cases: is_for_public_test_cases,
            source_code: source_code,
            language_id: language_id,
        };


        const userToken = req.headers.authorization;



        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "submissions.practice.create", // This will tell about what initial request was and processing will be done as per this 
            createdAt: createdAt, // Time when this request was created

            // To be Changed Fields

            source: CURR_SERVICE_NAME,
            updatedAt: (new Date()).toISOString(), // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);
        return res.status(202).json({
            success: true,
            message: "Create Practice Problem's Submission Request is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Creating Practice Problem's Submission....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Create Practice Problem's Submission....",
            error
        });

    }

};


const createSubmissionForContestProblemController = async (req, res) => {

    try {

        // const data = {
        //     problem_id: <"problem_id">,
        //     is_for_public_test_cases: <true or false>,
        //     source_code: <source_code>,
        //     language_id: <language_id>,
        // };
        
        
        const {
            problem_id,
            contest_id,
            is_for_public_test_cases,
            source_code,
            language_id,
        } = req.body;

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();


        const data = {
            problem_id: problem_id,
            contest_id: contest_id,
            is_for_public_test_cases: is_for_public_test_cases,
            source_code: source_code,
            language_id: language_id,
        };


        const userToken = req.headers.authorization;



        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "submissions.contest.create", // This will tell about what initial request was and processing will be done as per this 
            createdAt: createdAt, // Time when this request was created

            // To be Changed Fields

            source: CURR_SERVICE_NAME,
            updatedAt: (new Date()).toISOString(), // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);
        return res.status(202).json({
            success: true,
            message: "Create Contest Problem's Submission Request is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Creating Contest Problem's Submission....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Create Contest Problem's Submission....",
            error
        });

    }

};








export {
    getSubmissionByIdController,
    getAllSubmissionOfUserForSpecificProblemController,
    createSubmissionForPracticeProblemController,
    createSubmissionForContestProblemController,
};
