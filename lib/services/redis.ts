import { DEFAULT_REDIS_PORT } from "@/constants/numeric";
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT
    ? parseInt(process.env.REDIS_PORT, 10)
    : DEFAULT_REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    // reconnect after
    return Math.min(times * 50, 2000);
  },
});

export default redis;
