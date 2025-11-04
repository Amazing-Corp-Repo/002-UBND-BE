CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "cach_thuc_thuc_hien" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_thu_tuc" UUID,
    "hinh_thuc_ap_dung" VARCHAR(255) NOT NULL,
    "mo_ta_chi_tiet" TEXT,
    "thoi_gian_giai_quyet" TEXT,
    "le_phi" DECIMAL(10,2) DEFAULT 0,
    "ghi_chu_le_phi" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "cach_thuc_thuc_hien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "co_so_dich_vu_cong" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "ten_co_so" VARCHAR(255) NOT NULL,
    "dia_chi" VARCHAR(500),
    "so_dien_thoai" VARCHAR(20),
    "mo_ta" TEXT,
    "link_google_map" VARCHAR(500),
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "co_so_dich_vu_cong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linh_vuc" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "ten_linh_vuc" VARCHAR(255) NOT NULL,
    "mo_ta" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "linh_vuc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mau_don" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "ten_mau_don" VARCHAR(255) NOT NULL,
    "mo_ta" TEXT,
    "ma_mau_don" VARCHAR(50),
    "url_file_pdf" VARCHAR(500) NOT NULL,
    "kich_thuoc_file_mb" DECIMAL(10,2),
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "mau_don_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nguoi_dung" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "ten_dang_nhap" VARCHAR(100) NOT NULL,
    "mat_khau" VARCHAR(255) NOT NULL,
    "ho_va_ten" VARCHAR(150),
    "email" VARCHAR(150),
    "so_dien_thoai" VARCHAR(20),
    "vai_tro" VARCHAR(20),
    "is_enable_two_factor" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "nguoi_dung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_nguoi_dung" UUID NOT NULL,
    "ma_otp" VARCHAR(10) NOT NULL,
    "loai_otp" VARCHAR(50) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "is_used" BOOLEAN DEFAULT false,
    "sent_to_email" VARCHAR(150),

    CONSTRAINT "otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_nguoi_dung" UUID NOT NULL,
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
CREATE TABLE "thu_tuc_hanh_chinh" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_co_so_dich_vu_cong" UUID,
    "ten_thu_tuc" VARCHAR(255) NOT NULL,
    "ma_thu_tuc" VARCHAR(50),
    "doi_tuong_thuc_hien" VARCHAR(255),
    "yeu_cau_dieu_kien_chung" TEXT,
    "so_quyet_dinh" VARCHAR(255),
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "thu_tuc_hanh_chinh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thu_tuc_hanh_chinh_linh_vuc" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_thu_tuc_hanh_chinh" UUID NOT NULL,
    "id_linh_vuc" UUID NOT NULL,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "thu_tuc_hanh_chinh_linh_vuc_pkey" PRIMARY KEY ("id_thu_tuc_hanh_chinh","id_linh_vuc")
);

-- CreateTable
CREATE TABLE "thu_tuc_hanh_chinh_mau_don" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_thu_tuc" UUID NOT NULL,
    "id_mau_don" UUID NOT NULL,
    "ghi_chu" TEXT,
    "so_luong_ban_chinh" INTEGER,
    "so_luong_ban_sao" INTEGER,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "thu_tuc_hanh_chinh_mau_don_pkey" PRIMARY KEY ("id_thu_tuc","id_mau_don")
);

-- CreateTable
CREATE TABLE "trinh_tu_thuc_hien_thu_tuc" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_thu_tuc" UUID NOT NULL,
    "ten_buoc" VARCHAR(255) NOT NULL,
    "mo_ta_buoc" TEXT,
    "thu_tu_buoc" INTEGER NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "trinh_tu_thuc_hien_thu_tuc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_session_logs" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_nguoi_dung" UUID NOT NULL,
    "ip" INET,
    "device" VARCHAR(100),
    "thoi_gian_dang_nhap" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_dang_xuat" TIMESTAMP(6),
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "user_session_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uy_ban" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "ten_don_vi" VARCHAR(255) NOT NULL,
    "dia_chi_tru_so" VARCHAR(500),
    "so_dien_thoai" VARCHAR(20),
    "email" VARCHAR(100),
    "gio_lam_viec" JSONB,
    "link_google_map" VARCHAR(500),
    "ghi_chu" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "uy_ban_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "danh_muc_tin_tuc" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "ten_danh_muc" VARCHAR(255) NOT NULL,
    "mo_ta" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "danh_muc_tin_tuc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dinh_kem_tin_tuc" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_tin_tuc" UUID,
    "dinh_dang_file" VARCHAR(50),
    "url_file" VARCHAR(500),
    "kich_thuoc_file_mb" DECIMAL(10,2),
    "nguoi_tao" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "dinh_kem_tin_tuc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tin_tuc" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_danh_muc" UUID,
    "tieu_de" TEXT,
    "noi_dung" TEXT,
    "trang_thai" VARCHAR(50),
    "tac_gia" VARCHAR(255),
    "url_anh_dai_dien" VARCHAR(500),
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "tin_tuc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lich_tiep_dan" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "dia_diem" VARCHAR(255) NOT NULL,
    "ten_can_bo" VARCHAR(255) NOT NULL,
    "thoi_gian" VARCHAR(50),
    "ngay_tiep_dan" DATE,
    "ghi_chu" VARCHAR(255),
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "lich_tiep_dan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "local_address" INET,
    "remote_address" INET,
    "table_name" VARCHAR(255),
    "action" VARCHAR(255),
    "performed_by" UUID,
    "username" VARCHAR(100),
    "request_received_at" TIMESTAMP(6),
    "response_sent_at" TIMESTAMP(6),
    "duration_ms" INTEGER,
    "response_status_code" INTEGER,
    "request_body" JSONB,
    "response_body" JSONB,
    "timestamp" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thanh_phan_ho_so" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_truong_hop" UUID NOT NULL,
    "ten_thanh_phan" VARCHAR(255) NOT NULL,
    "mo_ta_chi_tiet" TEXT,
    "so_luong_ban_chinh" INTEGER DEFAULT 0,
    "so_luong_ban_sao" INTEGER DEFAULT 0,
    "ghi_chu" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "thanh_phan_ho_so_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "truong_hop_thu_tuc" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_thu_tuc" UUID NOT NULL,
    "ten_truong_hop" VARCHAR(255) NOT NULL,
    "mo_ta" TEXT,
    "thu_tu" INTEGER DEFAULT 1,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "truong_hop_thu_tuc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nguoi_dung_ten_dang_nhap_key" ON "nguoi_dung"("ten_dang_nhap");

-- CreateIndex
CREATE UNIQUE INDEX "nguoi_dung_email_key" ON "nguoi_dung"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash");

-- AddForeignKey
ALTER TABLE "cach_thuc_thuc_hien" ADD CONSTRAINT "fk_cach_thuc_thuc_hien_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cach_thuc_thuc_hien" ADD CONSTRAINT "fk_cach_thuc_thuc_hien_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cach_thuc_thuc_hien" ADD CONSTRAINT "fk_cach_thuc_thuc_hien_thu_tuc" FOREIGN KEY ("id_thu_tuc") REFERENCES "thu_tuc_hanh_chinh"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "co_so_dich_vu_cong" ADD CONSTRAINT "fk_dich_vu_cong_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "co_so_dich_vu_cong" ADD CONSTRAINT "fk_dich_vu_cong_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "linh_vuc" ADD CONSTRAINT "fk_linh_vuc_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "linh_vuc" ADD CONSTRAINT "fk_linh_vuc_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mau_don" ADD CONSTRAINT "fk_mau_don_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mau_don" ADD CONSTRAINT "fk_mau_don_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "otp" ADD CONSTRAINT "fk_otp_nguoi_dung" FOREIGN KEY ("id_nguoi_dung") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "fk_refresh_token_nguoi_dung" FOREIGN KEY ("id_nguoi_dung") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_tuc_hanh_chinh" ADD CONSTRAINT "fk_thu_tuc_hanh_chinh_co_so_dich_vu_cong" FOREIGN KEY ("id_co_so_dich_vu_cong") REFERENCES "co_so_dich_vu_cong"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_tuc_hanh_chinh" ADD CONSTRAINT "fk_thu_tuc_hanh_chinh_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_tuc_hanh_chinh" ADD CONSTRAINT "fk_thu_tuc_hanh_chinh_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_tuc_hanh_chinh_linh_vuc" ADD CONSTRAINT "fk_thuc_hanh_chinh_linh_vuc_linh_vuc" FOREIGN KEY ("id_linh_vuc") REFERENCES "linh_vuc"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_tuc_hanh_chinh_linh_vuc" ADD CONSTRAINT "fk_thuc_hanh_chinh_linh_vuc_thu_tuc" FOREIGN KEY ("id_thu_tuc_hanh_chinh") REFERENCES "thu_tuc_hanh_chinh"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_tuc_hanh_chinh_mau_don" ADD CONSTRAINT "fk_thu_tuc_hanh_chinh_mau_don_mau_don" FOREIGN KEY ("id_mau_don") REFERENCES "mau_don"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_tuc_hanh_chinh_mau_don" ADD CONSTRAINT "fk_thu_tuc_hanh_chinh_mau_don_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_tuc_hanh_chinh_mau_don" ADD CONSTRAINT "fk_thu_tuc_hanh_chinh_mau_don_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thu_tuc_hanh_chinh_mau_don" ADD CONSTRAINT "fk_thu_tuc_hanh_chinh_mau_don_thu_tuc_hanh_chinh" FOREIGN KEY ("id_thu_tuc") REFERENCES "thu_tuc_hanh_chinh"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trinh_tu_thuc_hien_thu_tuc" ADD CONSTRAINT "fk_trinh_tu_thuc_hien_thu_tuc_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trinh_tu_thuc_hien_thu_tuc" ADD CONSTRAINT "fk_trinh_tu_thuc_hien_thu_tuc_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trinh_tu_thuc_hien_thu_tuc" ADD CONSTRAINT "fk_trinh_tu_thuc_hien_thu_tuc_thu_tuc" FOREIGN KEY ("id_thu_tuc") REFERENCES "thu_tuc_hanh_chinh"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_session_logs" ADD CONSTRAINT "fk_user_session_logs_nguoi_dung" FOREIGN KEY ("id_nguoi_dung") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "uy_ban" ADD CONSTRAINT "fk_uy_ban_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "uy_ban" ADD CONSTRAINT "fk_uy_ban_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "danh_muc_tin_tuc" ADD CONSTRAINT "fk_danh_muc_tin_tuc_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "danh_muc_tin_tuc" ADD CONSTRAINT "fk_danh_muc_tin_tuc_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dinh_kem_tin_tuc" ADD CONSTRAINT "fk_dinh_kem_tin_tuc_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dinh_kem_tin_tuc" ADD CONSTRAINT "fk_dinh_kem_tin_tuc_tin_tuc" FOREIGN KEY ("id_tin_tuc") REFERENCES "tin_tuc"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tin_tuc" ADD CONSTRAINT "fk_tin_tuc_danh_muc" FOREIGN KEY ("id_danh_muc") REFERENCES "danh_muc_tin_tuc"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tin_tuc" ADD CONSTRAINT "fk_tin_tuc_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tin_tuc" ADD CONSTRAINT "fk_tin_tuc_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lich_tiep_dan" ADD CONSTRAINT "fk_lich_tiep_dan_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lich_tiep_dan" ADD CONSTRAINT "fk_lich_tiep_dan_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thanh_phan_ho_so" ADD CONSTRAINT "fk_thanh_phan_ho_so_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thanh_phan_ho_so" ADD CONSTRAINT "fk_thanh_phan_ho_so_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thanh_phan_ho_so" ADD CONSTRAINT "fk_thanh_phan_ho_so_truong_hop" FOREIGN KEY ("id_truong_hop") REFERENCES "truong_hop_thu_tuc"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "truong_hop_thu_tuc" ADD CONSTRAINT "fk_truong_hop_thu_tuc_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "truong_hop_thu_tuc" ADD CONSTRAINT "fk_truong_hop_thu_tuc_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "truong_hop_thu_tuc" ADD CONSTRAINT "fk_truong_hop_thu_tuc_thu_tuc" FOREIGN KEY ("id_thu_tuc") REFERENCES "thu_tuc_hanh_chinh"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
