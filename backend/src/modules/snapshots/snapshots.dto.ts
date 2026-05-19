import type { BalanceSnapshot, BalanceSnapshotEntry } from "@housemate/shared";
import type { Prisma } from "@prisma/client";

type SnapshotWithEntries = Prisma.BalanceSnapshotGetPayload<{
  include: {
    entries: true;
  };
}>;

export function decimalToString(value: Prisma.Decimal): string {
  return value.toFixed(2);
}

export function toBalanceSnapshotEntryDto(
  entry: Prisma.BalanceSnapshotEntryGetPayload<object>
): BalanceSnapshotEntry {
  return {
    id: entry.id,
    snapshotId: entry.snapshotId,
    creditorMemberId: entry.creditorMemberId,
    debtorMemberId: entry.debtorMemberId,
    netAmount: decimalToString(entry.netAmount),
  };
}

export function toBalanceSnapshotDto(
  snapshot: SnapshotWithEntries,
  options?: { includeEntries?: boolean }
): BalanceSnapshot {
  const rotationalCounts =
    snapshot.rotationalCounts &&
    typeof snapshot.rotationalCounts === "object" &&
    !Array.isArray(snapshot.rotationalCounts)
      ? (snapshot.rotationalCounts as BalanceSnapshot["rotationalCounts"])
      : {};

  const dto: BalanceSnapshot = {
    id: snapshot.id,
    houseId: snapshot.houseId,
    triggerType: snapshot.triggerType,
    triggerMemberId: snapshot.triggerMemberId,
    absenceId: snapshot.absenceId,
    rotationalCounts,
    createdAt: snapshot.createdAt.toISOString(),
  };

  if (options?.includeEntries) {
    dto.entries = snapshot.entries.map(toBalanceSnapshotEntryDto);
  }

  return dto;
}
