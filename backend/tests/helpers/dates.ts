import { formatDateOnly, todayUtcDateOnly } from "../../src/domain/snapshot/date-utils.js";

export function addUtcDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function dateOnlyInDays(daysFromToday: number): string {
  return formatDateOnly(addUtcDays(todayUtcDateOnly(), daysFromToday));
}
