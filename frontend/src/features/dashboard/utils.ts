import { ExpenseType, type HouseMember } from "@housemate/shared";

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

export function consolidatedDirectionLabel(
  direction: "CREDITOR" | "DEBTOR" | "SETTLED"
): string {
  switch (direction) {
    case "CREDITOR":
      return "Toplam alacağınız";
    case "DEBTOR":
      return "Toplam borcunuz";
    case "SETTLED":
      return "Borç / alacak yok";
    default:
      return direction;
  }
}

export function pairwiseDirectionLabel(
  direction: "OWED_TO_YOU" | "YOU_OWE",
  memberName: string | null
): string {
  const name = memberName?.trim() || "Üye";
  switch (direction) {
    case "OWED_TO_YOU":
      return `${name} size borçlu`;
    case "YOU_OWE":
      return `${name}'e borçlusunuz`;
    default:
      return direction;
  }
}

export function debtDetailDirectionLabel(
  direction: "OWED_TO_YOU" | "YOU_OWE" | "SETTLED",
  counterpartyName: string | null
): string {
  const name = counterpartyName?.trim() || "Üye";
  switch (direction) {
    case "OWED_TO_YOU":
      return `${name} size borçlu`;
    case "YOU_OWE":
      return `${name}'e borçlusunuz`;
    case "SETTLED":
      return `${name} ile hesap dengede`;
    default:
      return direction;
  }
}

export function memberLabel(name: string | null): string {
  return name?.trim() || "Üye";
}
