import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const migrationUrl = new URL(
  "../prisma/migrations/20260822090000_manual_reception_rating_snapshots/migration.sql",
  import.meta.url
);

describe("Manual reception rating migration", () => {
  it("backfills legacy data before enforcing required snapshot fields", async () => {
    const sql = await readFile(migrationUrl, "utf8");
    const backfillPosition = sql.indexOf('UPDATE "danh_gia_tiep_dan"');
    const requiredPosition = sql.indexOf(
      'ALTER COLUMN "ma_tiep_dan" SET NOT NULL'
    );

    assert.ok(backfillPosition >= 0);
    assert.ok(requiredPosition > backfillPosition);
    assert.match(sql, /id_dang_ky_tiep_dan" DROP NOT NULL/);
    assert.match(sql, /uq_danh_gia_tiep_dan_ma_tiep_dan/);
    assert.match(sql, /LEFT JOIN "quay_tiep_dan" AS "quay_v2"/);
  });
});
