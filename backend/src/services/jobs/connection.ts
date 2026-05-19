import { Redis } from "ioredis";
import { env } from "../../config/env.js";

export const jobsRedisConnection = new Redis(env.redis.url, {
  maxRetriesPerRequest: null,
});
