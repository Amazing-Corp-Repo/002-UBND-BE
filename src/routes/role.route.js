import express from "express";
import RoleController from "../controllers/role.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { PERMISSION } from "../constants/permission.constant.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreateRoleRequest,
  UpdateRoleRequest,
  UpdateRoleStatusRequest,
} from "../validators/role.validator.js";

const roleRouter = express.Router();

roleRouter.post(
  "",
  authenticate,
  authorize([PERMISSION.ROLE_CREATE]),
  validate(CreateRoleRequest),
  RoleController.createRole
);

roleRouter.get("", RoleController.findAll);

roleRouter.get("/pagination", RoleController.findAllRolesWithPagination);

roleRouter.get("/:roleId", RoleController.getRoleDetails);

roleRouter.put(
  "/update-status/:roleId",
  authenticate,
  authorize([PERMISSION.ROLE_UPDATE_STATUS]),
  validate(UpdateRoleStatusRequest),
  RoleController.updateStatus
);

roleRouter.put(
  "/:roleId",
  authenticate,
  authorize([PERMISSION.ROLE_UPDATE]),
  validate(UpdateRoleRequest),
  RoleController.update
);

roleRouter.delete(
  "/:roleId",
  authenticate,
  authorize([PERMISSION.ROLE_DELETE]),
  RoleController.delete
);

export default roleRouter;
