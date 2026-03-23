import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "localhost:6379";


const redis = new Redis(REDIS_URL);


export { redis };