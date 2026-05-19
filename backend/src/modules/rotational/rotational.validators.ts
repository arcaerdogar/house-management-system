import { z } from "zod";

const decimalAmountSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a positive decimal with up to 2 places")
  .refine((value) => Number(value) > 0, "Amount must be greater than zero");

export const houseIdParamSchema = z.object({
  houseId: z.uuid(),
});

export const rotationalTypeParamSchema = z.object({
  houseId: z.uuid(),
  typeId: z.uuid(),
});

export const createRotationalTypeSchema = z.object({
  title: z.string().trim().min(1).max(120),
  respectsAbsence: z.boolean().optional(),
});

export const updateRotationalTypeSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    respectsAbsence: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.respectsAbsence !== undefined ||
      value.isActive !== undefined,
    { message: "At least one field must be provided" }
  );

export const createRotationalExpenseSchema = z.object({
  expenseType: z.literal("ROTATIONAL"),
  rotationalTypeId: z.uuid(),
  amount: decimalAmountSchema,
  description: z.string().trim().min(1).max(500),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  respectsAbsence: z.boolean().optional(),
  allowOverride: z.boolean().optional(),
});
