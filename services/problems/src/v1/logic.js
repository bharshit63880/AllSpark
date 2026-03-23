import "dotenv/config";
import { kafka } from "../utils/kafkaClient.js";
import { isProducerReady } from "../utils/kafkaProducer.js";
import { publishToRedisPubSub } from "../utils/redisPublisher.js";
import { getAllProblems, getSpecificProblemDetails, searchProblems } from "./handlers/normal.js";
import { controlCreateProblem, controlDeleteProblem, controlGetSpecificProblemDetails, controlSearchProblems, controlUpdateProblem } from "./handlers/control.js";
import { _systemGetProblemsOfStartedContest, _systemGetTestCasesOfContestProblem, _systemGetTestCasesOfPracticeProblem } from "./handlers/_system.js";


const DEFAULT_PARTITIONS_OF_KAFKA_TOPICS = process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS || 4;
const CURR_SERVICE_NAME = "problem-service";


// PLEASE NOTE: CACHING is YET TO BE IMPLEMENTED


const handleUnknownEvent = async (data, metadata) => {
    await publishToRedisPubSub("unknown", JSON.stringify({ data: data, metadata: metadata }));
};




const consumeEvents = async () => {
    try {
        // Verify producer is ready before starting consumer
        if (!isProducerReady()) {
            throw new Error("Producer is not ready. Ensure producer is connected before starting consumer.");
        }

        console.log("[Consumer] Producer is ready, starting consumer...");

        // List of All Topics to Consume to run this Service
        const listOfTopicsToConsume = [
            // Normal User Usage Events
            "problems.search",
            "problems.getAllProblems",
            "problems.getProblem",
            
            // Control Panel User Usage Events
            "problems.control.search",
            "problems.control.getProblem",
            "problems.control.create",
            "problems.control.update",
            "problems.control.delete",
            
            // Other Services' Event Update Events
            "contests.startContest.complete",
            "submissions.practice.create.complete",
            "submissions.contest.create.complete",

            "admin.createProblem",
            "admin.deleteProblem",
        ];



        // List of Functions that will be used for processing the events
        const handlingFunctions = {
            // Normal User Usage Events
            "problems.search": searchProblems,
            "problems.getAllProblems": getAllProblems,
            "problems.getProblem": getSpecificProblemDetails,

            // Control Panel User Usage Events
            "problems.control.search": controlSearchProblems,
            "problems.control.getProblem": controlGetSpecificProblemDetails,
            "problems.control.create": controlCreateProblem,
            "problems.control.update": controlUpdateProblem,
            "problems.control.delete": controlDeleteProblem,

            // Other Services' Event Update Events
            "contests.startContest.complete": _systemGetProblemsOfStartedContest,
            
            "submissions.practice.create.complete": _systemGetTestCasesOfPracticeProblem,
            "submissions.contest.create.complete": _systemGetTestCasesOfContestProblem,

            "admin.createProblem": controlCreateProblem,
            "admin.deleteProblem": controlDeleteProblem,
        };

        const consumer = kafka.consumer({ groupId: CURR_SERVICE_NAME });
        await consumer.connect();

        await consumer.subscribe({ topics: listOfTopicsToConsume });

        await consumer.run({
            eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
                console.log(
                    `[Consumer] ${CURR_SERVICE_NAME}: [${topic}]: PART:${partition}:`,
                    message.value.toString()
                );

                const info = JSON.parse(message.value);
                const { data, metadata } = info;

                // Process the Event
                if (handlingFunctions[topic]) {
                    try {
                        await handlingFunctions[topic](data, metadata);
                    } catch (error) {
                        console.error(`[Consumer] Error processing ${topic}:`, error.message);
                        // Don't re-throw, continue consuming other messages
                    }
                }
                else {
                    await handleUnknownEvent(data, metadata);
                }


                // // Handle Sending response back to the user


                // // Publish the Final Response to the Redis Pub/Sub and Then Redis Pub/Sub & Websocket will handle the delivery of the final result to the respective client
                // await publishToRedisPubSub("response", JSON.stringify({ data: data, metadata: metadata }));

            },
        });
    } catch (error) {
        console.error("[Consumer] Error:", error.message);
        console.error("[Consumer] Something went wrong while starting consumer....");
        throw error;
    }
};


export default consumeEvents;
