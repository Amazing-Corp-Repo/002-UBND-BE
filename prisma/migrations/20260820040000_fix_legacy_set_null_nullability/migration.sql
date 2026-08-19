-- Align nullable columns with the existing ON DELETE SET NULL foreign keys.
-- This preserves history rows when their referenced parent is physically deleted.
ALTER TABLE "lich_su_trang_thai"
  ALTER COLUMN "id_phan_anh" DROP NOT NULL;

ALTER TABLE "user_session_logs"
  ALTER COLUMN "id_nguoi_dung" DROP NOT NULL;

ALTER TABLE "linh_vuc_phan_anh_nguoi_quan_ly"
  ALTER COLUMN "nguoi_tao" DROP NOT NULL;
