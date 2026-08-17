import express from "express";
import ReceptionRatingController from "../controllers/reception-rating.controller.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import { receptionAudit } from "../middlewares/reception-audit.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { CreateReceptionRatingRequest } from "../validators/reception-rating.validator.js";

const receptionRatingRouter = express.Router();

receptionRatingRouter.get(
  "/configuration",
  ReceptionRatingController.getConfiguration
);

receptionRatingRouter.post(
  "/",
  validate(CreateReceptionRatingRequest),
  receptionAudit(AUDIT_LOGS.CREATE, { tableName: "danh_gia_tiep_dan" }),
  ReceptionRatingController.create
);

export default receptionRatingRouter;
