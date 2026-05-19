import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../../config/env.js";

const connection = new Redis(env.redis.url, {
  maxRetriesPerRequest: null,
});

/** HouseMate domain jobs — workers registered by jobs-mail agent. */
const housemateQueue = new Queue("housemate", { connection });

export async function enqueueExpenseInstantNotify(payload: {
  expenseId: string;
  houseId: string;
}): Promise<void> {
  await housemateQueue.add("expense:instant-notify", payload);
}

export async function enqueueExpenseRegularNotify(payload: {
  expenseId: string;
  houseId: string;
}): Promise<void> {
  await housemateQueue.add("expense:regular-notify", payload);
}
