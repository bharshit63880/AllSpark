/**
 * Utility to calculate partition for Kafka message
 * Ensures consistent message distribution
 */

const DEFAULT_PARTITIONS = process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS || 4;

/**
 * Get partition for Kafka message
 * @param {string} key - Optional key for consistent partitioning
 * @returns {number} partition number
 */
const getPartition = (key = null) => {
  if (key) {
    // Use key-based partitioning for deterministic routing
    return Math.abs(key.hashCode()) % DEFAULT_PARTITIONS;
  }
  // Random partitioning if no key provided
  return Math.floor(Math.random() * DEFAULT_PARTITIONS);
};

export default getPartition;
