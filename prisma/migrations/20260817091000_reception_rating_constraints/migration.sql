ALTER TABLE "danh_gia_tiep_dan"
ALTER COLUMN "diem_tong" SET NOT NULL;

ALTER TABLE "danh_gia_tiep_dan"
ADD CONSTRAINT "ck_danh_gia_tiep_dan_diem_tong"
CHECK ("diem_tong" BETWEEN 1 AND 5);

ALTER TABLE "danh_gia_tiep_dan"
ADD CONSTRAINT "ck_danh_gia_tiep_dan_nhan_xet_length"
CHECK ("nhan_xet" IS NULL OR char_length("nhan_xet") <= 2000);

CREATE INDEX "idx_danh_gia_tiep_dan_diem_tong"
ON "danh_gia_tiep_dan"("diem_tong");
