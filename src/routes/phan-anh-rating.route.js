import express from "express";
import PhanAnhRatingController from "../controllers/phan-anh-rating.controller.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import { PERMISSION } from "../constants/permission.constant.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import phanAnhRatingRateLimiter from "../middlewares/phan-anh-rating-rate-limit.middleware.js";
import { receptionAudit } from "../middlewares/reception-audit.middleware.js";
import validateParams from "../middlewares/validate-params.middleware.js";
import validateQuery from "../middlewares/validate-query.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreatePhanAnhRatingRequest,
  GetPhanAnhRatingStatisticsQuery,
  GetPhanAnhRatingsQuery,
  PhanAnhRatingCodeParams,
  PhanAnhRatingIdParams,
} from "../validators/phan-anh-rating.validator.js";

const phanAnhRatingRouter = express.Router();

phanAnhRatingRouter.get("/configuration", PhanAnhRatingController.getConfiguration);
phanAnhRatingRouter.get("/by-code/:complaintCode", validateParams(PhanAnhRatingCodeParams), PhanAnhRatingController.getByComplaintCode);

phanAnhRatingRouter.get(
  "/",
  authenticate,
  authorize([PERMISSION.PART_GET_ALL]),
  validateQuery(GetPhanAnhRatingsQuery),
  PhanAnhRatingController.getAll
);

phanAnhRatingRouter.get(
  "/statistics",
  authenticate,
  authorize([PERMISSION.PART_GET_STATS]),
  validateQuery(GetPhanAnhRatingStatisticsQuery),
  PhanAnhRatingController.getStatistics
);

phanAnhRatingRouter.get(
  "/:id",
  authenticate,
  authorize([PERMISSION.PART_GET_DETAIL]),
  validateParams(PhanAnhRatingIdParams),
  PhanAnhRatingController.getDetail
);

phanAnhRatingRouter.post(
  "/",
  phanAnhRatingRateLimiter,
  validate(CreatePhanAnhRatingRequest),
  receptionAudit(AUDIT_LOGS.CREATE, { tableName: "danh_gia_phan_anh" }),
  PhanAnhRatingController.create
);

export default phanAnhRatingRouter;
