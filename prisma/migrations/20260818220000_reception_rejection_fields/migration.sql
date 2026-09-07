ALTER TABLE "dang_ky_tiep_dan"
ADD COLUMN "ly_do_tu_choi" TEXT,
ADD COLUMN "thoi_gian_tu_choi" TIMESTAMP(6),
ADD COLUMN "nguoi_tu_choi" UUID;

CREATE INDEX "idx_dang_ky_tiep_dan_thoi_gian_tu_choi"
ON "dang_ky_tiep_dan"("thoi_gian_tu_choi");
