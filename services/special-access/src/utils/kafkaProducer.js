import { kafka } from "./kafkaClient.js";

const DEFAULT_PARTITIONS = Number(process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS) || 4;
const producer = kafka.producer();
let isProducerConnected = false;

const connectProducer = async () => {
  if (!isProducerConnected) {
    await producer.connect();
    isProducerConnected = true;
  }
};

const sendEvent = async (topic, partition, data, metadata) => {
  await producer.send({
    topic,
    messages: [
      {
        partition: partition || Math.floor(Math.random() * DEFAULT_PARTITIONS),
        value: JSON.stringify({ data, metadata }),
      },
    ],
  });
};

const disconnectProducer = async () => {
  if (isProducerConnected) {
    await producer.disconnect();
    isProducerConnected = false;
  }
};

const isProducerReady = () => isProducerConnected;

export { connectProducer, sendEvent, disconnectProducer, isProducerReady };
