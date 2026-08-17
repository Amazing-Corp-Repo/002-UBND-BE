import express from "express";
import ReceptionRatingController from "../controllers/reception-rating.controller.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import { receptionAudit } from "../middlewares/reception-audit.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreateReceptionRatingRequest,
  GetReceptionRatingsQuery,
  ReceptionRatingIdParams,
} from "../validators/reception-rating.validator.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { PERMISSION } from "../constants/permission.constant.js";
import validateQuery from "../middlewares/validate-query.middleware.js";
import validateParams from "../middlewares/validate-params.middleware.js";

const receptionRatingRouter = express.Router();

receptionRatingRouter.get(
  "/",
  authenticate,
  authorize([PERMISSION.RRT_GET_ALL]),
  validateQuery(GetReceptionRatingsQuery),
  ReceptionRatingController.getAll
);

receptionRatingRouter.get(
  "/configuration",
  ReceptionRatingController.getConfiguration
);

receptionRatingRouter.get(
  "/:id",
  authenticate,
  authorize([PERMISSION.RRT_GET_DETAIL]),
  validateParams(ReceptionRatingIdParams),
  ReceptionRatingController.getDetail
);

receptionRatingRouter.post(
  "/",
  validate(CreateReceptionRatingRequest),
  receptionAudit(AUDIT_LOGS.CREATE, { tableName: "danh_gia_tiep_dan" }),
  ReceptionRatingController.create
);

export default receptionRatingRouter;
