import { RegularExpensePeriod } from "@housemate/shared";
import { z } from "zod";

export const houseIdParamsSchema = z.object({
  houseId: z.string().uuid(),
});

export const templateIdParamsSchema = z.object({
  houseId: z.string().uuid(),
  templateId: z.string().uuid(),
});

export const createTemplateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  responsibleMemberId: z.string().uuid(),
  period: z.enum([RegularExpensePeriod.WEEKLY, RegularExpensePeriod.MONTHLY]),
  respectsAbsence: z.boolean().optional(),
});

export const updateTemplateSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    responsibleMemberId: z.string().uuid().optional(),
    period: z
      .enum([RegularExpensePeriod.WEEKLY, RegularExpensePeriod.MONTHLY])
      .optional(),
    respectsAbsence: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.responsibleMemberId !== undefined ||
      data.period !== undefined ||
      data.respectsAbsence !== undefined ||
      data.isActive !== undefined,
    { message: "At least one field is required" }
  );
