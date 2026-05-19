import { prisma } from "../../config/db.js";
import { HttpError } from "../common/errors.js";
import { toBalanceSnapshotDto } from "./snapshots.dto.js";

export async function listHouseSnapshots(houseId: string) {
  const snapshots = await prisma.balanceSnapshot.findMany({
    where: { houseId },
    orderBy: { createdAt: "desc" },
    include: { entries: true },
  });

  return snapshots.map((snapshot) => toBalanceSnapshotDto(snapshot));
}

export async function getLatestHouseSnapshot(houseId: string) {
  const snapshot = await prisma.balanceSnapshot.findFirst({
    where: { houseId },
    orderBy: { createdAt: "desc" },
    include: { entries: true },
  });

  if (!snapshot) {
    throw HttpError.notFound("No balance snapshot found for this house");
  }

  return toBalanceSnapshotDto(snapshot, { includeEntries: true });
}
