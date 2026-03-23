import "dotenv/config";
import { kafka } from "../../config/v1/kafka.js";

/* 

This file is responsible for creating the Kafka Topics for more information read Kafkajs (Library We are using to connect, configure and play with Kafka) docs

. We have created topics in one go when connected to the Kafka Instance first time for now it is handled manually to configure topics in the Kafka 
. We are using by default 4 partitions as of now if the requirements goes up than it then we can always configure the partitions' count in specific topic and to know about how to do that head over to the Kafkajs docs

*/


const defaultNumberOfPartitions = process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS || 4;

const hasSubArrayElements = (masterArray, subArray) => {
    // console.log("Checking the Master and Sub Array: ", masterArray, " 007 ", subArray);
    
    for(let index = 0; index < subArray.length; index++) {
        if (masterArray.includes(subArray[index]) === false) {
            // console.log("Returning false as ",  subArray[index], " not in ", masterArray);
            
            return false;
        }
    }
    // console.log("Returning true");
    return true;
};

const initializeTopics = async (maxRetries = 5) => {
    try {

        // List of Topics Should be present in the Kafka Queue to make sure the API Works Correctly
        const listOfTopicsNeeded = [
            "request",
            "leaderboard.get",
        ];

        const admin = kafka.admin();
        
        // Retry logic for admin connection
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                console.log(`[Kafka Admin] Connection attempt ${attempt + 1}/${maxRetries}...`);
                await admin.connect();
                console.log("[Kafka Admin] Connected Successfully ✓");
                break;
            } catch (error) {
                if (attempt < maxRetries - 1) {
                    const delayMs = Math.min(3000 * Math.pow(2, attempt), 30000);
                    console.warn(
                        `[Kafka Admin] Connection failed (attempt ${attempt + 1}/${maxRetries}). ` +
                        `Retrying in ${delayMs / 1000}s...`
                    );
                    await new Promise((resolve) => setTimeout(resolve, delayMs));
                } else {
                    throw error;
                }
            }
        }

        // If Topics are not there then do create them
        const allTopics = await admin.listTopics();
        // console.log("All Kafka Topics: ", allTopics.toString(), " 007 ", allTopics);
        
        const topicsExistsAlready = await hasSubArrayElements(allTopics, listOfTopicsNeeded);

        if (topicsExistsAlready === false) {

            console.log("[Kafka Admin] Creating Topics ", listOfTopicsNeeded);
            await admin.createTopics({
                topics: listOfTopicsNeeded.map((topic) => ({
                    topic,
                    numPartitions: defaultNumberOfPartitions,
                })),
            });
            console.log("[Kafka Admin] Topics Created Successfully ✓", listOfTopicsNeeded);
        } else {
            console.log("[Kafka Admin] Required topics already exist ✓");
        }

        console.log("[Kafka Admin] Disconnecting...");
        await admin.disconnect();
        console.log("[Kafka Admin] Disconnected ✓");

    } catch (error) {
        console.error("[Kafka Admin] Error:", error.message);
        console.warn("[Kafka Admin] WARNING: Failed to initialize topics after all retries");
        console.warn("[Kafka Admin] The application will continue running. Topics may need to be created manually.");

    }
};

export { initializeTopics };
