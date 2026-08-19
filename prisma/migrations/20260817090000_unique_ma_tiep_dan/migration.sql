-- Backfill only legacy rows that do not have a reception code yet.
UPDATE "dang_ky_tiep_dan"
SET "ma_tiep_dan" = 'LEG-' || substring(replace("id"::text, '-', '') from 1 for 8)
WHERE "ma_tiep_dan" IS NULL;

DROP INDEX IF EXISTS "idx_dang_ky_tiep_dan_ma_tiep_dan";

ALTER TABLE "dang_ky_tiep_dan"
ALTER COLUMN "ma_tiep_dan" SET NOT NULL;

CREATE UNIQUE INDEX "uq_dang_ky_tiep_dan_ma_tiep_dan"
ON "dang_ky_tiep_dan"("ma_tiep_dan");
