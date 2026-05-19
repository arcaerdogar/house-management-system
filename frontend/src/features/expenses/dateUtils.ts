const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayDateOnly(): string {
  return formatDateOnly(new Date());
}

export function formatDisplayDate(dateStr: string): string {
  if (!DATE_ONLY.test(dateStr)) return dateStr;
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
