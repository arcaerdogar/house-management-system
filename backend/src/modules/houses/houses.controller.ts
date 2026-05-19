import type { Request, Response } from "express";
import {
  createHouse,
  getHouse,
  joinHouse,
  listHouseMembers,
  removeHouseMember,
} from "./houses.service.js";

export async function createHouseHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { name } = (req as any).body as { name: string };
  const house = await createHouse(userId, name);
  res.status(201).json(house);
}

export async function joinHouseHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { inviteCode } = (req as any).body as { inviteCode: string };
  const member = await joinHouse(userId, inviteCode);
  res.status(201).json(member);
}

export async function getHouseHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId } = req.params as { houseId: string };
  const house = await getHouse(houseId, userId);
  res.json(house);
}

export async function listHouseMembersHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId } = req.params as { houseId: string };
  const members = await listHouseMembers(houseId, userId);
  res.json(members);
}

export async function removeHouseMemberHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId, memberId } = req.params as {
    houseId: string;
    memberId: string;
  };
  await removeHouseMember(houseId, userId, memberId);
  res.status(204).send();
}
