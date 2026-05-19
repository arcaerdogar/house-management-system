import type { Worker } from "bullmq";
import { createHousemateWorker } from "./housemate.worker.js";
import { registerHousemateCrons } from "./register-crons.js";

export { housemateQueue } from "./housemate.queue.js";
export type {
  ExpenseNotifyJobData,
  HousemateJobData,
  HousemateJobName,
  RotationalTurnNotifyJobData,
} from "./types.js";

let housemateWorker: Worker | null = null;

/**
 * Starts the HouseMate BullMQ worker and registers UTC cron schedulers.
 * Orchestrator should call from backend/src/index.ts alongside emailWorker import.
 */
export async function startHousemateWorkers(): Promise<void> {
  if (housemateWorker) {
    return;
  }

  housemateWorker = createHousemateWorker();
  await registerHousemateCrons();

  console.log("[jobs] HouseMate workers started");
}

export async function stopHousemateWorkers(): Promise<void> {
  if (!housemateWorker) {
    return;
  }

  await housemateWorker.close();
  housemateWorker = null;
}
