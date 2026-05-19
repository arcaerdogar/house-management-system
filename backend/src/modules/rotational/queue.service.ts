import { ExpenseType } from "@prisma/client";
import { prisma } from "../../config/db.js";
import {
  emptyRotationalCounts,
  parseRotationalCounts,
} from "../../domain/snapshot/rotational-counts.js";
import { datesOverlap, todayUtcDateOnly } from "../../domain/snapshot/date-utils.js";
import { HttpError } from "../common/errors.js";
import { toMemberSummary } from "./rotational.dto.js";

export interface QueueComputation {
  counts: Record<string, number>;
  nextMemberId: string;
  nextInQueue: ReturnType<typeof toMemberSummary>;
}

interface MemberCandidate {
  memberId: string;
  count: number;
  lastExpenseDate: Date | null;
  joinedAt: Date;
}

/**
 * PRD 5.1 — next-in-queue for a rotational expense type.
 * @param asOfDate UTC date-only used for absence filtering when respectsAbsence is true
 */
export async function computeRotationalQueue(
  houseId: string,
  rotationalTypeId: string,
  respectsAbsence: boolean,
  asOfDate: Date = todayUtcDateOnly()
): Promise<QueueComputation> {
  const latestSnapshot = await prisma.balanceSnapshot.findFirst({
    where: { houseId },
    orderBy: { createdAt: "desc" },
  });

  const snapshotCounts = latestSnapshot
    ? parseRotationalCounts(latestSnapshot.rotationalCounts)
    : emptyRotationalCounts();

  const typeCounts = { ...(snapshotCounts[rotationalTypeId] ?? {}) };

  const since = latestSnapshot?.createdAt ?? null;
  const postSnapshotExpenses = await prisma.expense.findMany({
    where: {
      houseId,
      rotationalTypeId,
      expenseType: ExpenseType.ROTATIONAL,
      ...(since ? { createdAt: { gt: since } } : {}),
    },
    select: {
      payerMemberId: true,
      expenseDate: true,
    },
    orderBy: { expenseDate: "asc" },
  });

  const lastExpenseByMember = new Map<string, Date>();
  for (const expense of postSnapshotExpenses) {
    typeCounts[expense.payerMemberId] =
      (typeCounts[expense.payerMemberId] ?? 0) + 1;
    const existing = lastExpenseByMember.get(expense.payerMemberId);
    if (!existing || expense.expenseDate.getTime() > existing.getTime()) {
      lastExpenseByMember.set(expense.payerMemberId, expense.expenseDate);
    }
  }

  const members = await prisma.houseMember.findMany({
    where: { houseId, isActive: true },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });

  let eligibleMemberIds = members.map((member) => member.id);

  if (respectsAbsence) {
    const absences = await prisma.absence.findMany({
      where: {
        houseId,
        startDate: { lte: asOfDate },
        endDate: { gte: asOfDate },
      },
    });
    const absentIds = new Set(absences.map((absence) => absence.memberId));
    eligibleMemberIds = eligibleMemberIds.filter((id) => !absentIds.has(id));
  }

  if (eligibleMemberIds.length === 0) {
    throw HttpError.badRequest(
      "No eligible members in queue (all absent or inactive).",
      "ROTATIONAL_QUEUE_EMPTY"
    );
  }

  const candidates: MemberCandidate[] = eligibleMemberIds.map((memberId) => {
    const member = members.find((m) => m.id === memberId)!;
    return {
      memberId,
      count: typeCounts[memberId] ?? 0,
      lastExpenseDate: lastExpenseByMember.get(memberId) ?? null,
      joinedAt: member.joinedAt,
    };
  });

  candidates.sort(compareQueueCandidates);
  const nextMemberId = candidates[0]!.memberId;
  const nextMember = members.find((member) => member.id === nextMemberId)!;

  return {
    counts: typeCounts,
    nextMemberId,
    nextInQueue: toMemberSummary(nextMember),
  };
}

function compareQueueCandidates(a: MemberCandidate, b: MemberCandidate): number {
  if (a.count !== b.count) {
    return a.count - b.count;
  }

  if (a.count === 0 && b.count === 0) {
    return a.joinedAt.getTime() - b.joinedAt.getTime();
  }

  const aLast = a.lastExpenseDate?.getTime() ?? 0;
  const bLast = b.lastExpenseDate?.getTime() ?? 0;
  if (aLast !== bLast) {
    return aLast - bLast;
  }

  return a.joinedAt.getTime() - b.joinedAt.getTime();
}

/** True when member has an active absence on the given date (UTC date-only). */
export async function isMemberAbsentOnDate(
  houseId: string,
  memberId: string,
  expenseDate: Date
): Promise<boolean> {
  const absences = await prisma.absence.findMany({
    where: {
      houseId,
      memberId,
    },
  });

  return absences.some((absence) =>
    datesOverlap(expenseDate, expenseDate, absence.startDate, absence.endDate)
  );
}
