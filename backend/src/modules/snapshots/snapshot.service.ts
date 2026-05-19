import { ExpenseType, Prisma } from "@prisma/client";
import { SnapshotTriggerType } from "@housemate/shared";
import { prisma } from "../../config/db.js";
import type {
  CreateSnapshotParams,
  ISnapshotService,
} from "../../domain/contracts/snapshot.service.js";
import { aggregatePairwiseBalances } from "../../domain/snapshot/pairwise-balance.js";
import {
  emptyRotationalCounts,
  incrementRotationalCount,
  parseRotationalCounts,
} from "../../domain/snapshot/rotational-counts.js";

class SnapshotService implements ISnapshotService {
  async createSnapshot(params: CreateSnapshotParams): Promise<{ snapshotId: string }> {
    const { houseId, triggerType, triggerMemberId, absenceId } = params;

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
        expense: {
          select: {
            payerMemberId: true,
          },
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

    const netPairs = aggregatePairwiseBalances(directedInputs);
    const rotationalCounts = await this.buildRotationalCounts(houseId, latestSnapshot);

    const snapshot = await prisma.$transaction(async (tx) => {
      const created = await tx.balanceSnapshot.create({
        data: {
          houseId,
          triggerType,
          triggerMemberId,
          absenceId: absenceId ?? null,
          rotationalCounts: rotationalCounts as Prisma.InputJsonValue,
        },
      });

      if (netPairs.length > 0) {
        await tx.balanceSnapshotEntry.createMany({
          data: netPairs.map((pair) => ({
            snapshotId: created.id,
            creditorMemberId: pair.creditorMemberId,
            debtorMemberId: pair.debtorMemberId,
            netAmount: pair.netAmount,
          })),
        });
      }

      return created;
    });

    return { snapshotId: snapshot.id };
  }

  async createMemberJoinSnapshot(
    houseId: string,
    newMemberId: string
  ): Promise<{ snapshotId: string }> {
    return this.createSnapshot({
      houseId,
      triggerType: SnapshotTriggerType.MEMBER_JOIN,
      triggerMemberId: newMemberId,
    });
  }

  private async buildRotationalCounts(
    houseId: string,
    latestSnapshot: Prisma.BalanceSnapshotGetPayload<object> | null
  ) {
    const counts = latestSnapshot
      ? parseRotationalCounts(latestSnapshot.rotationalCounts)
      : emptyRotationalCounts();

    const since = latestSnapshot?.createdAt;
    const rotationalExpenses = await prisma.expense.findMany({
      where: {
        houseId,
        expenseType: ExpenseType.ROTATIONAL,
        rotationalTypeId: { not: null },
        ...(since ? { createdAt: { gt: since } } : {}),
      },
      select: {
        rotationalTypeId: true,
        payerMemberId: true,
      },
    });

    for (const expense of rotationalExpenses) {
      if (!expense.rotationalTypeId) continue;
      incrementRotationalCount(
        counts,
        expense.rotationalTypeId,
        expense.payerMemberId
      );
    }

    return counts;
  }
}

export const snapshotService: ISnapshotService = new SnapshotService();
