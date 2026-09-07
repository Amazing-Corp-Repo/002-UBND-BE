-- AlterTable
ALTER TABLE "thu_vien_tai_lieu" ADD COLUMN     "ai_da_hoc" BOOLEAN DEFAULT false,
ADD COLUMN     "dia_chi" VARCHAR(500),
ADD COLUMN     "luot_xem" BIGINT DEFAULT 0,
ADD COLUMN     "ngay_het_han" DATE,
ADD COLUMN     "ten_di_tich" VARCHAR(255),
ADD COLUMN     "thoi_gian_ai_hoc" TIMESTAMP(6);

-- CreateTable
CREATE TABLE "thu_vien_tai_lieu_media" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_tai_lieu" UUID NOT NULL,
    "loai" VARCHAR(10) NOT NULL,
    "ten_file_goc" VARCHAR(255),
    "url" VARCHAR(500),
    "kich_thuoc" BIGINT,
    "mime_type" VARCHAR(50),
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "thu_vien_tai_lieu_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_tl_media_id_tai_lieu" ON "thu_vien_tai_lieu_media"("id_tai_lieu");

-- CreateIndex
CREATE INDEX "idx_thu_vien_tai_lieu_luot_xem" ON "thu_vien_tai_lieu"("luot_xem");

-- CreateIndex
CREATE INDEX "idx_thu_vien_tai_lieu_ai_da_hoc" ON "thu_vien_tai_lieu"("ai_da_hoc");

-- AddForeignKey
ALTER TABLE "thu_vien_tai_lieu_media" ADD CONSTRAINT "fk_tl_media_tai_lieu" FOREIGN KEY ("id_tai_lieu") REFERENCES "thu_vien_tai_lieu"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
