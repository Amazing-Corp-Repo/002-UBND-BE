-- Cho phép lưu lịch sử phân công đã ngừng nhưng chỉ có một phân công đang hoạt động
-- cho mỗi cấu hình quầy. Không sửa migration cũ đã được áp dụng.
BEGIN;

DROP INDEX IF EXISTS "uq_phan_cong_quay_cau_hinh";

CREATE UNIQUE INDEX "uq_phan_cong_quay_cau_hinh_active_v2"
  ON "phan_cong_quay_tiep_dan" ("id_cau_hinh_quay")
  WHERE "is_active" = true AND "is_delete" = false;

COMMIT;
