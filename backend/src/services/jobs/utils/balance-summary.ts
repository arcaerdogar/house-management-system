import { ExpenseType, Prisma } from "@prisma/client";
import { prisma } from "../../../config/db.js";
import { aggregatePairwiseBalances } from "../../../domain/snapshot/pairwise-balance.js";

export interface MemberBalanceSummary {
  consolidatedBalance: string;
  consolidatedDirection: "CREDITOR" | "DEBTOR" | "SETTLED";
  pairwise: Array<{
    counterpartyName: string | null;
    netAmount: string;
    direction: "OWED_TO_YOU" | "YOU_OWE";
  }>;
}

function decimalToString(value: Prisma.Decimal): string {
  return value.abs().toFixed(2);
}

export async function computeMemberBalanceSummary(
  houseId: string,
  memberId: string
): Promise<MemberBalanceSummary> {
  const latestSnapshot = await prisma.balanceSnapshot.findFirst({
    where: { houseId },
    orderBy: { createdAt: "desc" },
    include: { entries: true },
  });

  const since = latestSnapshot?.createdAt ?? null;
  const directedInputs: Array<{
    creditorMemberId: string;
    debtorMemberId: string;
    amount: Prisma.Decimal;
  }> = [];

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
      expense: { select: { payerMemberId: true } },
    },
  });

  for (const split of unsettledSplits) {
    directedInputs.push({
      creditorMemberId: split.expense.payerMemberId,
      debtorMemberId: split.debtorMemberId,
      amount: split.amountOwed,
    });
  }

  const netPairs = aggregatePairwiseBalances(directedInputs);
  const memberIds = new Set<string>([memberId]);
  for (const pair of netPairs) {
    memberIds.add(pair.creditorMemberId);
    memberIds.add(pair.debtorMemberId);
  }

  const members = await prisma.houseMember.findMany({
    where: { id: { in: [...memberIds] } },
    include: { user: { select: { name: true } } },
  });
  const memberNameById = new Map(
    members.map((member) => [member.id, member.user.name])
  );

  let netTotal = new Prisma.Decimal(0);
  const pairwise: MemberBalanceSummary["pairwise"] = [];

  for (const pair of netPairs) {
    if (pair.creditorMemberId === memberId) {
      netTotal = netTotal.plus(pair.netAmount);
      pairwise.push({
        counterpartyName: memberNameById.get(pair.debtorMemberId) ?? null,
        netAmount: decimalToString(pair.netAmount),
        direction: "OWED_TO_YOU",
      });
      continue;
    }

    if (pair.debtorMemberId === memberId) {
      netTotal = netTotal.minus(pair.netAmount);
      pairwise.push({
        counterpartyName: memberNameById.get(pair.creditorMemberId) ?? null,
        netAmount: decimalToString(pair.netAmount),
        direction: "YOU_OWE",
      });
    }
  }

  let consolidatedDirection: MemberBalanceSummary["consolidatedDirection"] =
    "SETTLED";
  if (netTotal.gt(0)) {
    consolidatedDirection = "CREDITOR";
  } else if (netTotal.lt(0)) {
    consolidatedDirection = "DEBTOR";
  }

  return {
    consolidatedBalance: decimalToString(netTotal),
    consolidatedDirection,
    pairwise,
  };
}
