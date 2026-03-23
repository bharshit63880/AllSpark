import "dotenv/config";
import { kafka } from "../../src/utils/kafkaClient.js";
import { sendEmail } from "../handlers/sendEmail.js";

const CURR_SERVICE_NAME = "email-service";

const sanitizeEmailPayloadForLogs = (payload) => {
  if (!payload || typeof payload !== "object") return payload;

  const safePayload = { ...payload };
  const templateData = safePayload?.data && typeof safePayload.data === "object"
    ? { ...safePayload.data }
    : undefined;

  if (templateData?.otp) {
    templateData.otp = "[REDACTED]";
  }

  if (templateData) {
    safePayload.data = templateData;
  }

  return safePayload;
};

const consumeEvents = async () => {
  try {
    // List of All Topics to Consume by Email Service
    const listOfTopicsToConsume = ["send.email"];

    // List of Functions that will be used for processing the events
    const handlingFunctions = {
      "send.email": async (data) => {
        console.log(
          `[${CURR_SERVICE_NAME}] Processing send.email event:`,
          sanitizeEmailPayloadForLogs(data)
        );
        return await sendEmail(data);
      },
    };

    const consumer = kafka.consumer({ groupId: CURR_SERVICE_NAME });
    await consumer.connect();

    console.log(
      `[${CURR_SERVICE_NAME}] Connected to Kafka. Subscribing to topics:`,
      listOfTopicsToConsume
    );

    await consumer.subscribe({ topics: listOfTopicsToConsume });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const info = JSON.parse(message.value);
          const { data, metadata } = info;
          const safeData = sanitizeEmailPayloadForLogs(data);

          console.log(
            `[${CURR_SERVICE_NAME}] [${topic}]: PART:${partition}:`,
            JSON.stringify({ data: safeData, metadata })
          );

          const handlerFunction = handlingFunctions[topic];

          if (handlerFunction) {
            const result = await handlerFunction(data);
            console.log(`[${CURR_SERVICE_NAME}] Handler result:`, result);
          } else {
            console.log(`[${CURR_SERVICE_NAME}] No handler found for topic:`, topic);
          }
        } catch (error) {
          console.error(
            `[${CURR_SERVICE_NAME}] Error processing message from ${topic}:`,
            error
          );
        }
      },
    });
  } catch (error) {
    console.log("Error:", error);
    console.log(
      `[${CURR_SERVICE_NAME}] Something went wrong while consuming events....`
    );
  }
};

export default consumeEvents;
