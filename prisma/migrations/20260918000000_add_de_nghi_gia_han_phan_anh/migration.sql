-- CreateTable
CREATE TABLE "de_nghi_gia_han_phan_anh" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_phan_anh" UUID NOT NULL,
    "id_nguoi_de_nghi" UUID NOT NULL,
    "id_nguoi_duyet" UUID,
    "han_ban_dau" TIMESTAMP(6) NOT NULL,
    "han_de_xuat_moi" TIMESTAMP(6) NOT NULL,
    "ly_do_gia_han" TEXT NOT NULL,
    "ly_do_tu_choi" TEXT,
    "trang_thai" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_duyet" TIMESTAMP(6),

    CONSTRAINT "de_nghi_gia_han_phan_anh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "de_nghi_gia_han_file" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_de_nghi_gia_han" UUID NOT NULL,
    "ten_file" VARCHAR(255) NOT NULL,
    "url_file" VARCHAR(500) NOT NULL,
    "dinh_dang_file" VARCHAR(150) NOT NULL,
    "kich_thuoc_file_mb" DECIMAL(10,2),
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "de_nghi_gia_han_file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_de_nghi_gia_han_id_phan_anh" ON "de_nghi_gia_han_phan_anh"("id_phan_anh");

-- CreateIndex
CREATE INDEX "idx_de_nghi_gia_han_trang_thai" ON "de_nghi_gia_han_phan_anh"("trang_thai");

-- CreateIndex
CREATE INDEX "idx_de_nghi_gia_han_nguoi_de_nghi" ON "de_nghi_gia_han_phan_anh"("id_nguoi_de_nghi");

-- CreateIndex
CREATE INDEX "idx_de_nghi_gia_han_file_de_nghi" ON "de_nghi_gia_han_file"("id_de_nghi_gia_han");

-- AddForeignKey
ALTER TABLE "de_nghi_gia_han_phan_anh" ADD CONSTRAINT "fk_de_nghi_gia_han_phan_anh" FOREIGN KEY ("id_phan_anh") REFERENCES "phan_anh"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "de_nghi_gia_han_phan_anh" ADD CONSTRAINT "fk_de_nghi_gia_han_nguoi_de_nghi" FOREIGN KEY ("id_nguoi_de_nghi") REFERENCES "nguoi_dung"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "de_nghi_gia_han_phan_anh" ADD CONSTRAINT "fk_de_nghi_gia_han_nguoi_duyet" FOREIGN KEY ("id_nguoi_duyet") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "de_nghi_gia_han_file" ADD CONSTRAINT "fk_de_nghi_gia_han_file_de_nghi" FOREIGN KEY ("id_de_nghi_gia_han") REFERENCES "de_nghi_gia_han_phan_anh"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
