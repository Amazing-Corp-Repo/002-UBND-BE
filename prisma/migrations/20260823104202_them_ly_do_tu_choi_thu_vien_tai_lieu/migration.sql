-- DropForeignKey
ALTER TABLE "danh_gia_tiep_dan" DROP CONSTRAINT "fk_danh_gia_tiep_dan_dang_ky";

-- AlterTable
ALTER TABLE "thu_vien_tai_lieu" ADD COLUMN     "ly_do_tu_choi" VARCHAR(500);

-- AddForeignKey
ALTER TABLE "danh_gia_tiep_dan" ADD CONSTRAINT "fk_danh_gia_tiep_dan_dang_ky" FOREIGN KEY ("id_dang_ky_tiep_dan") REFERENCES "dang_ky_tiep_dan"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
