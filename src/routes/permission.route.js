import experss from "express";
import PermissionController from "../controllers/permission.controller.js";
import { logAuthMiddleware } from "../middlewares/auth.middleware.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { PERMISSION } from "../constants/permission.constant.js";

const permissionRouter = experss.Router();

permissionRouter.get(
  "/",
  authenticate,
  authorize([PERMISSION.PERM_GET_ALL]),
  PermissionController.getAllPermissions
);

permissionRouter.post(
  "/sync",
  logAuthMiddleware,
  PermissionController.syncPermissions
);

permissionRouter.get(
  "/cate",
  authenticate,
  PermissionController.getPermissionCategories
);

export default permissionRouter;
