import type { Request, Response } from "express";
import { assertActiveMember } from "../absences/membership.js";
import { getLatestHouseSnapshot, listHouseSnapshots } from "./snapshots.service.js";

export async function listSnapshots(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId } = req.params as { houseId: string };

  await assertActiveMember(houseId, userId);
  const snapshots = await listHouseSnapshots(houseId);
  res.json(snapshots);
}

export async function getLatestSnapshot(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId } = req.params as { houseId: string };

  await assertActiveMember(houseId, userId);
  const snapshot = await getLatestHouseSnapshot(houseId);
  res.json(snapshot);
}
