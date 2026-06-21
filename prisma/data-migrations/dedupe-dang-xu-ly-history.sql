-- =============================================================================
-- (TÙY CHỌN, CHẠY TAY) Dọn lịch sử "Đang xử lý" bị trùng sau khi gộp trạng thái
-- =============================================================================
-- Phần BẮT BUỘC (đổi nhãn "Đã tiếp nhận" → "Đang xử lý") đã nằm trong migration
-- chính thức: prisma/migrations/0003_merge_da_tiep_nhan_into_dang_xu_ly.
--
-- File này CHỈ xử lý phần cosmetic: phản ánh nào từng đi qua CẢ "Đã tiếp nhận"
-- lẫn "Đang xử lý" giờ có 2 dòng "Đang xử lý" liền nhau → hiển thị lịch sử trùng.
-- KHÔNG ảnh hưởng luồng nghiệp vụ → tách khỏi migrate deploy vì cần review thủ công.
--
-- ⚠️  Backup trước (pg_dump). Set search_path đúng schema theo môi trường:
--        staging: ubnd_staging   |   prod: ubnd_db
-- =============================================================================

-- SET search_path TO "ubnd_staging", public;   -- bỏ comment + chỉnh đúng schema

-- -----------------------------------------------------------------------------
-- Quy tắc gộp an toàn: với mỗi phản ánh, GIỮ dòng "Đang xử lý" SỚM NHẤT
-- (mốc tiếp nhận gốc — khớp cách report.service tính "thời gian xử lý TB"),
-- XÓA các dòng "Đang xử lý" dư PHÍA SAU mà KHÔNG có ghi chú — để không bao giờ
-- xóa nhầm dòng mang ghi chú nghiệp vụ (vd: dòng đổi lĩnh vực cũng giữ ten =
-- trạng thái hiện tại + ghi_chu lý do).
--
-- BƯỚC 1 — REVIEW: xem chính xác các dòng SẼ bị xóa trước khi chạy DELETE.
-- -----------------------------------------------------------------------------
SELECT l.*
FROM "lich_su_trang_thai" l
WHERE l."ten" = 'Đang xử lý'
  AND NULLIF(TRIM(COALESCE(l."ghi_chu", '')), '') IS NULL
  AND l."thoi_gian_tao" > (
    SELECT MIN(l2."thoi_gian_tao")
    FROM "lich_su_trang_thai" l2
    WHERE l2."id_phan_anh" = l."id_phan_anh"
      AND l2."ten" = 'Đang xử lý'
  )
ORDER BY l."id_phan_anh", l."thoi_gian_tao";

-- -----------------------------------------------------------------------------
-- BƯỚC 2 — DELETE: sau khi đã xác nhận kết quả SELECT ở trên là đúng, bỏ comment
-- và chạy trong transaction.
-- -----------------------------------------------------------------------------
-- BEGIN;
-- DELETE FROM "lich_su_trang_thai" l
-- WHERE l."ten" = 'Đang xử lý'
--   AND NULLIF(TRIM(COALESCE(l."ghi_chu", '')), '') IS NULL
--   AND l."thoi_gian_tao" > (
--     SELECT MIN(l2."thoi_gian_tao")
--     FROM "lich_su_trang_thai" l2
--     WHERE l2."id_phan_anh" = l."id_phan_anh"
--       AND l2."ten" = 'Đang xử lý'
--   );
-- COMMIT;
