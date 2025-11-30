import NotificationService from "../services/notification.service.js";
import { successResponse } from "../utils/response.util.js";

const NotificationController = {
  async getAllNotificationsByUserId(req, res) {
    const userId = req.payload.userId;
    let { page, size } = req.query;
    page = parseInt(page) || 1;
    size = parseInt(size) || 10;
    let result = await NotificationService.getAllNotificationsByUserId(
      userId,
      page,
      size
    );
    return successResponse(
      res,
      result.data,
      "Lấy danh sách thông báo thành công",
      result.pagination
    );
  },

  async markAllNotificationsAsRead(req, res) {
    const userId = req.payload.userId;
    await NotificationService.markAllNotificationsAsRead(userId);
    return successResponse(res, null, "Đánh dấu tất cả thông báo đã đọc thành công");
  },

  async deleteNotificationById(req, res) {
    const userId = req.payload.userId;
    const notificationId = req.params.id;
    await NotificationService.deleteNotificationById(notificationId, userId);
    return successResponse(res, null, "Xóa thông báo thành công");
  },
  
  async markNotificationAsRead(req, res) {
    const userId = req.payload.userId;
    const notificationId = req.params.id;
    await NotificationService.markNotificationAsRead(notificationId, userId);
    return successResponse(res, null, "Đánh dấu thông báo đã đọc thành công");
  },
};

export default NotificationController;
