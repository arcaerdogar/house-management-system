import { Router } from "express";
import { authGuard } from "../common/authGuard.js";
import { asyncHandler } from "../common/asyncHandler.js";
import {
  validateParams,
  validateQuery,
} from "../common/validate.js";
import {
  getDashboardHandler,
  getMemberDebtDetailHandler,
  listActivityHandler,
} from "./dashboard.controller.js";
import {
  activityQuerySchema,
  dashboardMemberParamsSchema,
  houseIdParamsSchema,
} from "./dashboard.validators.js";

const router = Router();

router.use(authGuard);

router.get(
  "/houses/:houseId/dashboard",
  validateParams(houseIdParamsSchema),
  asyncHandler(getDashboardHandler)
);

router.get(
  "/houses/:houseId/dashboard/:memberId",
  validateParams(dashboardMemberParamsSchema),
  asyncHandler(getMemberDebtDetailHandler)
);

router.get(
  "/houses/:houseId/activity",
  validateParams(houseIdParamsSchema),
  validateQuery(activityQuerySchema),
  asyncHandler(listActivityHandler)
);

export default router;
