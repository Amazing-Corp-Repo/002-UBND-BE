-- Thêm cột lưu video "hiện trường đã xử lý" khi giải quyết phản ánh.
-- Tách riêng với id_video (video của công dân khi gửi phản ánh) để hiển thị riêng.
-- Mảng id của video_uploads (HLS). Mặc định mảng rỗng để không phá dữ liệu cũ.
-- Schema-agnostic: tên bảng không qualify schema (search_path chọn schema).

ALTER TABLE "phan_anh"
  ADD COLUMN "id_video_giai_quyet" VARCHAR(255)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(255)[];
