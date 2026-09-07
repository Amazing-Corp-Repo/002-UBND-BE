-- Lưu ngày hẹn trên đơn để DB có thể chống đăng ký trùng theo ngày một cách nguyên tử.
BEGIN;

ALTER TABLE "dang_ky_gap_lanh_dao"
  ADD COLUMN "ngay_hen" DATE;

UPDATE "dang_ky_gap_lanh_dao" AS registration
SET "ngay_hen" = schedule."ngay"
FROM "khung_gio_gap_lanh_dao" AS slot
JOIN "lich_gap_lanh_dao" AS schedule
  ON schedule."id" = slot."id_lich_gap"
WHERE registration."id_khung_gio_gap" = slot."id"
  AND registration."ngay_hen" IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "dang_ky_gap_lanh_dao"
    WHERE "ngay_hen" IS NULL
  ) THEN
    RAISE EXCEPTION 'Không thể xác định ngày hẹn cho toàn bộ đăng ký gặp lãnh đạo';
  END IF;
END $$;

ALTER TABLE "dang_ky_gap_lanh_dao"
  ALTER COLUMN "ngay_hen" SET NOT NULL;

CREATE INDEX "idx_dang_ky_gap_ngay_hen"
  ON "dang_ky_gap_lanh_dao" ("ngay_hen");

CREATE UNIQUE INDEX "uq_dang_ky_gap_ngay_sdt_dang_giu_cho"
  ON "dang_ky_gap_lanh_dao" ("ngay_hen", "sdt")
  WHERE "trang_thai" IN ('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED')
    AND "is_active" = true
    AND "is_delete" = false;

CREATE UNIQUE INDEX "uq_dang_ky_gap_ngay_cccd_dang_giu_cho"
  ON "dang_ky_gap_lanh_dao" ("ngay_hen", "cccd")
  WHERE "trang_thai" IN ('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED')
    AND "is_active" = true
    AND "is_delete" = false;

COMMIT;
