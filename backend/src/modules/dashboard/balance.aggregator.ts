import { ExpenseType, Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";
import {
  aggregatePairwiseBalances,
  type DirectedBalanceInput,
  type NetPairBalance,
} from "../../domain/snapshot/pairwise-balance.js";

export interface HouseBalanceContext {
  since: Date | null;
  netPairs: NetPairBalance[];
}

export async function loadHouseBalanceContext(
  houseId: string
): Promise<HouseBalanceContext> {
  const latestSnapshot = await prisma.balanceSnapshot.findFirst({
    where: { houseId },
    orderBy: { createdAt: "desc" },
    include: { entries: true },
  });

  const since = latestSnapshot?.createdAt ?? null;
  const directedInputs: DirectedBalanceInput[] = [];

  if (latestSnapshot) {
    for (const entry of latestSnapshot.entries) {
      directedInputs.push({
        creditorMemberId: entry.creditorMemberId,
        debtorMemberId: entry.debtorMemberId,
        amount: entry.netAmount,
      });
    }
  }

  const unsettledSplits = await prisma.expenseSplit.findMany({
    where: {
      isSettled: false,
      expense: {
        houseId,
        expenseType: { not: ExpenseType.ROTATIONAL },
        ...(since ? { createdAt: { gt: since } } : {}),
      },
    },
    include: {
      expense: {
        select: { payerMemberId: true },
      },
    },
  });

  for (const split of unsettledSplits) {
    directedInputs.push({
      creditorMemberId: split.expense.payerMemberId,
      debtorMemberId: split.debtorMemberId,
      amount: split.amountOwed,
    });
  }

  return {
    since,
    netPairs: aggregatePairwiseBalances(directedInputs),
  };
}

export interface ViewerPairNet {
  netAmount: Prisma.Decimal;
  direction: "OWED_TO_YOU" | "YOU_OWE" | "SETTLED";
}

export function netBetweenMembers(
  netPairs: NetPairBalance[],
  viewerMemberId: string,
  counterpartyMemberId: string
): ViewerPairNet {
  const pair = netPairs.find(
    (row) =>
      (row.creditorMemberId === viewerMemberId &&
        row.debtorMemberId === counterpartyMemberId) ||
      (row.creditorMemberId === counterpartyMemberId &&
        row.debtorMemberId === viewerMemberId)
  );

  if (!pair || pair.netAmount.isZero()) {
    return {
      netAmount: new Prisma.Decimal(0),
      direction: "SETTLED",
    };
  }

  if (pair.creditorMemberId === viewerMemberId) {
    return { netAmount: pair.netAmount, direction: "OWED_TO_YOU" };
  }

  return { netAmount: pair.netAmount, direction: "YOU_OWE" };
}

export function consolidatedBalanceForViewer(
  netPairs: NetPairBalance[],
  viewerMemberId: string
): { netAmount: Prisma.Decimal; direction: "CREDITOR" | "DEBTOR" | "SETTLED" } {
  let credits = new Prisma.Decimal(0);
  let debts = new Prisma.Decimal(0);

  for (const pair of netPairs) {
    if (pair.creditorMemberId === viewerMemberId) {
      credits = credits.plus(pair.netAmount);
    } else if (pair.debtorMemberId === viewerMemberId) {
      debts = debts.plus(pair.netAmount);
    }
  }

  const net = credits.minus(debts);
  if (net.isZero()) {
    return { netAmount: new Prisma.Decimal(0), direction: "SETTLED" };
  }
  if (net.gt(0)) {
    return { netAmount: net, direction: "CREDITOR" };
  }
  return { netAmount: net.abs(), direction: "DEBTOR" };
}
