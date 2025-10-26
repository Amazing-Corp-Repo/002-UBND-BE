import express from "express";
import ThuTucController from "../controllers/thu-tuc.controller.js";

const thuTucRoute = express.Router();

thuTucRoute.get(
  "",
  ThuTucController.search
);

thuTucRoute.get('/:id/mau-don', ThuTucController.getMauDonByThuTucId);

export default thuTucRoute;