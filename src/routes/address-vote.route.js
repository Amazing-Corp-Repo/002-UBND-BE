import express from "express";
import UPLOAD_TYPE from "../constants/upload.constant.js";
import { logAuthMiddleware } from "../middlewares/auth.middleware.js";
import { createUploader } from "../middlewares/upload.middleware.js";
import AddressVoteController from "../controllers/address-vote.controller.js";

const addressVoteRoute = express.Router();

addressVoteRoute.post(
  "/import",
  logAuthMiddleware,
  createUploader({
    type: UPLOAD_TYPE.ADDRESS_VOTE,
    fieldName: "file",
    maxCount: 1,
    maxSizeMB: 10,
    allowed_types: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ],
  }),
  AddressVoteController.uploadFileAddress,
);

export default addressVoteRoute;
