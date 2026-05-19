const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnly(value: string): Date {
  if (!DATE_ONLY.test(value)) {
    throw new Error("Geçersiz tarih formatı");
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayDateOnly(): string {
  return formatDateOnly(new Date());
}

export function isFutureDateOnly(dateStr: string): boolean {
  const date = parseDateOnly(dateStr);
  const today = parseDateOnly(todayDateOnly());
  return date.getTime() > today.getTime();
}

export function isFutureOrTodayStart(dateStr: string): boolean {
  const date = parseDateOnly(dateStr);
  const today = parseDateOnly(todayDateOnly());
  return date.getTime() >= today.getTime();
}

export function formatDisplayDate(dateStr: string): string {
  const date = parseDateOnly(dateStr);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function eachDayInRange(startStr: string, endStr: string): Date[] {
  const start = parseDateOnly(startStr);
  const end = parseDateOnly(endStr);
  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function monthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  });
}
