import express from "express";
import LinhVucController from "../controllers/linh-vuc.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import ROLE from "../constants/role.constant.js";
import validate from "../middlewares/validate.middleware.js";
import { CreateLinhVucRequest, UpdateLinhVucRequest } from "../validators/linh-vuc.validator.js";

const linhVucRoute = express.Router();

linhVucRoute.get("/", LinhVucController.getAll);

linhVucRoute.post(
    "/",
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(CreateLinhVucRequest),
    LinhVucController.create
);

linhVucRoute.put(
    "/:id",
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(UpdateLinhVucRequest),
    LinhVucController.update
);

linhVucRoute.delete(
    "/:id",
    authenticate,
    authorize([ROLE.ADMIN]),
    LinhVucController.hardDelete
);

export default linhVucRoute;