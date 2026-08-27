-- AlterTable
ALTER TABLE "thu_vien_tai_lieu" ADD COLUMN     "is_cleaned_up" BOOLEAN DEFAULT false,
ADD COLUMN     "thoi_gian_xoa" TIMESTAMP(6);
