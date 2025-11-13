import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";
import fs from "fs";
import path from "path";

const logDir = path.join(process.cwd(), "src", "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const getUTCTimestamp = () => new Date().toISOString(); // 2025-11-13T03:20:15.123Z

const dailyRotateFile = new transports.DailyRotateFile({
    filename: path.join(logDir, "app-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: false,
    maxSize: "2m",
    maxFiles: "2d",
    auditFile: path.join(logDir, "app-audit.json"),
    utc: true,
});

const logger = createLogger({
    level: "info",
    format: format.combine(
        format.timestamp({ format: getUTCTimestamp }),
        format.printf(
            (info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`
        )
    ),
    transports: [new transports.Console(), dailyRotateFile],
});

console.log = (...args) => logger.info(args.join(" "));
console.error = (...args) => logger.error(args.join(" "));
console.warn = (...args) => logger.warn(args.join(" "));
console.debug = (...args) => logger.debug(args.join(" "));

export default logger;
