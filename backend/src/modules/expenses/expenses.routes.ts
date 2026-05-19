import { Router } from "express";
import { authGuard } from "../common/authGuard.js";
import { asyncHandler } from "../common/asyncHandler.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../common/validate.js";
import {
  createExpenseHandler,
  getExpenseHandler,
  listExpensesHandler,
} from "./expenses.controller.js";
import {
  createExpenseSchema,
  expenseIdParamsSchema,
  houseIdParamsSchema,
  listExpensesQuerySchema,
} from "./expenses.validators.js";

const router = Router();

router.use(authGuard);

router.post(
  "/houses/:houseId/expenses",
  validateParams(houseIdParamsSchema),
  validateBody(createExpenseSchema),
  asyncHandler(createExpenseHandler)
);

router.get(
  "/houses/:houseId/expenses",
  validateParams(houseIdParamsSchema),
  validateQuery(listExpensesQuerySchema),
  asyncHandler(listExpensesHandler)
);

router.get(
  "/houses/:houseId/expenses/:expenseId",
  validateParams(expenseIdParamsSchema),
  asyncHandler(getExpenseHandler)
);

export default router;
