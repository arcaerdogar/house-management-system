import type { Request, Response } from "express";
import { ExpenseType } from "@housemate/shared";
import { createRotationalExpenseHandler } from "../rotational/rotational.controller.js";
import {
  createExpense,
  getExpense,
  listExpenses,
} from "./expenses.service.js";

export async function createExpenseHandler(req: Request, res: Response) {
  const body = (req as any).body as {
    expenseType: ExpenseType;
    rotationalTypeId?: string;
    amount: number;
    [key: string]: unknown;
  };

  if (
    body.expenseType === ExpenseType.ROTATIONAL &&
    body.rotationalTypeId
  ) {
    (req as any).body = {
      ...body,
      amount:
        typeof body.amount === "number"
          ? body.amount.toFixed(2)
          : String(body.amount),
    };
    return createRotationalExpenseHandler(req, res);
  }

  const userId = (req as any).user.id as string;
  const { houseId } = req.params as { houseId: string };

  const expense = await createExpense(
    houseId,
    userId,
    body as Parameters<typeof createExpense>[2]
  );
  res.status(201).json(expense);
}

export async function listExpensesHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId } = req.params as { houseId: string };
  const query = (req as { validatedQuery?: Record<string, string> }).validatedQuery ?? {};

  const expenses = await listExpenses(houseId, userId, {
    ...(query.type ? { type: query.type as ExpenseType } : {}),
    ...(query.from ? { from: query.from } : {}),
    ...(query.to ? { to: query.to } : {}),
    ...(query.memberId ? { memberId: query.memberId } : {}),
  });
  res.json(expenses);
}

export async function getExpenseHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId, expenseId } = req.params as {
    houseId: string;
    expenseId: string;
  };

  const expense = await getExpense(houseId, expenseId, userId);
  res.json(expense);
}
