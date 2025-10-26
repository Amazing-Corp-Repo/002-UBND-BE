import express from "express";
import UyBanController from "../controllers/uy-ban.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import ROLE from "../constants/role.constant.js";
import validate from "../middlewares/validate.middleware.js";
import { CreateUyBanRequest, UpdateUyBanRequest } from "../validators/uy-ban.validator.js";

const uyBanRouter = express.Router();

uyBanRouter.post("/", authenticate, authorize([ROLE.ADMIN]),  validate(CreateUyBanRequest), UyBanController.create);
uyBanRouter.get("/", UyBanController.getFrist);
uyBanRouter.put("/:id", authenticate, authorize([ROLE.ADMIN]), validate(UpdateUyBanRequest), UyBanController.update);

export default uyBanRouter;