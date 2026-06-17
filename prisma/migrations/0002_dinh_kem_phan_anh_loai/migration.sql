-- 0002_dinh_kem_phan_anh_loai
-- Phân loại đính kèm phản ánh: 'PHAN_ANH' (ảnh gốc của công dân) vs 'GIAI_QUYET'
-- (ảnh hiện trường đã xử lý khi cập nhật trạng thái "Đã giải quyết").
-- Schema-agnostic: tên bảng không qualify, schema do ?schema= của connection chọn.

ALTER TABLE "dinh_kem_phan_anh" ADD COLUMN "loai" VARCHAR(50) DEFAULT 'PHAN_ANH';
