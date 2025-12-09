import axios from "axios";
import env from "../../config/environment.config.js";

const EXPO_NOTI_SERVICE_URL = env.EXPO_NOTI_SERVICE_URL;

const ExpoNotiRepository = {
  async sendNotification(expoPushToken, message) {
    const payload = [
      {
        to: expoPushToken,
        sound: message.sound || "default",
        title: message.title,
        body: message.body,
        data: message.data || {},
        priority: message.priority || "high",
      },
    ];

    const res = await axios.post(EXPO_NOTI_SERVICE_URL, payload, {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
    });

    return res.data;
  },
};

export default ExpoNotiRepository;
