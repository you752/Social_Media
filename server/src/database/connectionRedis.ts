import { createClient } from "redis";
import { env } from "../config/env.service";

export const clientRedis = createClient({
  url: env.redisConnection as string,
});

export const clientRedius = clientRedis;

export const connectRedis = async () => {
  try {
    await clientRedis.connect();
    console.log("Connected to Redis");
  } catch (error) {
    console.error("Error connecting to Redis:", error);
  }
};

export const connectRS = connectRedis;
