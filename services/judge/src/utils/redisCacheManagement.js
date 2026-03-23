import { redis as redisClient } from "../../config/v1/redis.js";


const getFromCache = async (key) => {
    let isValueFound = false;
    let value;
    try {
        const result = await redisClient.get(key);
        if (result) {
            value = JSON.parse(result);
            isValueFound = true;
        }

        return { isValueFound, value };

    } catch (error) {
        console.log(error);
        console.log("Something Went wrong while getting data from cache with key: ", key);
        return { isValueFound, value };
    }
};

const setToCache = async (key, value, ttl) => {

    try {
        await redisClient.set(key, JSON.stringify(value), "EX", ttl);
        return true;
    } catch (error) {
        console.log(error);
        console.log("Something Went wrong while setting data to cache with key, value: ", key, " : ", value, ttl);
        return false;
    }
};

const deleteFromCache = async (key) => {
    try {
        await redisClient.del(key);
        return true;
    } catch (error) {
        console.log(error);
        console.log("Something Went wrong while deleting data to cache with key: ", key);
        return false;
    }
};


export { getFromCache, setToCache, deleteFromCache };
