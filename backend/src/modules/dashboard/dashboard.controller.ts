import type { Request, Response } from "express";
import { ExpenseType } from "@housemate/shared";
import {
  getDashboardSummary,
  getMemberDebtDetail,
  listActivity,
} from "./dashboard.service.js";

export async function getDashboardHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId } = req.params as { houseId: string };

  const summary = await getDashboardSummary(houseId, userId);
  res.json(summary);
}

export async function getMemberDebtDetailHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId, memberId } = req.params as {
    houseId: string;
    memberId: string;
  };

  const detail = await getMemberDebtDetail(houseId, userId, memberId);
  res.json(detail);
}

export async function listActivityHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId } = req.params as { houseId: string };
  const query =
    (req as { validatedQuery?: Record<string, string> }).validatedQuery ?? {};

  const items = await listActivity(houseId, userId, {
    ...(query.type ? { type: query.type as ExpenseType } : {}),
    ...(query.from ? { from: query.from } : {}),
    ...(query.to ? { to: query.to } : {}),
    ...(query.memberId ? { memberId: query.memberId } : {}),
  });
  res.json(items);
}
