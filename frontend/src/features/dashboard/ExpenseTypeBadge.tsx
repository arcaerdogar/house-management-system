import { ExpenseType } from "@housemate/shared";
import { expenseTypeLabel } from "./utils";
import "./dashboard.css";

interface ExpenseTypeBadgeProps {
  type: ExpenseType;
}

export function ExpenseTypeBadge({ type }: ExpenseTypeBadgeProps) {
  const className =
    type === ExpenseType.INSTANT
      ? "dashboard-badge dashboard-badge-instant"
      : type === ExpenseType.REGULAR
        ? "dashboard-badge dashboard-badge-regular"
        : "dashboard-badge dashboard-badge-rotational";

  return <span className={className}>{expenseTypeLabel(type)}</span>;
}
