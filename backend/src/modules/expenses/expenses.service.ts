import { ExpenseType, RegularExpensePeriod } from "@housemate/shared";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { parseDateOnly } from "../../domain/snapshot/date-utils.js";
import { HttpError } from "../common/errors.js";
import { houseMembershipService } from "../houses/membership.service.js";
import {
  enqueueExpenseInstantNotify,
  enqueueExpenseRegularNotify,
} from "./expense-notify.jobs.js";
import { expenseSplitCalculator } from "./expense-split.calculator.js";
import { parseAmount, toExpenseDto } from "./expenses.dto.js";

const expenseInclude = {
  exclusions: true,
  splits: true,
} as const;

function periodBounds(
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

async function assertNoDuplicateRegularPeriod(
  templateId: string,
  period: RegularExpensePeriod,
  expenseDate: Date
) {
  const { start, end } = periodBounds(period, expenseDate);
  const existing = await prisma.expense.findFirst({
    where: {
      templateId,
      expenseType: ExpenseType.REGULAR,
      expenseDate: { gte: start, lte: end },
    },
    select: { id: true },
  });

  if (existing) {
    throw HttpError.conflict(
      "A regular expense for this template period already exists",
      "REGULAR_PERIOD_EXISTS"
    );
  }
}

export async function createExpense(
  houseId: string,
  userId: string,
  input: {
    expenseType: typeof ExpenseType.INSTANT | typeof ExpenseType.REGULAR;
    amount: number;
    description: string;
    expenseDate: string;
    respectsAbsence?: boolean;
    excludedMemberIds?: string[];
    templateId?: string;
  }
) {
  const actor = await houseMembershipService.assertActiveMember(houseId, userId);
  const expenseDate = parseDateOnly(input.expenseDate);
  const excludedMemberIds = input.excludedMemberIds ?? [];

  let payerMemberId = actor.memberId;
  let templateId: string | null = null;
  let respectsAbsence = input.respectsAbsence ?? false;

  if (input.expenseType === ExpenseType.REGULAR) {
    const template = await prisma.regularExpenseTemplate.findFirst({
      where: { id: input.templateId!, houseId, isActive: true },
    });
    if (!template) {
      throw HttpError.notFound("Regular expense template not found");
    }
    if (template.responsibleMemberId !== actor.memberId) {
      throw HttpError.forbidden(
        "Only the responsible member may submit this regular expense"
      );
    }

    await assertNoDuplicateRegularPeriod(
      template.id,
      template.period,
      expenseDate
    );

    payerMemberId = template.responsibleMemberId;
    templateId = template.id;
    respectsAbsence = template.respectsAbsence;
  }

  const splitLines = await expenseSplitCalculator.calculateSplits({
    houseId,
    amount: input.amount,
    expenseDate,
    respectsAbsence,
    excludedMemberIds,
    payerMemberId,
  });

  const amountDecimal = parseAmount(input.amount);

  const expense = await prisma.$transaction(async (tx) => {
    const baseData: Prisma.ExpenseUncheckedCreateInput = {
      houseId,
      payerMemberId,
      templateId,
      expenseType: input.expenseType,
      amount: amountDecimal,
      description: input.description,
      respectsAbsence,
      expenseDate,
      splits: {
        create: splitLines.map((line) => ({
          debtorMemberId: line.debtorMemberId,
          amountOwed: parseAmount(line.amountOwed),
        })),
      },
    };

    if (excludedMemberIds.length > 0) {
      baseData.exclusions = {
        create: excludedMemberIds.map((excludedMemberId) => ({
          excludedMemberId,
        })),
      };
    }

    return tx.expense.create({
      data: baseData,
      include: expenseInclude,
    });
  });

  if (input.expenseType === ExpenseType.INSTANT) {
    await enqueueExpenseInstantNotify({ expenseId: expense.id, houseId });
  } else {
    await enqueueExpenseRegularNotify({ expenseId: expense.id, houseId });
  }

  return toExpenseDto(expense, { includeRelations: true });
}

export async function listExpenses(
  houseId: string,
  userId: string,
  query: {
    type?: ExpenseType;
    from?: string;
    to?: string;
    memberId?: string;
  }
) {
  await houseMembershipService.assertActiveMember(houseId, userId);

  const where: Prisma.ExpenseWhereInput = {
    houseId,
    expenseType: { not: ExpenseType.ROTATIONAL },
  };

  if (query.type) {
    where.expenseType = query.type;
  }
  if (query.from || query.to) {
    where.expenseDate = {};
    if (query.from) {
      where.expenseDate.gte = parseDateOnly(query.from);
    }
    if (query.to) {
      where.expenseDate.lte = parseDateOnly(query.to);
    }
  }
  if (query.memberId) {
    where.OR = [
      { payerMemberId: query.memberId },
      { splits: { some: { debtorMemberId: query.memberId } } },
      { exclusions: { some: { excludedMemberId: query.memberId } } },
    ];
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
    include: expenseInclude,
  });

  return expenses.map((expense) => toExpenseDto(expense));
}

export async function getExpense(
  houseId: string,
  expenseId: string,
  userId: string
) {
  await houseMembershipService.assertActiveMember(houseId, userId);

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, houseId },
    include: expenseInclude,
  });

  if (!expense) {
    throw HttpError.notFound("Expense not found");
  }

  if (expense.expenseType === ExpenseType.ROTATIONAL) {
    return toExpenseDto(expense);
  }

  return toExpenseDto(expense, { includeRelations: true });
}
