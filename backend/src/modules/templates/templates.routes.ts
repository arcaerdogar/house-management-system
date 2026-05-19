import { Router } from "express";
import { authGuard } from "../common/authGuard.js";
import { asyncHandler } from "../common/asyncHandler.js";
import { validateBody, validateParams } from "../common/validate.js";
import {
  createTemplateHandler,
  deleteTemplateHandler,
  listTemplatesHandler,
  patchTemplateHandler,
} from "./templates.controller.js";
import {
  createTemplateSchema,
  houseIdParamsSchema,
  templateIdParamsSchema,
  updateTemplateSchema,
} from "./templates.validators.js";

const router = Router();

router.use(authGuard);

router.post(
  "/houses/:houseId/templates",
  validateParams(houseIdParamsSchema),
  validateBody(createTemplateSchema),
  asyncHandler(createTemplateHandler)
);

router.get(
  "/houses/:houseId/templates",
  validateParams(houseIdParamsSchema),
  asyncHandler(listTemplatesHandler)
);

router.patch(
  "/houses/:houseId/templates/:templateId",
  validateParams(templateIdParamsSchema),
  validateBody(updateTemplateSchema),
  asyncHandler(patchTemplateHandler)
);

router.delete(
  "/houses/:houseId/templates/:templateId",
  validateParams(templateIdParamsSchema),
  asyncHandler(deleteTemplateHandler)
);

export default router;
