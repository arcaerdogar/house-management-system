import { ExpenseType } from "@housemate/shared";
import { z } from "zod";

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date string");

const amountSchema = z
  .union([z.string(), z.number()])
  .transform((value, ctx) => {
    const raw = typeof value === "number" ? value.toString() : value.trim();
    if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
      ctx.addIssue({
        code: "custom",
        message: "amount must be a positive decimal with up to 2 fraction digits",
      });
      return z.NEVER;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "amount must be greater than zero",
      });
      return z.NEVER;
    }
    return parsed;
  });

export const houseIdParamsSchema = z.object({
  houseId: z.string().uuid(),
});

export const expenseIdParamsSchema = z.object({
  houseId: z.string().uuid(),
  expenseId: z.string().uuid(),
});

export const createExpenseSchema = z
  .object({
    expenseType: z.enum([
      ExpenseType.INSTANT,
      ExpenseType.REGULAR,
      ExpenseType.ROTATIONAL,
    ]),
    amount: amountSchema,
    description: z.string().trim().min(1).max(500),
    expenseDate: dateOnlySchema,
    respectsAbsence: z.boolean().optional(),
    excludedMemberIds: z.array(z.string().uuid()).optional(),
    templateId: z.string().uuid().optional(),
    rotationalTypeId: z.string().uuid().optional(),
    allowOverride: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.expenseType === ExpenseType.ROTATIONAL) {
      if (!data.rotationalTypeId) {
        ctx.addIssue({
          code: "custom",
          message: "rotationalTypeId is required for ROTATIONAL expenses",
          path: ["rotationalTypeId"],
        });
      }
      if (data.templateId) {
        ctx.addIssue({
          code: "custom",
          message: "templateId is not allowed for ROTATIONAL expenses",
          path: ["templateId"],
        });
      }
      if (data.excludedMemberIds && data.excludedMemberIds.length > 0) {
        ctx.addIssue({
          code: "custom",
          message: "excludedMemberIds is not allowed for ROTATIONAL expenses",
          path: ["excludedMemberIds"],
        });
      }
      return;
    }

    if (data.rotationalTypeId) {
      ctx.addIssue({
        code: "custom",
        message: "rotationalTypeId is only allowed for ROTATIONAL expenses",
        path: ["rotationalTypeId"],
      });
    }
    if (data.allowOverride !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: "allowOverride is only allowed for ROTATIONAL expenses",
        path: ["allowOverride"],
      });
    }
    if (data.expenseType === ExpenseType.REGULAR && !data.templateId) {
      ctx.addIssue({
        code: "custom",
        message: "templateId is required for REGULAR expenses",
        path: ["templateId"],
      });
    }
    if (data.expenseType === ExpenseType.INSTANT && data.templateId) {
      ctx.addIssue({
        code: "custom",
        message: "templateId is only allowed for REGULAR expenses",
        path: ["templateId"],
      });
    }
  });

export const listExpensesQuerySchema = z.object({
  type: z.enum([ExpenseType.INSTANT, ExpenseType.REGULAR, ExpenseType.ROTATIONAL]).optional(),
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
  memberId: z.string().uuid().optional(),
});
