import type { Queue } from "bullmq";
import { housemateQueue } from "./housemate.queue.js";

const CRON_TIMEZONE = "UTC";

/**
 * Idempotent repeatable job registration (BullMQ v5 job schedulers).
 */
export async function registerHousemateCrons(queue: Queue = housemateQueue): Promise<void> {
  await queue.upsertJobScheduler(
    "housemate-cron-absence-snapshots",
    { pattern: "0 0 * * *", tz: CRON_TIMEZONE },
    { name: "cron:absence-snapshots", data: {} }
  );

  await queue.upsertJobScheduler(
    "housemate-cron-regular-reminders",
    { pattern: "0 8 * * *", tz: CRON_TIMEZONE },
    { name: "cron:regular-expense-reminders", data: {} }
  );

  await queue.upsertJobScheduler(
    "housemate-cron-monthly-summaries",
    { pattern: "0 9 * * *", tz: CRON_TIMEZONE },
    { name: "cron:monthly-summaries", data: {} }
  );

  console.log("[jobs] HouseMate cron schedulers registered (UTC)");
}
