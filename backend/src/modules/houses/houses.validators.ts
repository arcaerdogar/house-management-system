import { z } from "zod";

export const createHouseSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const joinHouseSchema = z.object({
  inviteCode: z.string().trim().min(1).max(32),
});

export const houseIdParamSchema = z.object({
  houseId: z.uuid(),
});

export const removeMemberParamSchema = z.object({
  houseId: z.uuid(),
  memberId: z.uuid(),
});
