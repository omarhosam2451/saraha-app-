import { redisClient } from "../redis.clients.js";

export const get = (key) => {
    return redisClient.get(key);
};

export const del = (key) => {
    return redisClient.del(key);
};

export const set = ({ key, value, expireTime, options }) => {
    if (options) {
        return redisClient.set(key, value, options);
    }
    if (expireTime !== undefined) {
        return redisClient.set(key, value, "EX", expireTime);
    }
    return redisClient.set(key, value);
};

export const ttl = (key) => {
    return redisClient.ttl(key);
};

export const expire = (key, expireTime) => {
    return redisClient.expire(key, expireTime);
};
