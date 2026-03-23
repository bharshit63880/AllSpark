import "dotenv/config";
import { kafka } from "../utils/kafkaClient.js";
import { isProducerReady } from "../utils/kafkaProducer.js";
import { publishToRedisPubSub } from "../utils/redisPublisher.js";
import {
  createSupportTicket,
  createCareerIntakeTicket,
  getMySupportTickets,
  getResolvedSupportFaqs,
  getSpecificSupportTicket,
} from "./handlers/normal.js";
import {
  searchSupportTicketsForAdmin,
  updateSupportTicketForAdmin,
} from "./handlers/control.js";

const CURR_SERVICE_NAME = "support-ticket-service";

const handleUnknownEvent = async (data, metadata) => {
  await publishToRedisPubSub("unknown", JSON.stringify({ data, metadata }));
};

const consumeEvents = async () => {
  try {
    if (!isProducerReady()) {
      throw new Error("Producer is not ready. Ensure producer is connected before starting consumer.");
    }

    const listOfTopicsToConsume = [
      "supportTickets.create",
      "supportTickets.careers.create",
      "supportTickets.getMyTickets",
      "supportTickets.getResolvedFaqs",
      "supportTickets.getTicket",
      "supportTickets.control.search",
      "supportTickets.control.update",
    ];

    const handlingFunctions = {
      "supportTickets.create": createSupportTicket,
      "supportTickets.careers.create": createCareerIntakeTicket,
      "supportTickets.getMyTickets": getMySupportTickets,
      "supportTickets.getResolvedFaqs": getResolvedSupportFaqs,
      "supportTickets.getTicket": getSpecificSupportTicket,
      "supportTickets.control.search": searchSupportTicketsForAdmin,
      "supportTickets.control.update": updateSupportTicketForAdmin,
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
    console.error("support-ticket consumeEvents error:", error);
    throw error;
  }
};

export default consumeEvents;
