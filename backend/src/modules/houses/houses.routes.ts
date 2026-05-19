import { Router } from "express";
import { authGuard } from "../common/authGuard.js";
import { asyncHandler } from "../common/asyncHandler.js";
import { validateBody, validateParams } from "../common/validate.js";
import {
  createHouseHandler,
  getHouseHandler,
  joinHouseHandler,
  listHouseMembersHandler,
  removeHouseMemberHandler,
} from "./houses.controller.js";
import {
  createHouseSchema,
  houseIdParamSchema,
  joinHouseSchema,
  removeMemberParamSchema,
} from "./houses.validators.js";
import rotationalRouter from "../rotational/rotational.routes.js";

const router = Router();

router.post(
  "/",
  authGuard,
  validateBody(createHouseSchema),
  asyncHandler(createHouseHandler)
);

router.post(
  "/join",
  authGuard,
  validateBody(joinHouseSchema),
  asyncHandler(joinHouseHandler)
);

router.get(
  "/:houseId",
  authGuard,
  validateParams(houseIdParamSchema),
  asyncHandler(getHouseHandler)
);

router.get(
  "/:houseId/members",
  authGuard,
  validateParams(houseIdParamSchema),
  asyncHandler(listHouseMembersHandler)
);

router.delete(
  "/:houseId/members/:memberId",
  authGuard,
  validateParams(removeMemberParamSchema),
  asyncHandler(removeHouseMemberHandler)
);

router.use("/:houseId/rotational-types", rotationalRouter);

export default router;
