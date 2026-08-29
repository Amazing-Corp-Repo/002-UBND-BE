import express from "express";
import env from "./config/environment.config.js";
import cors from "cors";
import rootRouter from "./routes/root.route.js";
import swaggerDocument from "./swagger/index.js";
import swaggerUi from "swagger-ui-express";
import { errorHandler } from "./middlewares/error-handle.middleware.js";
import { CreateAccountSeed } from "./seeds/create-account.seed.js";
import {
  apiMutationRateLimiter,
  apiRequestRateLimiter,
} from "./middlewares/api-rate-limit.middleware.js";
import http from "http";
import basicAuth from "express-basic-auth";
import { connectRabbitMQ } from "./config/rabbitmq.config.js";
import "./utils/logger.util.js";
import { isCorsOriginAllowed } from "./config/cors.config.js";

const app = express();
// Render đứng trước ứng dụng một lớp proxy và gửi X-Forwarded-For.
// Chỉ tin đúng số hop được cấu hình để rate-limit lấy đúng IP client.
const trustProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS || "1", 10);
app.set("trust proxy", Number.isInteger(trustProxyHops) && trustProxyHops >= 0 ? trustProxyHops : 1);

const PORT = env.PORT;
const ALLOWED_CORS_ORIGIN = env.CORS_ORIGIN;
const PREFIX_API = env.PREFIX_API;
const SWAGGER_USERNAME = env.SWAGGER_USERNAME;
const SWAGGER_PASSWORD = env.SWAGGER_PASSWORD;

app.use(
  cors({
    origin: (origin, callback) => {
      if (isCorsOriginAllowed(origin, ALLOWED_CORS_ORIGIN)) {
        console.log(`Allowed by CORS: ${origin}`); // Log các domain được phép
        return callback(null, true);
      }

      // Nếu không có trong whitelist -> block
      console.log(`Not allowed by CORS: ${origin}`); // Log các domain không được phép
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true, // Cho phép cookie, token
  })
);

app.use(express.json());
app.use(express.static("src/public"));

app.use(
  PREFIX_API,
  apiRequestRateLimiter,
  apiMutationRateLimiter,
  rootRouter
);
CreateAccountSeed();
app.use(errorHandler);

app.use(
  "/api-docs/",
  basicAuth({
    users: { [SWAGGER_USERNAME]: SWAGGER_PASSWORD },
    challenge: true,
  }),
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

const server = http.createServer(app);

try {
  const { channel } = await connectRabbitMQ();
  console.log("RabbitMQ ready — starting Express server...");

  for (const q of Object.values(env.queues)) {
    await channel.assertQueue(q, { durable: true });
    console.log(`Queue initialized: ${q}`);
  }
} catch (error) {
  console.error("RabbitMQ not ready:", error.message);
  process.exit(1);
}

// Lightweight health endpoint for container/platform checks
app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

import("../src/workers/video.worker.js")
  .then(() => console.log("Worker started cùng server"))
  .catch((err) => console.error("Worker error:", err));

import("../src/workers/export-phan-anh.worker.js")
  .then(() => console.log("Export worker started cùng server"))
  .catch((err) => console.error("Export worker error:", err));

import("./cron/cleanup-chunks.cron.js")
  .then((m) => {
    m.registerCleanupCron();
    console.log("Cron job started cùng server");
  })
  .catch((err) => console.error("Cron error:", err));

import("./cron/daily-overview-report.cron.js")
  .then((m) => {
    m.registerDailyOverviewReportCron();
    console.log("Daily overview report cron started cùng server");
  })
  .catch((err) => console.error("Daily overview report cron error:", err));

import("./cron/leader-meeting-status.cron.js")
  .then((m) => {
    m.registerLeaderMeetingStatusCron();
    console.log("Leader meeting status cron started cùng server");
  })
  .catch((err) => console.error("Leader meeting status cron error:", err));

import("./cron/cleanup-thu-vien.cron.js")
  .then((m) => {
    m.registerCleanupThuVienCron();
    console.log("Thu vien cleanup cron started cùng server");
  })
  .catch((err) => console.error("Thu vien cleanup cron error:", err));

server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
