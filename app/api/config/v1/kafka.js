import "dotenv/config";
import { Kafka } from "kafkajs";

const KAFKA_INSTANCE_IP = process.env.KAFKA_INSTANCE_IP || "localhost";

const kafka = new Kafka({
  clientId: "api",
  brokers: [`${KAFKA_INSTANCE_IP}:9092`],
});

export { kafka };