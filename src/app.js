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
      // Nếu không có origin (ví dụ: từ Postman), cho phép tất cả
      if (!origin) return callback(null, true);

      // Nếu CORS_ORIGIN là '*' thì cho phép tất cả các domain
      if (ALLOWED_CORS_ORIGIN.includes("*")) {
        return callback(null, true);
      }

      // Kiểm tra xem origin có trong whitelist không
      if (ALLOWED_CORS_ORIGIN.includes(origin)) {
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
    return req.path.includes('/video/upload');
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

import("../src/cron/cleanup-cron.js")
  .then((m) => {
    m.registerCleanupCron();
    console.log("Cron job started cùng server");
  })
  .catch((err) => console.error("Cron error:", err));

server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
