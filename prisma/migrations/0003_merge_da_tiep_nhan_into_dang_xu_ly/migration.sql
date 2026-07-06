-- Gộp trạng thái phản ánh "Đã tiếp nhận" vào "Đang xử lý".
--
-- Trạng thái lưu dưới dạng NHÃN tiếng Việt trong lich_su_trang_thai.ten
-- (không phải mã code). Sau khi bỏ "Đã tiếp nhận" khỏi
-- src/constants/phan-anh-status.constant.js, dữ liệu lịch sử cũ còn nhãn này sẽ
-- không khớp ORDER → phản ánh đang ở "Đã tiếp nhận" bị kẹt, không cập nhật được.
-- UPDATE dưới đây idempotent (chạy lại nhiều lần vô hại).
--
-- Schema-agnostic: KHÔNG qualify schema (search_path do connection chọn).
-- Việc dọn các dòng lịch sử "Đang xử lý" bị trùng (cosmetic) được tách riêng ở
-- prisma/data-migrations/dedupe-dang-xu-ly-history.sql vì cần review thủ công.

UPDATE "lich_su_trang_thai"
SET "ten" = 'Đang xử lý'
WHERE "ten" = 'Đã tiếp nhận';
