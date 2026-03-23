import "dotenv/config";
import { kafka } from "../../config/v1/kafka.js";


const defaultNumberOfPartitions = process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS || 4;

const kafkaProducer = kafka.producer();

// Function to connect to Kafka only once when the app starts
const connectProducer = async () => {
  try {
    await kafkaProducer.connect();
    console.log("Kafka Producer Connected Successfully!");
  } catch (error) {
    console.log("Error:", error);
    console.log("Something went wrong while connecting Kafka Producer");
    // Exit the process or handle the error appropriately
  }
};

// Function to send a message using the established connection
const sendEvent = async (topic, partition, data, metadata) => {
  try {
    await kafkaProducer.send({
      topic,
      messages: [
        {
          partition: partition || Math.floor(Math.random() * defaultNumberOfPartitions),
          value: JSON.stringify({ data: data, metadata: metadata }),
        },
      ],
    });

    console.log("Hi Published the event: ", JSON.stringify({data: data, metadata: metadata}));
    
  } catch (error) {
    console.error("Error sending Kafka message:", error);
    console.log("Something went wrong while sending event via Kafka Producer");
  }
};

// Function to disconnect (e.g., when the server shuts down)
const disconnectProducer = async () => {
  try {
    await kafkaProducer.disconnect();
  } catch (error) {
    console.error("Error sending Kafka message:", error);
    console.log("Something went wrong while disconnecting Kafka Producer");
  }
};

export { connectProducer, sendEvent, disconnectProducer };
