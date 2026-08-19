ALTER TABLE "dang_ky_tiep_dan"
ADD COLUMN "thoi_gian_phe_duyet" TIMESTAMP(6),
ADD COLUMN "thoi_gian_hoan_thanh" TIMESTAMP(6),
ADD COLUMN "nguoi_hoan_thanh" UUID;

UPDATE "dang_ky_tiep_dan"
SET "thoi_gian_phe_duyet" = "thoi_gian_cap_nhat"
WHERE "trang_thai" IN ('APPROVED', 'COMPLETED')
  AND "thoi_gian_phe_duyet" IS NULL;

CREATE INDEX "idx_dang_ky_tiep_dan_thoi_gian_hoan_thanh"
ON "dang_ky_tiep_dan"("thoi_gian_hoan_thanh");
