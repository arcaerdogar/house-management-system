import type {
  ActivityItem,
  DashboardSummary,
  DebtDetailLine,
  ExpenseType,
  MemberDebtDetail,
  PairwiseBalance,
} from "@housemate/shared";
import { ExpenseType as ExpenseTypeEnum } from "@housemate/shared";
import { ExpenseType as PrismaExpenseType, Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { parseDateOnly, formatDateOnly } from "../../domain/snapshot/date-utils.js";
import { HttpError } from "../common/errors.js";
import { houseMembershipService } from "../houses/membership.service.js";
import {
  consolidatedBalanceForViewer,
  loadHouseBalanceContext,
  netBetweenMembers,
} from "./balance.aggregator.js";
import { decimalToString } from "./dashboard.dto.js";

async function loadMemberNameMap(
  houseId: string
): Promise<Map<string, string | null>> {
  const members = await prisma.houseMember.findMany({
    where: { houseId, isActive: true },
    select: {
      id: true,
      user: { select: { name: true } },
    },
  });

  return new Map(members.map((member) => [member.id, member.user.name]));
}

function memberName(
  names: Map<string, string | null>,
  memberId: string
): string | null {
  return names.get(memberId) ?? null;
}

async function assertCounterpartyMember(houseId: string, memberId: string) {
  const counterparty = await prisma.houseMember.findFirst({
    where: { id: memberId, houseId, isActive: true },
    select: { id: true },
  });

  if (!counterparty) {
    throw HttpError.notFound("House member not found");
  }
}

export async function getDashboardSummary(
  houseId: string,
  userId: string
): Promise<DashboardSummary> {
  const viewer = await houseMembershipService.assertActiveMember(houseId, userId);
  const { netPairs } = await loadHouseBalanceContext(houseId);
  const names = await loadMemberNameMap(houseId);

  const consolidated = consolidatedBalanceForViewer(netPairs, viewer.memberId);

  const otherMemberIds = new Set<string>();
  for (const pair of netPairs) {
    if (pair.creditorMemberId === viewer.memberId) {
      otherMemberIds.add(pair.debtorMemberId);
    } else if (pair.debtorMemberId === viewer.memberId) {
      otherMemberIds.add(pair.creditorMemberId);
    }
  }

  const pairwise: PairwiseBalance[] = [];
  for (const memberId of otherMemberIds) {
    const pairNet = netBetweenMembers(netPairs, viewer.memberId, memberId);
    if (pairNet.direction === "SETTLED") {
      continue;
    }

    pairwise.push({
      memberId,
      memberName: memberName(names, memberId),
      netAmount: decimalToString(pairNet.netAmount),
      direction: pairNet.direction,
    });
  }

  pairwise.sort((a, b) => a.memberName?.localeCompare(b.memberName ?? "") ?? 0);

  return {
    houseId,
    memberId: viewer.memberId,
    consolidatedBalance: decimalToString(consolidated.netAmount),
    consolidatedDirection: consolidated.direction,
    pairwise,
  };
}

export async function getMemberDebtDetail(
  houseId: string,
  userId: string,
  counterpartyMemberId: string
): Promise<MemberDebtDetail> {
  const viewer = await houseMembershipService.assertActiveMember(houseId, userId);

  if (counterpartyMemberId === viewer.memberId) {
    throw HttpError.badRequest(
      "Cannot load debt detail against yourself",
      "INVALID_COUNTERPARTY"
    );
  }

  await assertCounterpartyMember(houseId, counterpartyMemberId);

  const { since, netPairs } = await loadHouseBalanceContext(houseId);
  const pairNet = netBetweenMembers(
    netPairs,
    viewer.memberId,
    counterpartyMemberId
  );
  const names = await loadMemberNameMap(houseId);

  const splits = await prisma.expenseSplit.findMany({
    where: {
      isSettled: false,
      expense: {
        houseId,
        expenseType: { not: PrismaExpenseType.ROTATIONAL },
        ...(since ? { createdAt: { gt: since } } : {}),
        OR: [
          {
            payerMemberId: viewer.memberId,
            splits: { some: { debtorMemberId: counterpartyMemberId } },
          },
          {
            payerMemberId: counterpartyMemberId,
            splits: { some: { debtorMemberId: viewer.memberId } },
          },
        ],
      },
    },
    include: {
      expense: {
        select: {
          id: true,
          description: true,
          expenseDate: true,
          expenseType: true,
          payerMemberId: true,
        },
      },
    },
    orderBy: [
      { expense: { expenseDate: "desc" } },
      { expense: { createdAt: "desc" } },
    ],
  });

  const lines: DebtDetailLine[] = splits
    .filter(
      (split) =>
        (split.expense.payerMemberId === viewer.memberId &&
          split.debtorMemberId === counterpartyMemberId) ||
        (split.expense.payerMemberId === counterpartyMemberId &&
          split.debtorMemberId === viewer.memberId)
    )
    .map((split) => ({
      expenseId: split.expense.id,
      description: split.expense.description,
      expenseDate: formatDateOnly(split.expense.expenseDate),
      expenseType: split.expense.expenseType as ExpenseType,
      amountOwed: decimalToString(split.amountOwed),
      payerMemberId: split.expense.payerMemberId,
      payerName: memberName(names, split.expense.payerMemberId),
    }));

  return {
    houseId,
    viewerMemberId: viewer.memberId,
    counterpartyMemberId,
    counterpartyName: memberName(names, counterpartyMemberId),
    netAmount: decimalToString(pairNet.netAmount),
    direction: pairNet.direction,
    lines,
  };
}

export async function listActivity(
  houseId: string,
  userId: string,
  query: {
    type?: ExpenseType;
    from?: string;
    to?: string;
    memberId?: string;
  }
): Promise<ActivityItem[]> {
  const viewer = await houseMembershipService.assertActiveMember(houseId, userId);

  const where: Prisma.ExpenseWhereInput = { houseId };

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
    include: {
      splits: {
        where: { debtorMemberId: viewer.memberId },
        select: { amountOwed: true },
      },
      payerMember: {
        select: {
          id: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  return expenses.map((expense) => {
    const yourShare =
      expense.expenseType === ExpenseTypeEnum.ROTATIONAL
        ? null
        : expense.splits[0]
          ? decimalToString(expense.splits[0].amountOwed)
          : null;

    return {
      id: expense.id,
      houseId: expense.houseId,
      expenseId: expense.id,
      expenseType: expense.expenseType as ExpenseType,
      description: expense.description,
      amount: decimalToString(expense.amount),
      expenseDate: formatDateOnly(expense.expenseDate),
      createdAt: expense.createdAt.toISOString(),
      payerMemberId: expense.payerMemberId,
      payerName: expense.payerMember.user.name,
      yourShare,
    };
  });
}
