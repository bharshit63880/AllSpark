import { Kafka } from "kafkajs";

/**
 * Centralized Kafka client configuration
 * This is the single source of truth for all Kafka connections
 */

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "kafka:9092").split(",");
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "api-client";

const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKERS,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

export { kafka };
