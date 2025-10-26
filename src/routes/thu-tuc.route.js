import express from "express";
import ThuTucController from "../controllers/thu-tuc.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { SearchThuTucQuery } from "../validators/thu-tuc.validator.js";

const thuTucRoute = express.Router();

thuTucRoute.get(
  "",
  validate(SearchThuTucQuery, "query"),
  ThuTucController.search
);

export default thuTucRoute;
