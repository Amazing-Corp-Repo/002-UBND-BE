import NotificationRepository from "../repositories/notification.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";

const NotificationService = {
  async getAllNotificationsByUserId(userId, page, size) {
    let { data, totalItems } =
      await NotificationRepository.getNotificationsByUserId(userId, page, size);

    let pagination = createPagination(page, size, totalItems);
    return { data, pagination };
  },
  
  async markAllNotificationsAsRead(userId) {
    return await NotificationRepository.markAllNotificationsAsRead(userId);
  },

  async deleteNotificationById(notificationId, userId) {
    const notification = await NotificationRepository.getNotificationById(notificationId);
    if (!notification || notification.user_id !== userId) {
      throw new BaseError(403, "Bạn không có quyền xóa thông báo này");
    }
    return await NotificationRepository.deleteNotificationById(notificationId);
  },
};

export default NotificationService;
