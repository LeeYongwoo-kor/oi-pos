import { DEFAULT_REDIS_PORT } from "@/constants/numeric";
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
    ? parseInt(process.env.REDIS_PORT, 10)
    : DEFAULT_REDIS_PORT,
});

export default redis;
