-- 0001_sync_phan_anh_fk
-- Hội tụ FK id_to của phan_anh về đúng schema.prisma (sau commit "remove idTo").
-- Đổi tên constraint fk_phan_anh_id_to_nguoi_dung -> fk_phan_anh_id_to và
-- ON UPDATE CASCADE -> NO ACTION (ON DELETE SET NULL giữ nguyên).
-- Schema-agnostic: tên bảng không qualify, schema do ?schema= của connection chọn.

-- DropForeignKey
ALTER TABLE "phan_anh" DROP CONSTRAINT "fk_phan_anh_id_to_nguoi_dung";

-- AddForeignKey
ALTER TABLE "phan_anh" ADD CONSTRAINT "fk_phan_anh_id_to" FOREIGN KEY ("id_to") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
