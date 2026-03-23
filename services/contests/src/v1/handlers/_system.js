import Contest from "../../../models/v1/contests.js";
import { publishToRedisPubSub } from "../../utils/redisPublisher.js";
import { sendEvent } from "../../utils/kafkaProducer.js";
import Participant from "../../../models/v1/participants.js";
import getPartition from "../../utils/getPartition.js";


const DEFAULT_PARTITIONS_OF_KAFKA_TOPICS = process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS || 4;
const CURR_SERVICE_NAME = "contest-service";




const _systemSubmissionUpdatedThusUpdateParticipantDetails = async (data, metadata) => {


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



        // Since the Successful Submission is Made thus it requires to update the Participant's Details thus append in Submissions Array of the Participant and then Score Calculation Further Proceeds But here is it not Implemented as of Now can be added later.
        if (data._system.metadata.source === "submission-service") {

            data._system.metadata.source = CURR_SERVICE_NAME;

            const {
                _id,
                created_by,
                contest_id,
            } = data._system.data;


            const filter = {
                user_id: created_by,
                contest_id: contest_id,
            };


            const participant = await Participant.findOne(filter);

            if (!participant) {
                console.log("Sorry! This Participant with user_id: ", created_by, " doesn't Exists....");

                data._system.metadata.success = false;
                data._system.metadata.message = `Sorry! This Participant with user_id: ${created_by} doesn't Exists....`;
                data._system.metadata.updatedAt = (new Date()).toISOString();

                const topic = "contests._system.participant.update.corrupt";
                const partition = await getPartition();
                await sendEvent(topic, partition, data, metadata);
                return;
            }

            // Append the New Submission to the Participant's Submission List
            participant.submissions = [...participant.submissions, _id];
            await participant.save();


            data._system.metadata.success = true;
            data._system.metadata.message = `This Participant with user_id: ${created_by} updated Successfully....`;
            data._system.metadata.updatedAt = (new Date()).toISOString();

            const topic = "contests._system.participant.update.complete";
            const partition = await getPartition();
            await sendEvent(topic, partition, data, metadata);
            return;
        }

    }
    catch (error) {
        console.log(error);
        console.log("Something went wrong while handling in CONTEST SERVICE while Updating the Participant's Details....");
        data._system.metadata.source = CURR_SERVICE_NAME;
        data._system.metadata.success = false;
        data._system.metadata.message = "Something went Wrong while Updating the Participant's Details....";
        data._system.metadata.updatedAt = (new Date()).toISOString();
        const topic = "contests._system.participant.update.complete";
        const partition = await getPartition();
        await sendEvent(topic, partition, data, metadata);
        return;

    }

};








export {
    _systemSubmissionUpdatedThusUpdateParticipantDetails,
};
