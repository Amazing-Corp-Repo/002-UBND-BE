import express from "express";
import ReceptionRatingController from "../controllers/reception-rating.controller.js";

const receptionRatingRouter = express.Router();

receptionRatingRouter.get(
  "/configuration",
  ReceptionRatingController.getConfiguration
);

export default receptionRatingRouter;
