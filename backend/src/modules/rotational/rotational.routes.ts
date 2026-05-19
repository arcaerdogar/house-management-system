import { Router } from "express";
import { authGuard } from "../common/authGuard.js";
import { asyncHandler } from "../common/asyncHandler.js";
import { validateBody, validateParams } from "../common/validate.js";
import {
  createRotationalTypeHandler,
  listRotationalTypesHandler,
  updateRotationalTypeHandler,
} from "./rotational.controller.js";
import {
  createRotationalTypeSchema,
  houseIdParamSchema,
  rotationalTypeParamSchema,
  updateRotationalTypeSchema,
} from "./rotational.validators.js";

const router = Router({ mergeParams: true });

router.post(
  "/",
  authGuard,
  validateParams(houseIdParamSchema),
  validateBody(createRotationalTypeSchema),
  asyncHandler(createRotationalTypeHandler)
);

router.get(
  "/",
  authGuard,
  validateParams(houseIdParamSchema),
  asyncHandler(listRotationalTypesHandler)
);

router.patch(
  "/:typeId",
  authGuard,
  validateParams(rotationalTypeParamSchema),
  validateBody(updateRotationalTypeSchema),
  asyncHandler(updateRotationalTypeHandler)
);

export default router;
