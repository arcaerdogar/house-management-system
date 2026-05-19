import { SnapshotTriggerType } from "@housemate/shared";
import { prisma } from "../../../config/db.js";
import {
  formatDateOnly,
  todayUtcDateOnly,
} from "../../../domain/snapshot/date-utils.js";
import { snapshotService } from "../../../modules/snapshots/index.js";

function yesterdayUtcDateOnly(): Date {
  const today = todayUtcDateOnly();
  return new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1)
  );
}

async function snapshotAlreadyExists(
  absenceId: string,
  triggerType: SnapshotTriggerType
): Promise<boolean> {
  const existing = await prisma.balanceSnapshot.findFirst({
    where: { absenceId, triggerType },
    select: { id: true },
  });
  return existing !== null;
}

/**
 * FR-2.5 / FR-2.6 — midnight UTC absence start/end snapshots.
 */
export async function processAbsenceSnapshotCron(): Promise<void> {
  const today = todayUtcDateOnly();
  const yesterday = yesterdayUtcDateOnly();

  const startingAbsences = await prisma.absence.findMany({
    where: { startDate: today },
    select: {
      id: true,
      houseId: true,
      memberId: true,
      startDate: true,
    },
  });

  for (const absence of startingAbsences) {
    if (
      await snapshotAlreadyExists(absence.id, SnapshotTriggerType.ABSENCE_START)
    ) {
      continue;
    }

    await snapshotService.createSnapshot({
      houseId: absence.houseId,
      triggerType: SnapshotTriggerType.ABSENCE_START,
      triggerMemberId: absence.memberId,
      absenceId: absence.id,
    });

    console.log(
      `[jobs] ABSENCE_START snapshot for absence ${absence.id} (${formatDateOnly(absence.startDate)})`
    );
  }

  const endingAbsences = await prisma.absence.findMany({
    where: { endDate: yesterday },
    select: {
      id: true,
      houseId: true,
      memberId: true,
      endDate: true,
    },
  });

  for (const absence of endingAbsences) {
    if (
      await snapshotAlreadyExists(absence.id, SnapshotTriggerType.ABSENCE_END)
    ) {
      continue;
    }

    await snapshotService.createSnapshot({
      houseId: absence.houseId,
      triggerType: SnapshotTriggerType.ABSENCE_END,
      triggerMemberId: absence.memberId,
      absenceId: absence.id,
    });

    console.log(
      `[jobs] ABSENCE_END snapshot for absence ${absence.id} (ended ${formatDateOnly(absence.endDate)})`
    );
  }
}
