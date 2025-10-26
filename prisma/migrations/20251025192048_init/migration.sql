-- CreateTable
CREATE TABLE "nguoi_dung" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ten_dang_nhap" VARCHAR(100) NOT NULL,
    "mat_khau" VARCHAR(255) NOT NULL,
    "ho_va_ten" VARCHAR(150),
    "email" VARCHAR(150),
    "so_dien_thoai" VARCHAR(20),
    "vai_tro" VARCHAR(20),
    "trang_thai" BOOLEAN DEFAULT true,
    "is_enable_two_factor" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhap" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhap" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "nguoi_dung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nguoi_dung_id" UUID NOT NULL,
    "ma_otp" VARCHAR(10) NOT NULL,
    "loai_otp" VARCHAR(50) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "is_used" BOOLEAN DEFAULT false,
    "sent_to_email" VARCHAR(150),

    CONSTRAINT "otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nguoi_dung_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_by_ip" INET,
    "device" VARCHAR(100),
    "is_revoked" BOOLEAN DEFAULT false,
    "revoked_by_ip" INET,
    "replaced_by_token_hash" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updated_at" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_session_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nguoi_dung_id" UUID NOT NULL,
    "ip" INET,
    "device" VARCHAR(100),
    "thoi_gian_dang_nhap" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_dang_xuat" TIMESTAMP(6),
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "user_session_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "table_name" VARCHAR(100) NOT NULL,
    "record_id" UUID NOT NULL,
    "action" VARCHAR(10) NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "performed_by" UUID,
    "performed_at" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "co_so_dich_vu_cong" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "id_uy_ban" UUID,
    "ten_co_so" VARCHAR(255) NOT NULL,
    "dia_chi" VARCHAR(500),
    "so_dien_thoai" VARCHAR(20),
    "mo_ta" TEXT,
    "toa_do_gps" VARCHAR(100),
    "is_removed" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhap" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhap" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "co_so_dich_vu_cong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linh_vuc" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ten_linh_vuc" VARCHAR(255) NOT NULL,
    "mo_ta" TEXT,
    "is_remove" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhap" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhap" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "linh_vuc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mau_don" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ten_mau_don" VARCHAR(255) NOT NULL,
    "mo_ta" TEXT,
    "url_file_pdf" VARCHAR(500) NOT NULL,
    "kich_thuoc_file_mb" DECIMAL(10,2),
    "is_removed" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhap" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhap" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "mau_don_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thu_tuc_hanh_chinh" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "id_co_so_dich_vu_cong" UUID,
    "ten_loai_thu_tuc" VARCHAR(255) NOT NULL,
    "ma_loai_thu_tuc" VARCHAR(50) NOT NULL,
    "ten_thu_tuc" VARCHAR(255) NOT NULL,
    "ma_thu_tuc" VARCHAR(50) NOT NULL,
    "co_quan_ban_hanh" INTEGER NOT NULL,
    "doi_tuong_thuc_hien" VARCHAR(255),
    "url_thong_tin_chi_tiet_pdf" VARCHAR(500),
    "yeu_cau_dieu_kien_chung" TEXT,
    "so_quyet_dinh" VARCHAR(255) NOT NULL,
    "is_removed" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhap" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhap" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "thu_tuc_hanh_chinh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thu_tuc_hanh_chinh_linh_vuc" (
    "id_thu_tuc_hanh_chinh" UUID NOT NULL,
    "id_linh_vuc" UUID NOT NULL,

    CONSTRAINT "thu_tuc_hanh_chinh_linh_vuc_pkey" PRIMARY KEY ("id_thu_tuc_hanh_chinh","id_linh_vuc")
);

-- CreateTable
CREATE TABLE "thu_tuc_hanh_chinh_mau_don" (
    "id_thu_tuc" UUID NOT NULL,
    "id_mau_don" UUID NOT NULL,
    "ghi_chu" TEXT,
    "so_luong_ban_chinh" INTEGER,
    "so_luong_ban_sao" INTEGER,

    CONSTRAINT "thu_tuc_hanh_chinh_mau_don_pkey" PRIMARY KEY ("id_thu_tuc","id_mau_don")
);

-- CreateTable
CREATE TABLE "trinh_tu_thuc_hien_thu_tuc" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "id_thu_tuc" UUID NOT NULL,
    "ten_buoc" VARCHAR(255) NOT NULL,
    "mo_ta_buoc" TEXT,
    "thu_tu_buoc" INTEGER NOT NULL,
    "is_removed" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhap" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhap" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "trinh_tu_thuc_hien_thu_tuc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uy_ban" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ten_don_vi" VARCHAR(255) NOT NULL,
    "dia_chi_tru_so" VARCHAR(500),
    "so_dien_thoai" VARCHAR(20),
    "email" VARCHAR(100),
    "gio_lam_viec" VARCHAR(255),
    "link_google_map" VARCHAR(500),
    "toa_do_gps" VARCHAR(100),
    "is_removed" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhap" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhap" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "uy_ban_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nguoi_dung_ten_dang_nhap_key" ON "nguoi_dung"("ten_dang_nhap");

-- CreateIndex
CREATE UNIQUE INDEX "nguoi_dung_email_key" ON "nguoi_dung"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "linh_vuc_ten_linh_vuc_key" ON "linh_vuc"("ten_linh_vuc");

-- CreateIndex
CREATE UNIQUE INDEX "thu_tuc_hanh_chinh_ma_loai_thu_tuc_key" ON "thu_tuc_hanh_chinh"("ma_loai_thu_tuc");

-- CreateIndex
CREATE UNIQUE INDEX "thu_tuc_hanh_chinh_ma_thu_tuc_key" ON "thu_tuc_hanh_chinh"("ma_thu_tuc");

-- AddForeignKey
ALTER TABLE "otp" ADD CONSTRAINT "fk_otp_nguoi_dung" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "fk_fresh_token_nguoi_dung" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_session_logs" ADD CONSTRAINT "fk_user_session_logs_nguoi_dung" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "fk_audit_logs_nguoi_dung" FOREIGN KEY ("performed_by") REFERENCES "nguoi_dung"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "co_so_dich_vu_cong" ADD CONSTRAINT "fk_co_so_dich_vu_cong_uy_ban" FOREIGN KEY ("id_uy_ban") REFERENCES "uy_ban"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "co_so_dich_vu_cong" ADD CONSTRAINT "fk_dich_vu_cong_nguoi_cap_nhap" FOREIGN KEY ("nguoi_cap_nhap") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "co_so_dich_vu_cong" ADD CONSTRAINT "fk_dich_vu_cong_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "linh_vuc" ADD CONSTRAINT "fk_linh_vuc_nguoi_cap_nhap" FOREIGN KEY ("nguoi_cap_nhap") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "linh_vuc" ADD CONSTRAINT "fk_linh_vuc_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mau_don" ADD CONSTRAINT "fk_mau_don_nguoi_cap_nhap" FOREIGN KEY ("nguoi_cap_nhap") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mau_don" ADD CONSTRAINT "fk_mau_don_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_tuc_hanh_chinh" ADD CONSTRAINT "fk_thu_tuc_hanh_chinh_co_so_dich_vu_cong" FOREIGN KEY ("id_co_so_dich_vu_cong") REFERENCES "co_so_dich_vu_cong"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_tuc_hanh_chinh" ADD CONSTRAINT "fk_thu_tuc_hanh_chinh_nguoi_cap_nhap" FOREIGN KEY ("nguoi_cap_nhap") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_tuc_hanh_chinh" ADD CONSTRAINT "fk_thu_tuc_hanh_chinh_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_tuc_hanh_chinh_linh_vuc" ADD CONSTRAINT "fk_thuc_hanh_chinh_linh_vuc_linh_vuc" FOREIGN KEY ("id_linh_vuc") REFERENCES "linh_vuc"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_tuc_hanh_chinh_linh_vuc" ADD CONSTRAINT "fk_thuc_hanh_chinh_linh_vuc_thu_tuc" FOREIGN KEY ("id_thu_tuc_hanh_chinh") REFERENCES "thu_tuc_hanh_chinh"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_tuc_hanh_chinh_mau_don" ADD CONSTRAINT "fk_thu_tuc_hanh_chinh_mau_don_mau_don" FOREIGN KEY ("id_mau_don") REFERENCES "mau_don"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_tuc_hanh_chinh_mau_don" ADD CONSTRAINT "fk_thu_tuc_hanh_chinh_mau_don_thu_tuc_hanh_chinh" FOREIGN KEY ("id_thu_tuc") REFERENCES "thu_tuc_hanh_chinh"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trinh_tu_thuc_hien_thu_tuc" ADD CONSTRAINT "fk_trinh_tu_thuc_hien_thu_tuc_nguoi_cap_nhap" FOREIGN KEY ("nguoi_cap_nhap") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trinh_tu_thuc_hien_thu_tuc" ADD CONSTRAINT "fk_trinh_tu_thuc_hien_thu_tuc_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trinh_tu_thuc_hien_thu_tuc" ADD CONSTRAINT "fk_trinh_tu_thuc_hien_thu_tuc_thu_tuc" FOREIGN KEY ("id_thu_tuc") REFERENCES "thu_tuc_hanh_chinh"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "uy_ban" ADD CONSTRAINT "fk_uy_ban_nguoi_cap_nhap" FOREIGN KEY ("nguoi_cap_nhap") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "uy_ban" ADD CONSTRAINT "fk_uy_ban_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
