    import {createClient} from 'redis';
    import envConfig from '../config/env.config.js';
  
     export    const redisClient = await createClient({
        url: envConfig.redis.url
     })
    .on('error', (err) => console.log('Redis Client Error', err))


export const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("redis connected successfullyy");
        
    } catch (error) {
        console.log("redis connection error:", error);
    }
}