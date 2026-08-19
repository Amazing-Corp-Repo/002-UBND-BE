import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { runReceptionV2Backfill } from "./reception-v2-backfill.logic.js";

function getArgumentValue(name) {
  const prefix = `${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

const apply = process.argv.includes("--apply");
const connectionString = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Thiếu MIGRATE_DATABASE_URL hoặc DATABASE_URL");
}

const databaseUrl = new URL(connectionString);
const databaseName = databaseUrl.pathname.replace(/^\//, "");
const schema = databaseUrl.searchParams.get("schema") || "public";
const target = `${databaseName}/${schema}`;
const confirmedTarget = getArgumentValue("--confirm-target");

if (apply && confirmedTarget !== target) {
  throw new Error(
    `Từ chối backfill: dùng --confirm-target=${target} cùng --apply để xác nhận đúng database/schema`
  );
}

const options = schema ? `-c search_path="${schema}",public` : undefined;
const adapter = new PrismaPg(
  { connectionString, options },
  schema ? { schema } : undefined
);
const prisma = new PrismaClient({ adapter });

try {
  const result = await runReceptionV2Backfill(prisma, { apply });
  console.log(
    JSON.stringify(
      {
        mode: apply ? "APPLY" : "DRY_RUN",
        target,
        ...result,
        note:
          result.after.counterAssignments === 0
            ? "Chưa có dữ liệu phân công cán bộ-quầy; phải import từ dữ liệu đã xác nhận."
            : undefined,
      },
      null,
      2
    )
  );
} finally {
  await prisma.$disconnect();
}
