import express from "express";
import env from "./config/environment.config.js";
import cors from "cors";
import rootRouter from "./routes/root.route.js";
import swaggerDocument from "./swagger/index.js";
import swaggerUi from "swagger-ui-express";
import { errorHandler } from "./middlewares/error-handle.middleware.js";
import { CreateAccountSeed } from "./seeds/create-account.seed.js";
import rateLimit from "express-rate-limit";
import { errorResponse } from "./utils/response.util.js";
import http from "http";
import { initSocket } from "./realtime/socket/index.js";
import basicAuth from "express-basic-auth";
import { connectRabbitMQ } from "./config/rabbitmq.config.js";
import "./utils/logger.util.js";
import { isCorsOriginAllowed } from "./config/cors.config.js";

const app = express();
const PORT = env.PORT;
const ALLOWED_CORS_ORIGIN = env.CORS_ORIGIN;
const PREFIX_API = env.PREFIX_API;
const RATE_LIMIT_MAX = parseInt(env.RATE_LIMIT_MAX);
const RATE_LIMIT_WINDOW_MS = parseInt(env.RATE_LIMIT_WINDOW_MS);
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

const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS, // 1 phút
  max: RATE_LIMIT_MAX, // tối đa 100 request trong 1 phút
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path.includes("/video/upload");
  },
  handler: (req, res, next) => {
    return errorResponse(
      res,
      { message: "Too many requests, please try again later." },
      429
    );
  },
});

app.use(PREFIX_API, apiLimiter, rootRouter);
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

// initSocket(server);
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
