-- Additive-only migration: complaint extension request and its supporting files.
CREATE TABLE "de_nghi_gia_han_phan_anh" (
  "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
  "id_phan_anh" UUID NOT NULL,
  "ly_do" TEXT NOT NULL,
  "ngay_de_xuat_hoan_thanh" TIMESTAMP(6) NOT NULL,
  "trang_thai" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "ly_do_tu_choi" TEXT,
  "nguoi_tao" UUID NOT NULL,
  "nguoi_duyet" UUID,
  "nguoi_tu_choi" UUID,
  "id_video" VARCHAR(255)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(255)[],
  "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
  "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
  CONSTRAINT "pk_de_nghi_gia_han_phan_anh" PRIMARY KEY ("id"),
  CONSTRAINT "uq_de_nghi_gia_han_phan_anh_id_phan_anh" UNIQUE ("id_phan_anh"),
  CONSTRAINT "ck_de_nghi_gia_han_phan_anh_trang_thai"
    CHECK ("trang_thai" IN ('PENDING', 'APPROVED', 'REJECTED')),
  CONSTRAINT "fk_de_nghi_gia_han_phan_anh"
    FOREIGN KEY ("id_phan_anh") REFERENCES "phan_anh"("id")
);

CREATE INDEX "idx_de_nghi_gia_han_phan_anh_trang_thai"
  ON "de_nghi_gia_han_phan_anh"("trang_thai");
CREATE INDEX "idx_de_nghi_gia_han_phan_anh_nguoi_tao"
  ON "de_nghi_gia_han_phan_anh"("nguoi_tao");

CREATE TABLE "dinh_kem_de_nghi_gia_han_phan_anh" (
  "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
  "id_de_nghi_gia_han" UUID NOT NULL,
  "dinh_dang_file" VARCHAR(255),
  "url_file" VARCHAR(500),
  "kich_thuoc_file_mb" DECIMAL(10,2),
  "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
  CONSTRAINT "pk_dinh_kem_de_nghi_gia_han" PRIMARY KEY ("id"),
  CONSTRAINT "fk_dinh_kem_de_nghi_gia_han"
    FOREIGN KEY ("id_de_nghi_gia_han") REFERENCES "de_nghi_gia_han_phan_anh"("id")
);

CREATE INDEX "idx_dinh_kem_de_nghi_gia_han_id_de_nghi"
  ON "dinh_kem_de_nghi_gia_han_phan_anh"("id_de_nghi_gia_han");
