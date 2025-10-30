import express from "express";
import CoSoDichVuCongController from "../controllers/co-so-dich-vu-cong.controller.js";
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import ROLE from '../constants/role.constant.js';
import { CreateCoSoDichVuCongRequest, UpdateCoSoDichVuCongRequest } from "../validators/co-so-dich-vu-cong.validator.js";

const coSoDichVuCongRoute = express.Router();

coSoDichVuCongRoute.get(
    "",
    CoSoDichVuCongController.getAll
);

coSoDichVuCongRoute.post(
    "",
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(CreateCoSoDichVuCongRequest),
    CoSoDichVuCongController.create
);

coSoDichVuCongRoute.get(
    "/:id",
    CoSoDichVuCongController.findById
);

coSoDichVuCongRoute.put(
    "/:id",
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(UpdateCoSoDichVuCongRequest),
    CoSoDichVuCongController.update
);

coSoDichVuCongRoute.delete(
    "/:id",
    authenticate,
    authorize([ROLE.ADMIN]),
    CoSoDichVuCongController.delete
);

export default coSoDichVuCongRoute;