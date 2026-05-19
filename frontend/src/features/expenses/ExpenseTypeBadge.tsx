import { ExpenseType } from "@housemate/shared";
import { expenseTypeLabel } from "./utils";
import "./expenses.css";

interface ExpenseTypeBadgeProps {
  type: ExpenseType;
}

export function ExpenseTypeBadge({ type }: ExpenseTypeBadgeProps) {
  const className =
    type === ExpenseType.INSTANT
      ? "expenses-badge expenses-badge-instant"
      : type === ExpenseType.REGULAR
        ? "expenses-badge expenses-badge-regular"
        : "expenses-badge expenses-badge-rotational";

  return <span className={className}>{expenseTypeLabel(type)}</span>;
}
