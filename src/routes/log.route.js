import express from "express";
import LogController from "../controllers/log.controller.js";
import { logAuthMiddleware } from "../middlewares/auth.middleware.js";

const logRouter = express.Router();

logRouter.get(
    "",
    logAuthMiddleware,
    LogController.getLogList
);

logRouter.get(
    "/view/:fileName",
    logAuthMiddleware,
    LogController.getLogFile
);

logRouter.get(
    "/download/:fileName",
    logAuthMiddleware,
    LogController.downloadLogFile
);

export default logRouter;