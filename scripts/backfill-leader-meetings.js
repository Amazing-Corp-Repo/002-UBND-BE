import "dotenv/config";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { runLeaderMeetingBackfill } from "./leader-meeting-backfill.logic.js";

function argumentValue(name) {
  const prefix = `${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

const apply = process.argv.includes("--apply");
const connectionString = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("Thiếu MIGRATE_DATABASE_URL hoặc DATABASE_URL");

const databaseUrl = new URL(connectionString);
const databaseName = databaseUrl.pathname.replace(/^\//, "");
const schema = databaseUrl.searchParams.get("schema") || "public";
const target = `${databaseName}/${schema}`;
if (apply && argumentValue("--confirm-target") !== target) {
  throw new Error(`Từ chối backfill: dùng --confirm-target=${target} cùng --apply`);
}

const mappingPath = argumentValue("--leader-map");
const leaderMap = mappingPath
  ? JSON.parse(await readFile(mappingPath, "utf8"))
  : {};

const options = schema ? `-c search_path="${schema}",public` : undefined;
const adapter = new PrismaPg({ connectionString, options }, schema ? { schema } : undefined);
const prisma = new PrismaClient({ adapter });

try {
  const result = await runLeaderMeetingBackfill(prisma, { apply, leaderMap });
  console.log(JSON.stringify({ mode: apply ? "APPLY" : "DRY_RUN", target, ...result }, null, 2));
} finally {
  await prisma.$disconnect();
}
