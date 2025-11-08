import amqp from "amqplib";
import env from "./environment.config.js";

const RABBITMQ_URL = env.RABBITMQ_URL;

let connection;
let channel;

export const connectRabbitMQ = async (retryCount = 5) => {
    if (connection && channel) {
        return { connection, channel };
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
