import {
  ExpenseType,
  RegularExpensePeriod,
  type HouseMember,
} from "@housemate/shared";

export function memberDisplayName(
  member: Pick<HouseMember, "user"> & { user?: HouseMember["user"] }
): string {
  return member.user?.name ?? member.user?.email ?? "Üye";
}

export function formatMoney(amount: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value);
}

export function expenseTypeLabel(type: ExpenseType): string {
  switch (type) {
    case ExpenseType.INSTANT:
      return "Anlık";
    case ExpenseType.REGULAR:
      return "Düzenli";
    case ExpenseType.ROTATIONAL:
      return "Sıralı";
    default:
      return type;
  }
}

export function periodLabel(period: RegularExpensePeriod): string {
  switch (period) {
    case RegularExpensePeriod.WEEKLY:
      return "Haftalık";
    case RegularExpensePeriod.MONTHLY:
      return "Aylık";
    default:
      return period;
  }
}

export function normalizeAmountInput(raw: string): string {
  return raw.trim().replace(",", ".");
}

export function isValidAmount(raw: string): boolean {
  const value = normalizeAmountInput(raw);
  return /^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0;
}
