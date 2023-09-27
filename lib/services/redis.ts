import { REDIS_DEFAULT_PORT } from "@/constants/service";
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT
    ? parseInt(process.env.REDIS_PORT, 10)
    : REDIS_DEFAULT_PORT,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => {
    // reconnect after
    return Math.min(times * 50, 2000);
  },
});

export default redis;
