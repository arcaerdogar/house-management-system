import { Prisma } from "@prisma/client";

export interface DirectedBalanceInput {
  creditorMemberId: string;
  debtorMemberId: string;
  amount: Prisma.Decimal;
}

export interface NetPairBalance {
  creditorMemberId: string;
  debtorMemberId: string;
  netAmount: Prisma.Decimal;
}

function directedKey(creditorMemberId: string, debtorMemberId: string): string {
  return `${creditorMemberId}|${debtorMemberId}`;
}

function addDirected(
  edges: Map<string, Prisma.Decimal>,
  creditorMemberId: string,
  debtorMemberId: string,
  amount: Prisma.Decimal
): void {
  if (creditorMemberId === debtorMemberId || amount.isZero()) {
    return;
  }
  const key = directedKey(creditorMemberId, debtorMemberId);
  edges.set(key, (edges.get(key) ?? new Prisma.Decimal(0)).plus(amount));
}

export function aggregatePairwiseBalances(
  inputs: DirectedBalanceInput[]
): NetPairBalance[] {
  const directed = new Map<string, Prisma.Decimal>();

  for (const input of inputs) {
    addDirected(
      directed,
      input.creditorMemberId,
      input.debtorMemberId,
      input.amount
    );
  }

  const pairKeys = new Set<string>();
  for (const key of directed.keys()) {
    const [left, right] = key.split("|");
    if (!left || !right) continue;
    pairKeys.add([left, right].sort().join("|"));
  }

  const results: NetPairBalance[] = [];

  for (const pairKey of pairKeys) {
    const [memberA, memberB] = pairKey.split("|");
    if (!memberA || !memberB) continue;

    const aToB = directed.get(directedKey(memberA, memberB)) ?? new Prisma.Decimal(0);
    const bToA = directed.get(directedKey(memberB, memberA)) ?? new Prisma.Decimal(0);

    if (aToB.gt(bToA)) {
      results.push({
        creditorMemberId: memberA,
        debtorMemberId: memberB,
        netAmount: aToB.minus(bToA),
      });
      continue;
    }

    if (bToA.gt(aToB)) {
      results.push({
        creditorMemberId: memberB,
        debtorMemberId: memberA,
        netAmount: bToA.minus(aToB),
      });
    }
  }

  return results;
}
