import { Router } from "express";
import { z } from "zod";
import { authGuard } from "../common/authGuard.js";
import { asyncHandler } from "../common/asyncHandler.js";
import { validateParams } from "../common/validate.js";
import { getLatestSnapshot, listSnapshots } from "./snapshots.controller.js";

const houseIdParamsSchema = z.object({
  houseId: z.string().uuid(),
});

const router = Router();

router.use(authGuard);

router.get(
  "/houses/:houseId/snapshots/latest",
  validateParams(houseIdParamsSchema),
  asyncHandler(getLatestSnapshot)
);

router.get(
  "/houses/:houseId/snapshots",
  validateParams(houseIdParamsSchema),
  asyncHandler(listSnapshots)
);

export default router;
