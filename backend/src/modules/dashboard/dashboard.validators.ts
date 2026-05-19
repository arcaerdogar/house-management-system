import { ExpenseType } from "@housemate/shared";
import { z } from "zod";

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date string");

export const houseIdParamsSchema = z.object({
  houseId: z.string().uuid(),
});

export const dashboardMemberParamsSchema = z.object({
  houseId: z.string().uuid(),
  memberId: z.string().uuid(),
});

export const activityQuerySchema = z.object({
  type: z
    .enum([ExpenseType.INSTANT, ExpenseType.REGULAR, ExpenseType.ROTATIONAL])
    .optional(),
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
  memberId: z.string().uuid().optional(),
});
