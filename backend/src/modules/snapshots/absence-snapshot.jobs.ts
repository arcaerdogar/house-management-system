import type { Queue } from "bullmq";

/**
 * Midnight absence start/end snapshot cron registration (FR-2.5, FR-2.6).
 * Full job handlers are implemented by the jobs-mail agent.
 */
export function registerAbsenceSnapshotJobs(_queue: Queue): void {
  // Stub — jobs-mail agent wires ABSENCE_START / ABSENCE_END processors here.
}
