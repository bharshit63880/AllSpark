import "dotenv/config";
import { kafka } from "../../config/v1/kafka.js";

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
  console.log("Admin service Kafka producer connected.");
};

const defaultPartitions = Number(process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS) || 4;
const getPartition = () => Math.floor(Math.random() * defaultPartitions);

const sendEvent = async (topic, partition, data, metadata) => {
  const payload = JSON.stringify({ data, metadata });
  await producer.send({
    topic,
    messages: [{ partition: partition ?? getPartition(), value: payload }],
  });
};

export { connectProducer, sendEvent, producer };
