import { RegularExpensePeriod } from "@housemate/shared";

export function periodBounds(
  period: RegularExpensePeriod,
  expenseDate: Date
): { start: Date; end: Date } {
  if (period === RegularExpensePeriod.MONTHLY) {
    const year = expenseDate.getUTCFullYear();
    const month = expenseDate.getUTCMonth();
    return {
      start: new Date(Date.UTC(year, month, 1)),
      end: new Date(Date.UTC(year, month + 1, 0)),
    };
  }

  const day = expenseDate.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(
    Date.UTC(
      expenseDate.getUTCFullYear(),
      expenseDate.getUTCMonth(),
      expenseDate.getUTCDate() + diffToMonday
    )
  );
  const end = new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate() + 6
    )
  );
  return { start, end };
}

export function isPeriodStartDay(
  period: RegularExpensePeriod,
  date: Date
): boolean {
  if (period === RegularExpensePeriod.MONTHLY) {
    return date.getUTCDate() === 1;
  }

  return date.getUTCDay() === 1;
}
