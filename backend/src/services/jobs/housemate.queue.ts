import { Queue } from "bullmq";
import { jobsRedisConnection } from "./connection.js";
import type { HousemateJobData } from "./types.js";

/** Same queue name as expense-notify.jobs.ts enqueues. */
export const housemateQueue = new Queue<HousemateJobData>("housemate", {
  connection: jobsRedisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
  },
});
