ALTER TABLE "phan_anh"
ADD COLUMN IF NOT EXISTS "cccd" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "khu_pho" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "mo_ta_vi_tri" TEXT;

UPDATE "phan_anh"
SET "khu_pho" = 'Chưa xác định'
WHERE "khu_pho" IS NULL OR BTRIM("khu_pho") = '';

ALTER TABLE "phan_anh"
ALTER COLUMN "khu_pho" SET NOT NULL;
