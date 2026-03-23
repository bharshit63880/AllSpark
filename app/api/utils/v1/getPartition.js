import "dotenv/config";




const DEFAULT_PARTITIONS_OF_KAFKA_TOPICS = process.env.DEFAULT_PARTITIONS_OF_KAFKA_TOPICS || 4;




const getPartition = () => {
    const partition = (Math.floor((Math.random() * 40))) % DEFAULT_PARTITIONS_OF_KAFKA_TOPICS;
    return partition;
};




export default getPartition;