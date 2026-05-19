export type HousemateJobName =
  | "cron:absence-snapshots"
  | "cron:regular-expense-reminders"
  | "cron:monthly-summaries"
  | "expense:instant-notify"
  | "expense:regular-notify"
  | "rotational:turn-notify";

export interface ExpenseNotifyJobData {
  expenseId: string;
  houseId: string;
}

export interface RotationalTurnNotifyJobData {
  houseId: string;
  rotationalTypeId: string;
  nextMemberId: string;
}

export type HousemateJobData =
  | Record<string, never>
  | ExpenseNotifyJobData
  | RotationalTurnNotifyJobData;
