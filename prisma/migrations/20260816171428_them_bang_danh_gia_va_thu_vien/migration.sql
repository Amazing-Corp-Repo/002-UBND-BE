-- CreateTable
CREATE TABLE "danh_gia_phan_anh" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_phan_anh" UUID NOT NULL,
    "diem" INTEGER NOT NULL,
    "nhan_xet" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "danh_gia_phan_anh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dang_ky_tiep_dan" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "loai" VARCHAR(30),
    "ma_tiep_dan" VARCHAR(50),
    "id_lich_tiep_dan" UUID,
    "ngay" DATE,
    "slot" VARCHAR(50),
    "chu_de" VARCHAR(255),
    "ly_do" TEXT,
    "ho_ten" VARCHAR(150),
    "sdt" VARCHAR(20),
    "cccd" VARCHAR(20),
    "dia_chi" TEXT,
    "bo_phan" TEXT,
    "ten_lanh_dao" VARCHAR(255),
    "chuc_vu_lanh_dao" VARCHAR(255),
    "trang_thai" VARCHAR(30) DEFAULT 'PENDING',
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "dang_ky_tiep_dan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "danh_gia_tiep_dan" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_dang_ky_tiep_dan" UUID NOT NULL,
    "diem_tong" INTEGER,
    "tieu_chi" JSONB,
    "ly_do" JSONB,
    "nhan_xet" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "danh_gia_tiep_dan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thu_vien_danh_muc" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "ten" VARCHAR(255) NOT NULL,
    "mo_ta" TEXT,
    "icon" VARCHAR(50),
    "tone" VARCHAR(20),
    "thu_tu" INTEGER,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "thu_vien_danh_muc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thu_vien_tai_lieu" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_danh_muc" UUID,
    "loai" VARCHAR(30),
    "tieu_de" VARCHAR(255),
    "tac_gia" VARCHAR(255),
    "mo_ta" TEXT,
    "url_bia" VARCHAR(500),
    "so_luot_tai" BIGINT DEFAULT 0,
    "is_featured" BOOLEAN DEFAULT false,
    "noi_dung" TEXT,
    "sections" JSONB,
    "so_hieu" VARCHAR(100),
    "co_quan_ban_hanh" VARCHAR(255),
    "ngay_ban_hanh" DATE,
    "ngay_hieu_luc" DATE,
    "trang_thai_hieu_luc" VARCHAR(50),
    "chuong" JSONB,
    "trang_thai" VARCHAR(30) DEFAULT 'NHAP',
    "pham_vi" VARCHAR(30) DEFAULT 'CONG_KHAI',
    "nguon" TEXT,
    "nguoi_duyet" UUID,
    "thoi_gian_duyet" TIMESTAMP(6),
    "ngay_dang" INTEGER,
    "ngon_ngu" VARCHAR(10),
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "thu_vien_tai_lieu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thu_vien_tag" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "ten" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "thu_vien_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thu_vien_tai_lieu_tag" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_tai_lieu" UUID NOT NULL,
    "id_tag" UUID NOT NULL,

    CONSTRAINT "thu_vien_tai_lieu_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thu_vien_tai_lieu_file" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_tai_lieu" UUID NOT NULL,
    "ten_file" VARCHAR(255),
    "duong_dan" VARCHAR(500),
    "dinh_dang" VARCHAR(50),
    "kich_thuoc_mb" DECIMAL(10,2),
    "phien_ban" INTEGER,
    "la_phien_ban_hien_tai" BOOLEAN DEFAULT false,
    "mo_ta" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "thu_vien_tai_lieu_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thu_vien_tai_lieu_quyen" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_tai_lieu" UUID NOT NULL,
    "id_vai_tro" UUID NOT NULL,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "thu_vien_tai_lieu_quyen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "danh_gia_phan_anh_id_phan_anh_key" ON "danh_gia_phan_anh"("id_phan_anh");

-- CreateIndex
CREATE INDEX "idx_danh_gia_phan_anh_diem" ON "danh_gia_phan_anh"("diem");

-- CreateIndex
CREATE INDEX "idx_danh_gia_phan_anh_is_active" ON "danh_gia_phan_anh"("is_active");

-- CreateIndex
CREATE INDEX "idx_danh_gia_phan_anh_is_delete" ON "danh_gia_phan_anh"("is_delete");

-- CreateIndex
CREATE INDEX "idx_dang_ky_tiep_dan_ma_tiep_dan" ON "dang_ky_tiep_dan"("ma_tiep_dan");

-- CreateIndex
CREATE INDEX "idx_dang_ky_tiep_dan_trang_thai" ON "dang_ky_tiep_dan"("trang_thai");

-- CreateIndex
CREATE INDEX "idx_dang_ky_tiep_dan_loai" ON "dang_ky_tiep_dan"("loai");

-- CreateIndex
CREATE UNIQUE INDEX "danh_gia_tiep_dan_id_dang_ky_tiep_dan_key" ON "danh_gia_tiep_dan"("id_dang_ky_tiep_dan");

-- CreateIndex
CREATE INDEX "idx_danh_gia_tiep_dan_id_dang_ky" ON "danh_gia_tiep_dan"("id_dang_ky_tiep_dan");

-- CreateIndex
CREATE INDEX "idx_thu_vien_danh_muc_is_active" ON "thu_vien_danh_muc"("is_active");

-- CreateIndex
CREATE INDEX "idx_thu_vien_danh_muc_is_delete" ON "thu_vien_danh_muc"("is_delete");

-- CreateIndex
CREATE INDEX "idx_thu_vien_tai_lieu_loai" ON "thu_vien_tai_lieu"("loai");

-- CreateIndex
CREATE INDEX "idx_thu_vien_tai_lieu_trang_thai" ON "thu_vien_tai_lieu"("trang_thai");

-- CreateIndex
CREATE INDEX "idx_thu_vien_tai_lieu_pham_vi" ON "thu_vien_tai_lieu"("pham_vi");

-- CreateIndex
CREATE INDEX "idx_thu_vien_tai_lieu_is_active" ON "thu_vien_tai_lieu"("is_active");

-- CreateIndex
CREATE INDEX "idx_thu_vien_tai_lieu_is_delete" ON "thu_vien_tai_lieu"("is_delete");

-- CreateIndex
CREATE UNIQUE INDEX "thu_vien_tag_ten_key" ON "thu_vien_tag"("ten");

-- CreateIndex
CREATE INDEX "idx_thu_vien_tag_is_active" ON "thu_vien_tag"("is_active");

-- CreateIndex
CREATE INDEX "idx_thu_vien_tag_is_delete" ON "thu_vien_tag"("is_delete");

-- CreateIndex
CREATE UNIQUE INDEX "thu_vien_tai_lieu_tag_id_tai_lieu_id_tag_key" ON "thu_vien_tai_lieu_tag"("id_tai_lieu", "id_tag");

-- CreateIndex
CREATE INDEX "idx_tl_file_id_tai_lieu" ON "thu_vien_tai_lieu_file"("id_tai_lieu");

-- CreateIndex
CREATE INDEX "idx_tl_file_la_phien_ban_hien_tai" ON "thu_vien_tai_lieu_file"("la_phien_ban_hien_tai");

-- CreateIndex
CREATE INDEX "idx_tl_quyen_id_tai_lieu" ON "thu_vien_tai_lieu_quyen"("id_tai_lieu");

-- CreateIndex
CREATE INDEX "idx_tl_quyen_id_vai_tro" ON "thu_vien_tai_lieu_quyen"("id_vai_tro");

-- AddForeignKey
ALTER TABLE "danh_gia_phan_anh" ADD CONSTRAINT "fk_danh_gia_phan_anh_phan_anh" FOREIGN KEY ("id_phan_anh") REFERENCES "phan_anh"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dang_ky_tiep_dan" ADD CONSTRAINT "fk_dang_ky_tiep_dan_lich_tiep_dan" FOREIGN KEY ("id_lich_tiep_dan") REFERENCES "lich_tiep_dan"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "danh_gia_tiep_dan" ADD CONSTRAINT "fk_danh_gia_tiep_dan_dang_ky" FOREIGN KEY ("id_dang_ky_tiep_dan") REFERENCES "dang_ky_tiep_dan"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_vien_tai_lieu" ADD CONSTRAINT "fk_thu_vien_tai_lieu_danh_muc" FOREIGN KEY ("id_danh_muc") REFERENCES "thu_vien_danh_muc"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_vien_tai_lieu_tag" ADD CONSTRAINT "fk_tlt_tag_tai_lieu" FOREIGN KEY ("id_tai_lieu") REFERENCES "thu_vien_tai_lieu"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_vien_tai_lieu_tag" ADD CONSTRAINT "fk_tlt_tag_tag" FOREIGN KEY ("id_tag") REFERENCES "thu_vien_tag"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_vien_tai_lieu_file" ADD CONSTRAINT "fk_tl_file_tai_lieu" FOREIGN KEY ("id_tai_lieu") REFERENCES "thu_vien_tai_lieu"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_vien_tai_lieu_quyen" ADD CONSTRAINT "fk_tl_quyen_tai_lieu" FOREIGN KEY ("id_tai_lieu") REFERENCES "thu_vien_tai_lieu"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_vien_tai_lieu_quyen" ADD CONSTRAINT "fk_tl_quyen_roles" FOREIGN KEY ("id_vai_tro") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
