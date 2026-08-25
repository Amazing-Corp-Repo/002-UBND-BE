import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("leader meeting integration guide covers all 23 API operations", async () => {
  const content = await readFile(
    new URL("../docs/leader-meeting-api-integration.md", import.meta.url),
    "utf8"
  );
  const operations = content.match(/`(?:GET|POST|PUT|PATCH|DELETE) \/leader-meeting-[^`]+`/g) || [];
  assert.equal(new Set(operations).size, 23);
  assert.match(content, /không gửi hoặc đọc `counterId`/);
  assert.match(content, /backfill:leader-meetings/);
  assert.match(content, /seed:leader-meeting-swagger-demo/);
});
