-- Hoàn thiện nền tảng DB cho luồng đăng ký gặp lãnh đạo.
-- Module này độc lập với quầy tiếp dân và không có bất kỳ khóa ngoại nào tới quầy.

BEGIN;

UPDATE "khung_gio_gap_lanh_dao"
SET "suc_chua" = 1
WHERE "suc_chua" IS NULL;

ALTER TABLE "khung_gio_gap_lanh_dao"
  ALTER COLUMN "suc_chua" SET DEFAULT 1,
  ALTER COLUMN "suc_chua" SET NOT NULL;

ALTER TABLE "dang_ky_gap_lanh_dao"
  ADD COLUMN "thoi_gian_bat_dau_xu_ly" TIMESTAMP(6),
  ADD COLUMN "nguoi_bat_dau_xu_ly" UUID,
  ADD COLUMN "ghi_chu_xu_ly" TEXT,
  ADD COLUMN "thoi_gian_huy" TIMESTAMP(6),
  ADD COLUMN "nguoi_huy" UUID,
  ADD COLUMN "ly_do_huy" TEXT,
  ADD COLUMN "ghi_chu_hoan_thanh" TEXT;

ALTER TABLE "dang_ky_gap_lanh_dao"
  DROP CONSTRAINT IF EXISTS "ck_dang_ky_gap_trang_thai";

ALTER TABLE "dang_ky_gap_lanh_dao"
  ADD CONSTRAINT "ck_dang_ky_gap_trang_thai"
  CHECK ("trang_thai" IN (
    'PENDING',
    'APPROVED',
    'IN_PROGRESS',
    'COMPLETED',
    'REJECTED',
    'CANCELED'
  ));

ALTER TABLE "dang_ky_gap_lanh_dao"
  ADD CONSTRAINT "fk_dang_ky_gap_nguoi_bat_dau_xu_ly"
  FOREIGN KEY ("nguoi_bat_dau_xu_ly") REFERENCES "nguoi_dung"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "dang_ky_gap_lanh_dao"
  ADD CONSTRAINT "fk_dang_ky_gap_nguoi_huy"
  FOREIGN KEY ("nguoi_huy") REFERENCES "nguoi_dung"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE UNIQUE INDEX "uq_dinh_kem_gap_cccd_front"
  ON "dinh_kem_dang_ky_gap_lanh_dao" ("id_dang_ky")
  WHERE "loai_dinh_kem" = 'CCCD_FRONT';

CREATE UNIQUE INDEX "uq_dinh_kem_gap_cccd_back"
  ON "dinh_kem_dang_ky_gap_lanh_dao" ("id_dang_ky")
  WHERE "loai_dinh_kem" = 'CCCD_BACK';

INSERT INTO "permissions" ("code", "description")
VALUES
  ('LMS_GET_ALL', 'Xem danh sách lịch gặp lãnh đạo'),
  ('LMS_GET_DETAIL', 'Xem chi tiết lịch gặp lãnh đạo'),
  ('LMS_CREATE', 'Tạo lịch gặp lãnh đạo'),
  ('LMS_UPDATE', 'Cập nhật lịch gặp lãnh đạo'),
  ('LMS_UPDATE_STATUS', 'Cập nhật trạng thái lịch gặp lãnh đạo'),
  ('LMS_DELETE', 'Xóa lịch gặp lãnh đạo'),
  ('LMR_GET_ALL', 'Xem danh sách đăng ký gặp lãnh đạo'),
  ('LMR_GET_DETAIL', 'Xem chi tiết đăng ký gặp lãnh đạo'),
  ('LMR_APPROVE', 'Phê duyệt đăng ký gặp lãnh đạo'),
  ('LMR_REJECT', 'Từ chối đăng ký gặp lãnh đạo'),
  ('LMR_PROCESS', 'Bắt đầu xử lý đăng ký gặp lãnh đạo'),
  ('LMR_COMPLETE', 'Hoàn thành buổi gặp lãnh đạo'),
  ('LMR_CANCEL', 'Hủy đăng ký gặp lãnh đạo'),
  ('LMRT_GET_ALL', 'Xem danh sách đánh giá gặp lãnh đạo'),
  ('LMRT_GET_DETAIL', 'Xem chi tiết đánh giá gặp lãnh đạo'),
  ('LMRT_GET_STATS', 'Xem thống kê đánh giá gặp lãnh đạo')
ON CONFLICT ("code") DO UPDATE
SET "description" = EXCLUDED."description";

-- Lãnh đạo vận hành lịch và đơn của chính mình; phạm vi bản ghi vẫn được BE kiểm tra.
INSERT INTO "role_permissions" ("role_id", "permission_code")
SELECT role_record."id", permission_record."code"
FROM "roles" AS role_record
CROSS JOIN "permissions" AS permission_record
WHERE role_record."name" IN ('ADMIN', 'LANH_DAO')
  AND role_record."is_active" IS TRUE
  AND role_record."is_delete" IS FALSE
  AND permission_record."code" LIKE ANY (ARRAY['LMS_%', 'LMR_%', 'LMRT_%'])
ON CONFLICT ("role_id", "permission_code") DO NOTHING;

-- Vai trò duyệt (nếu môi trường có) chỉ được xem toàn bộ, không được hủy thay lãnh đạo.
INSERT INTO "role_permissions" ("role_id", "permission_code")
SELECT role_record."id", permission_record."code"
FROM "roles" AS role_record
CROSS JOIN "permissions" AS permission_record
WHERE role_record."name" IN ('APPROVER', 'PHE_DUYET')
  AND role_record."is_active" IS TRUE
  AND role_record."is_delete" IS FALSE
  AND permission_record."code" IN (
    'LMS_GET_ALL', 'LMS_GET_DETAIL',
    'LMR_GET_ALL', 'LMR_GET_DETAIL',
    'LMRT_GET_ALL', 'LMRT_GET_DETAIL', 'LMRT_GET_STATS'
  )
ON CONFLICT ("role_id", "permission_code") DO NOTHING;

COMMIT;
