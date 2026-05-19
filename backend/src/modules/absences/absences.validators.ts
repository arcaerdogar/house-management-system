import { z } from "zod";

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date string");

const dateRangeRefinement = (
  data: { startDate: string; endDate: string },
  ctx: z.RefinementCtx
) => {
  if (data.startDate > data.endDate) {
    ctx.addIssue({
      code: "custom",
      message: "startDate must be on or before endDate",
      path: ["endDate"],
    });
  }
};

export const createAbsenceSchema = z
  .object({
    startDate: dateOnlySchema,
    endDate: dateOnlySchema,
  })
  .superRefine(dateRangeRefinement);

export const updateAbsenceSchema = z
  .object({
    startDate: dateOnlySchema.optional(),
    endDate: dateOnlySchema.optional(),
  })
  .refine(
    (data) => data.startDate !== undefined || data.endDate !== undefined,
    {
      message: "At least one of startDate or endDate is required",
    }
  )
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      ctx.addIssue({
        code: "custom",
        message: "startDate must be on or before endDate",
        path: ["endDate"],
      });
    }
  });

export const houseIdParamsSchema = z.object({
  houseId: z.string().uuid(),
});

export const absenceIdParamsSchema = z.object({
  absenceId: z.string().uuid(),
});
