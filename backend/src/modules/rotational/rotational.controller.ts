import type { Request, Response } from "express";
import {
  isRotationalQueueMismatchError,
  ROTATIONAL_QUEUE_MISMATCH_CODE,
} from "./rotational.errors.js";
import { createRotationalExpense } from "./rotational-expense.service.js";
import {
  createRotationalType,
  listRotationalTypes,
  updateRotationalType,
} from "./rotational.service.js";

export async function createRotationalTypeHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId } = req.params as { houseId: string };
  const body = (req as any).body as {
    title: string;
    respectsAbsence?: boolean;
  };

  const type = await createRotationalType(houseId, userId, body);
  res.status(201).json(type);
}

export async function listRotationalTypesHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId } = req.params as { houseId: string };
  const types = await listRotationalTypes(houseId, userId);
  res.json(types);
}

export async function updateRotationalTypeHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId, typeId } = req.params as {
    houseId: string;
    typeId: string;
  };
  const body = (req as any).body as {
    title?: string;
    respectsAbsence?: boolean;
    isActive?: boolean;
  };

  const type = await updateRotationalType(houseId, typeId, userId, body);
  res.json(type);
}

/** Mount on POST /houses/:houseId/expenses when expenseType is ROTATIONAL (orchestrator / expense agent). */
export async function createRotationalExpenseHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId } = req.params as { houseId: string };
  const body = (req as any).body as {
    rotationalTypeId: string;
    amount: string;
    description: string;
    expenseDate: string;
    respectsAbsence?: boolean;
    allowOverride?: boolean;
  };

  try {
    const expense = await createRotationalExpense(houseId, userId, body);
    res.status(201).json(expense);
  } catch (error) {
    if (isRotationalQueueMismatchError(error)) {
      return res.status(409).json({
        error: ROTATIONAL_QUEUE_MISMATCH_CODE,
        message: error.message,
        allowOverride: true,
        expectedMemberId: error.expectedMemberId,
        nextInQueue: error.nextInQueue,
      });
    }
    throw error;
  }
}
