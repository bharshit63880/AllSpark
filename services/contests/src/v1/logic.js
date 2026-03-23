import "dotenv/config";
import { kafka } from "../../config/v1/kafka.js";
import { publishToRedisPubSub } from "../../src/utils/redisPublisher.js";
import { controlCreateContest, controlDeleteContest, controlGetSpecificContestDetails, controlSearchContests, controlUpdateContest } from "./handlers/control.js";
import { getAllContests, getSpecificContestDetails, registerForContest, searchContests, startContest } from "./handlers/normal.js";
import { _systemSubmissionUpdatedThusUpdateParticipantDetails } from "./handlers/_system.js";



const DEFAULT_PARTITIONS_OF_KAFKA_TOPICS = process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS || 4;
const CURR_SERVICE_NAME = "contest-service";


// PLEASE NOTE: CACHING is YET TO BE IMPLEMENTED


const handleUnknownEvent = async (data, metadata) => {
    await publishToRedisPubSub("unknown", JSON.stringify({ data: data, metadata: metadata }));
};




const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(1, ms)));

const isStartupRetriableKafkaError = (error) => {
    if (!error) return false;
    const code = error.code || error.type || error.name || "";
    const message = (error.message || "").toLowerCase();

    const retriableCodeSet = new Set([
        "LEADER_NOT_AVAILABLE",
        "COORDINATOR_NOT_AVAILABLE",
        "NOT_LEADER_FOR_PARTITION",
        "GROUP_COORDINATOR_NOT_AVAILABLE",
        "UNKNOWN_TOPIC_OR_PARTITION",
        "BROKER_NOT_AVAILABLE",
        "NOT_COORDINATOR",
        "REQUEST_TIMED_OUT",
        "NETWORK_EXCEPTION",
        "UNKNOWN",
    ]);

    if (retriableCodeSet.has(code)) return true;

    if (message.includes("no leader for this topic-partition") ||
        message.includes("leader election") ||
        message.includes("coordinator") ||
        message.includes("metadata") ||
        message.includes("timeout") ||
        message.includes("retries exceeded") ||
        message.includes("kafkajsnumberofretriesexceeded")) {
        return true;
    }

    return false;
};

const consumeEvents = async () => {
    const listOfTopicsToConsume = [
        "contests.search",
        "contests.getAllContests",
        "contests.getContest",
        "contests.register",
        "contests.startContest",
        "contests.control.search",
        "contests.control.getContest",
        "contests.control.create",
        "contests.control.update",
        "contests.control.delete",
        "submissions.contest.update.complete",
        "admin.createContest",
        "admin.updateContest",
        "admin.deleteContest",
    ];

    const handlingFunctions = {
        "contests.search": searchContests,
        "contests.getAllContests": getAllContests,
        "contests.getContest": getSpecificContestDetails,
        "contests.register": registerForContest,
        "contests.startContest": startContest,
        "contests.control.search": controlSearchContests,
        "contests.control.getContest": controlGetSpecificContestDetails,
        "contests.control.create": controlCreateContest,
        "contests.control.update": controlUpdateContest,
        "contests.control.delete": controlDeleteContest,
        "submissions.contest.update.complete": _systemSubmissionUpdatedThusUpdateParticipantDetails,
        "admin.createContest": controlCreateContest,
        "admin.updateContest": controlUpdateContest,
        "admin.deleteContest": controlDeleteContest,
    };

    const startupBaseDelayMs = Math.max(1, Number(process.env.CONSUMER_STARTUP_BASE_DELAY_MS) || 1000);
    const startupMaxDelayMs = Math.max(1, Number(process.env.CONSUMER_STARTUP_MAX_DELAY_MS) || 30000);
    const groupJoinTimeoutMs = Math.max(1, Number(process.env.CONSUMER_GROUP_JOIN_TIMEOUT_MS) || 30000);

    let attempt = 0;
    let currentDelayMs = startupBaseDelayMs;

    while (true) {
        attempt += 1;
        const consumer = kafka.consumer({ groupId: CURR_SERVICE_NAME });
        let groupJoinResolver;
        let groupJoinRejecter;

        console.log(`[Consumer] Starting attempt ${attempt}...`);

        try {
            await consumer.connect();
            await consumer.subscribe({ topics: listOfTopicsToConsume });

            const groupJoinPromise = new Promise((resolve, reject) => {
                groupJoinResolver = resolve;
                groupJoinRejecter = reject;
                const joinTimeout = setTimeout(() => {
                    reject(new Error("Consumer group join timeout"));
                }, groupJoinTimeoutMs);

                consumer.on(consumer.events.GROUP_JOIN, () => {
                    clearTimeout(joinTimeout);
                    console.log("[ConsumerGroup] Consumer has joined the group");
                    resolve();
                });
            });

            await consumer.run({
                eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
                    console.log(
                        `${CURR_SERVICE_NAME}: [${topic}]: PART:${partition}:`,
                        message.value.toString()
                    );

                    const info = JSON.parse(message.value);
                    const { data, metadata } = info;

                    if (handlingFunctions[topic]) {
                        await handlingFunctions[topic](data, metadata);
                    } else {
                        await handleUnknownEvent(data, metadata);
                    }
                },
            });

            await groupJoinPromise;
            console.log("[Consumer] Startup complete and running.");
            return;
        } catch (error) {
            const retryable = isStartupRetriableKafkaError(error);
            console.log(`[Consumer] startup attempt ${attempt} failed: ${error?.message || error}.`);
            console.log(`         Retriable: ${retryable}.`);

            try {
                await consumer.disconnect();
            } catch (disconnectError) {
                console.log("[Consumer] ignored disconnect error:", disconnectError?.message || disconnectError);
            }

            if (!retryable) {
                console.log("[Consumer] Non-retriable startup failure, but keeping service alive and retrying after backoff.");
            }

            console.log(`[Consumer] retrying consumer startup after ${currentDelayMs}ms`);
            await sleep(currentDelayMs);
            currentDelayMs = Math.min(startupMaxDelayMs, currentDelayMs * 2);
        }
    }
};

export default consumeEvents;
