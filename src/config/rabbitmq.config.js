import amqp from "amqplib";
import env from "./environment.config.js";

const RABBITMQ_URL = env.RABBITMQ_URL;

let connection;
let channel;

export const connectRabbitMQ = async (retryCount = 5) => {
    if (connection && channel) {
        return { connection, channel };
    }

    // Chưa cấu hình RABBITMQ_URL (vd dev chỉ có .env DB) → bỏ qua, app vẫn boot.
    // Các tác vụ async (video/export) sẽ cần RabbitMQ khi team cấu hình sau.
    if (!RABBITMQ_URL) {
        console.warn("[RabbitMQ] Chưa có RABBITMQ_URL — bỏ qua hàng đợi, app chạy trong chế độ không có async worker.");
        channel = {
            assertQueue: async () => {},
            assertExchange: async () => {},
            bindQueue: async () => {},
            sendToQueue: () => false,
            publish: () => false,
            consume: () => Promise.resolve(null),
            prefetch: () => Promise.resolve(null),
            ack: () => {},
            nack: () => {},
            close: async () => {},
        };
        return { connection: null, channel };
    }

    for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
            connection = await amqp.connect(RABBITMQ_URL);
            channel = await connection.createChannel();

            connection.on("error", (err) => {
                console.error("RabbitMQ error:", err.message);
            });

            connection.on("close", () => {
                console.warn("RabbitMQ connection closed. Retrying...");
                connection = null;
                channel = null;
                setTimeout(() => connectRabbitMQ(), 5000);
            });

            console.log("RabbitMQ connected successfully!");
            return { connection, channel };
        } catch (err) {
            console.error(`RabbitMQ connect failed (Attempt ${attempt}/${retryCount}):`, err.message);
            if (attempt === retryCount) {
                console.error("Could not connect to RabbitMQ after multiple attempts. Exiting...");
                process.exit(1);
            }
            await new Promise((r) => setTimeout(r, 3000)); // retry after 3s
        }
    }
};
