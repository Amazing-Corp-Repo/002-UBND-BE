import prisma from "../config/database.config.js";

const NotificationRepository = {
  async createNotification(data) {
    return await prisma.notifications.create({
      data,
    });
  },

  async getNotificationsByUserId(userId, page, size) {
    const skip = (page - 1) * size;
    let [data, totalItems] = await prisma.$transaction([
      prisma.notifications.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        skip: skip,
        take: size,
      }),
      prisma.notifications.count({
        where: { user_id: userId },
      }),
    ]);
    return { data, totalItems };
  },

  async markAllNotificationsAsRead(userId) {
    return await prisma.notifications.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date().toISOString(),
      },
    });
  },

  async getNotificationById(notificationId) {
    return await prisma.notifications.findUnique({
      where: { id: notificationId },
    });
  },

  async deleteNotificationById(notificationId) {
    return await prisma.notifications.delete({
      where: { id: notificationId },
    });
  }
};

export default NotificationRepository;
