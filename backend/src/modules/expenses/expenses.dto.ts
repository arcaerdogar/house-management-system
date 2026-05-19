import type {
  Expense,
  ExpenseExclusion,
  ExpenseSplit,
} from "@housemate/shared";
import { Prisma } from "@prisma/client";
import { formatDateOnly } from "../../domain/snapshot/date-utils.js";

type ExpenseRecord = Prisma.ExpenseGetPayload<{
  include: {
    exclusions: true;
    splits: true;
  };
}>;

export function decimalToString(value: Prisma.Decimal): string {
  return value.toFixed(2);
}

export function parseAmount(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

export function toExpenseExclusionDto(
  row: Prisma.ExpenseExclusionGetPayload<object>
): ExpenseExclusion {
  return {
    id: row.id,
    expenseId: row.expenseId,
    excludedMemberId: row.excludedMemberId,
  };
}

export function toExpenseSplitDto(
  row: Prisma.ExpenseSplitGetPayload<object>
): ExpenseSplit {
  return {
    id: row.id,
    expenseId: row.expenseId,
    debtorMemberId: row.debtorMemberId,
    amountOwed: decimalToString(row.amountOwed),
    isSettled: row.isSettled,
  };
}

export function toExpenseDto(
  expense: ExpenseRecord,
  options?: { includeRelations?: boolean }
): Expense {
  const dto: Expense = {
    id: expense.id,
    houseId: expense.houseId,
    payerMemberId: expense.payerMemberId,
    templateId: expense.templateId,
    rotationalTypeId: expense.rotationalTypeId,
    expenseType: expense.expenseType,
    amount: decimalToString(expense.amount),
    description: expense.description,
    respectsAbsence: expense.respectsAbsence,
    expenseDate: formatDateOnly(expense.expenseDate),
    createdAt: expense.createdAt.toISOString(),
  };

  if (options?.includeRelations) {
    if (expense.exclusions.length > 0) {
      dto.exclusions = expense.exclusions.map(toExpenseExclusionDto);
    }
    if (expense.splits.length > 0) {
      dto.splits = expense.splits.map(toExpenseSplitDto);
    }
  }

  return dto;
}
