import type { Request, Response } from "express";
import {
  createAbsence,
  deleteAbsence,
  listHouseAbsences,
  updateAbsence,
} from "./absences.service.js";

export async function createHouseAbsence(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId } = req.params as { houseId: string };
  const body = (req as any).body as { startDate: string; endDate: string };

  const absence = await createAbsence(houseId, userId, body);
  res.status(201).json(absence);
}

export async function listAbsences(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId } = req.params as { houseId: string };

  const absences = await listHouseAbsences(houseId, userId);
  res.json(absences);
}

export async function patchAbsence(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { absenceId } = req.params as { absenceId: string };
  const body = (req as any).body as { startDate?: string; endDate?: string };

  const absence = await updateAbsence(absenceId, userId, body);
  res.json(absence);
}

export async function removeAbsence(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { absenceId } = req.params as { absenceId: string };

  await deleteAbsence(absenceId, userId);
  res.status(204).send();
}
