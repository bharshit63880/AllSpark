const DEFAULT_PARTITIONS_OF_KAFKA_TOPICS = Number(process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS) || 4;

const getPartition = () => (Math.floor(40 * Math.random())) % DEFAULT_PARTITIONS_OF_KAFKA_TOPICS;

export default getPartition;
