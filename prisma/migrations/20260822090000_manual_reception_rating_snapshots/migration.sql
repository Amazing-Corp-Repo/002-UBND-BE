-- Cho phép đánh giá iPad lưu độc lập với đăng ký tiếp dân cũ.
ALTER TABLE "danh_gia_tiep_dan"
  ADD COLUMN "ma_tiep_dan" VARCHAR(50),
  ADD COLUMN "ten_nguoi_dan" VARCHAR(150),
  ADD COLUMN "ten_can_bo" VARCHAR(150),
  ADD COLUMN "ma_quay" VARCHAR(20),
  ADD COLUMN "ngay_tiep_dan" DATE,
  ADD COLUMN "khung_gio" VARCHAR(50),
  ADD COLUMN "noi_dung_lam_viec" TEXT;

-- Backfill snapshot cho đánh giá lịch sử trước khi đặt NOT NULL.
UPDATE "danh_gia_tiep_dan" AS "dg"
SET
  "ma_tiep_dan" = "dk"."ma_tiep_dan",
  "ten_nguoi_dan" = COALESCE(NULLIF(BTRIM("dk"."ho_ten"), ''), 'Chưa cập nhật'),
  "ten_can_bo" = COALESCE(
    NULLIF(BTRIM("nd"."ho_va_ten"), ''),
    NULLIF(BTRIM("dk"."ten_lanh_dao"), ''),
    'Chưa cập nhật'
  ),
  "ma_quay" = COALESCE(
    NULLIF(BTRIM("quay_v2"."ma_quay"), ''),
    NULLIF(BTRIM("quay_v1"."ma_quay"), ''),
    NULLIF(BTRIM("cau_hinh"."ma_quay"), ''),
    NULLIF(BTRIM("dk"."bo_phan"), ''),
    'CHUA_XAC_DINH'
  ),
  "ngay_tiep_dan" = COALESCE("dk"."ngay", CURRENT_DATE),
  "khung_gio" = COALESCE(NULLIF(BTRIM("dk"."slot"), ''), 'Chưa cập nhật'),
  "noi_dung_lam_viec" = COALESCE(
    NULLIF(BTRIM("dk"."ly_do"), ''),
    NULLIF(BTRIM("dk"."chu_de"), ''),
    'Chưa cập nhật'
  )
FROM "dang_ky_tiep_dan" AS "dk"
LEFT JOIN "nguoi_dung" AS "nd" ON "nd"."id" = "dk"."nguoi_duyet_don"
LEFT JOIN "khung_gio_tiep_dan" AS "cau_hinh"
  ON "cau_hinh"."id" = "dk"."id_cau_hinh_quay"
LEFT JOIN "quay_tiep_dan" AS "quay_v2"
  ON "quay_v2"."id" = "cau_hinh"."id_quay"
LEFT JOIN "quay_tiep_dan" AS "quay_v1"
  ON "quay_v1"."id" = "dk"."id_quay"
WHERE "dg"."id_dang_ky_tiep_dan" = "dk"."id";

ALTER TABLE "danh_gia_tiep_dan"
  ALTER COLUMN "id_dang_ky_tiep_dan" DROP NOT NULL,
  ALTER COLUMN "ma_tiep_dan" SET NOT NULL,
  ALTER COLUMN "ten_nguoi_dan" SET NOT NULL,
  ALTER COLUMN "ten_can_bo" SET NOT NULL,
  ALTER COLUMN "ma_quay" SET NOT NULL,
  ALTER COLUMN "ngay_tiep_dan" SET NOT NULL,
  ALTER COLUMN "khung_gio" SET NOT NULL,
  ALTER COLUMN "noi_dung_lam_viec" SET NOT NULL;

CREATE UNIQUE INDEX "uq_danh_gia_tiep_dan_ma_tiep_dan"
  ON "danh_gia_tiep_dan"("ma_tiep_dan");
CREATE INDEX "idx_danh_gia_tiep_dan_ma_quay"
  ON "danh_gia_tiep_dan"("ma_quay");
CREATE INDEX "idx_danh_gia_tiep_dan_ten_can_bo"
  ON "danh_gia_tiep_dan"("ten_can_bo");
CREATE INDEX "idx_danh_gia_tiep_dan_ngay_tiep_dan"
  ON "danh_gia_tiep_dan"("ngay_tiep_dan");
