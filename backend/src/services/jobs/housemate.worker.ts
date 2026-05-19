import { Worker, type Job } from "bullmq";
import { jobsRedisConnection } from "./connection.js";
import { processAbsenceSnapshotCron } from "./handlers/absence-snapshot.handler.js";
import {
  processInstantExpenseNotify,
  processRegularExpenseNotify,
} from "./handlers/expense-notify.handler.js";
import { processMonthlySummaryCron } from "./handlers/monthly-summary.handler.js";
import { processRegularExpenseReminderCron } from "./handlers/regular-reminder.handler.js";
import { processRotationalTurnNotify } from "./handlers/rotational-turn.handler.js";
import type {
  ExpenseNotifyJobData,
  HousemateJobData,
  RotationalTurnNotifyJobData,
} from "./types.js";

async function dispatchHousemateJob(job: Job<HousemateJobData>): Promise<void> {
  switch (job.name) {
    case "cron:absence-snapshots":
      await processAbsenceSnapshotCron();
      return;
    case "cron:regular-expense-reminders":
      await processRegularExpenseReminderCron();
      return;
    case "cron:monthly-summaries":
      await processMonthlySummaryCron();
      return;
    case "expense:instant-notify":
      await processInstantExpenseNotify(job.data as ExpenseNotifyJobData);
      return;
    case "expense:regular-notify":
      await processRegularExpenseNotify(job.data as ExpenseNotifyJobData);
      return;
    case "rotational:turn-notify":
      await processRotationalTurnNotify(job.data as RotationalTurnNotifyJobData);
      return;
    default:
      console.warn(`[jobs] Unknown housemate job name: ${job.name}`);
  }
}

export function createHousemateWorker(): Worker<HousemateJobData> {
  const worker = new Worker<HousemateJobData>(
    "housemate",
    async (job) => dispatchHousemateJob(job),
    {
      connection: jobsRedisConnection,
      concurrency: 2,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[jobs] ${job.name} (${job.id}) completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[jobs] ${job?.name} (${job?.id}) failed: ${err.message}`);
  });

  return worker;
}
