import express from "express";
import NotificationController from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const notificationRouter = express.Router();

notificationRouter.get(
  "/",
  authenticate,
  NotificationController.getAllNotificationsByUserId
);

notificationRouter.post(
  "/mark-all-read",
  authenticate,
  NotificationController.markAllNotificationsAsRead
);

notificationRouter.post(
  "/:id/mark-read",
  authenticate,
  NotificationController.markNotificationAsRead
);

notificationRouter.delete(
  "/:id",
  authenticate,
  NotificationController.deleteNotificationById
);

export default notificationRouter;