import { Router } from "express";
import { authGuard } from "../common/authGuard.js";
import { asyncHandler } from "../common/asyncHandler.js";
import { validateBody, validateParams } from "../common/validate.js";
import {
  createHouseAbsence,
  listAbsences,
  patchAbsence,
  removeAbsence,
} from "./absences.controller.js";
import {
  absenceIdParamsSchema,
  createAbsenceSchema,
  houseIdParamsSchema,
  updateAbsenceSchema,
} from "./absences.validators.js";

const router = Router();

router.use(authGuard);

router.post(
  "/houses/:houseId/absences",
  validateParams(houseIdParamsSchema),
  validateBody(createAbsenceSchema),
  asyncHandler(createHouseAbsence)
);

router.get(
  "/houses/:houseId/absences",
  validateParams(houseIdParamsSchema),
  asyncHandler(listAbsences)
);

router.patch(
  "/absences/:absenceId",
  validateParams(absenceIdParamsSchema),
  validateBody(updateAbsenceSchema),
  asyncHandler(patchAbsence)
);

router.delete(
  "/absences/:absenceId",
  validateParams(absenceIdParamsSchema),
  asyncHandler(removeAbsence)
);

export default router;
