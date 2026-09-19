import prisma from "../src/config/database.config.js";
import {
  sanitizeAuditPayload,
  sanitizeAuditResponseBody,
} from "../src/utils/audit-log-sanitizer.util.js";

const apply = process.argv.includes("--apply");
const batchSize = 200;
let cursor;
let scanned = 0;
let changed = 0;

while (true) {
  const logs = await prisma.audit_logs.findMany({
    take: batchSize,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { id: "asc" },
    select: { id: true, request_body: true, response_body: true },
  });
  if (logs.length === 0) break;

  for (const log of logs) {
    scanned += 1;
    const requestBody = sanitizeAuditPayload(log.request_body ?? {});
    const responseBody = sanitizeAuditResponseBody(log.response_body ?? {});
    if (
      JSON.stringify(requestBody) !== JSON.stringify(log.request_body ?? {}) ||
      JSON.stringify(responseBody) !== JSON.stringify(log.response_body ?? {})
    ) {
      changed += 1;
      if (apply) {
        await prisma.audit_logs.update({
          where: { id: log.id },
          data: { request_body: requestBody, response_body: responseBody },
        });
      }
    }
  }
  cursor = logs.at(-1).id;
}

console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", scanned, changed }));
await prisma.$disconnect();
