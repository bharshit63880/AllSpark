import "dotenv/config";
import { kafka } from "../utils/kafkaClient.js";
import { isProducerReady } from "../utils/kafkaProducer.js";
import { publishToRedisPubSub } from "../utils/redisPublisher.js";
import {
  createSpecialAccessRequest,
  getMySpecialAccessRequests,
  getSpecificSpecialAccessRequest,
} from "./handlers/normal.js";
import {
  searchSpecialAccessRequestsForAdmin,
  updateSpecialAccessRequestForAdmin,
} from "./handlers/control.js";

const CURR_SERVICE_NAME = "special-access-service";

const handleUnknownEvent = async (data, metadata) => {
  await publishToRedisPubSub("unknown", JSON.stringify({ data, metadata }));
};

const consumeEvents = async () => {
  try {
    if (!isProducerReady()) {
      throw new Error("Producer is not ready. Ensure producer is connected before starting consumer.");
    }

    const listOfTopicsToConsume = [
      "specialAccess.create",
      "specialAccess.getMyRequests",
      "specialAccess.getRequest",
      "specialAccess.control.search",
      "specialAccess.control.update",
    ];

    const handlingFunctions = {
      "specialAccess.create": createSpecialAccessRequest,
      "specialAccess.getMyRequests": getMySpecialAccessRequests,
      "specialAccess.getRequest": getSpecificSpecialAccessRequest,
      "specialAccess.control.search": searchSpecialAccessRequestsForAdmin,
      "specialAccess.control.update": updateSpecialAccessRequestForAdmin,
    };

    const consumer = kafka.consumer({ groupId: CURR_SERVICE_NAME });
    await consumer.connect();
    await consumer.subscribe({ topics: listOfTopicsToConsume });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const info = JSON.parse(message.value.toString());
        const { data, metadata } = info;

        if (handlingFunctions[topic]) {
          await handlingFunctions[topic](data, metadata);
        } else {
          await handleUnknownEvent(data, metadata);
        }
      },
    });
  } catch (error) {
    console.error("special-access consumeEvents error:", error);
    throw error;
  }
};

export default consumeEvents;
