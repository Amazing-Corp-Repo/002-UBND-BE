import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("leader meeting statistics groups ratings in PostgreSQL instead of loading every row", async () => {
  const source = await readFile(
    new URL("../src/repositories/leader-meeting-rating.repository.js", import.meta.url),
    "utf8"
  );
  const statisticsMethod = source.slice(
    source.indexOf("async getStatistics"),
    source.indexOf("async findDetail")
  );
  assert.match(statisticsMethod, /GROUP BY leader\."id", leader\."ho_va_ten"/);
  assert.match(statisticsMethod, /AVG\(rating\."diem_tong"\)/);
  assert.match(statisticsMethod, /\$queryRawUnsafe\(leaderStatisticsQuery, \.\.\.queryParameters\)/);
  assert.doesNotMatch(statisticsMethod, /danh_gia_gap_lanh_dao\.findMany/);
});
