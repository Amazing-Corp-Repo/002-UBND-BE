-- 0_init — BASELINE of the pre-existing database (adopted, not executed on prod/staging).
-- Schema-agnostic: object names are unqualified; the target schema is chosen by the
-- connection string ?schema= param. Mark as applied via: prisma migrate resolve --applied 0_init
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


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
CREATE TABLE "cach_thuc_thuc_hien" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_thu_tuc" UUID,
    "hinh_thuc_ap_dung" VARCHAR(255) NOT NULL,
    "mo_ta_chi_tiet" TEXT,
    "thoi_gian_giai_quyet" TEXT,
    "le_phi" VARCHAR(255),
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
CREATE TABLE "dinh_kem_phan_anh" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_phan_anh" UUID,
    "dinh_dang_file" VARCHAR(50),
    "url_file" VARCHAR(500),
    "kich_thuoc_file_mb" DECIMAL(10,2),
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "dinh_kem_phan_anh_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "lich_su_trang_thai" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_phan_anh" UUID NOT NULL,
    "ten" VARCHAR(255),
    "ghi_chu" TEXT,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "nguoi_tao" UUID,

    CONSTRAINT "lich_su_trang_thai_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "linh_vuc_phan_anh" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "ten" VARCHAR(255),
    "mo_ta" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "linh_vuc_phan_anh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linh_vuc_phan_anh_nguoi_quan_ly" (
    "id_linh_vuc_phan_anh" UUID NOT NULL,
    "id_nguoi_dung" UUID NOT NULL,
    "nguoi_tao" UUID NOT NULL,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "linh_vuc_phan_anh_nguoi_quan_ly_pkey" PRIMARY KEY ("id_linh_vuc_phan_anh","id_nguoi_dung")
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
    "is_enable_two_factor" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "fcm_token" VARCHAR[],

    CONSTRAINT "nguoi_dung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "user_id" UUID,
    "title" TEXT,
    "body" TEXT,
    "target_type" VARCHAR(50),
    "target_id" VARCHAR(255),
    "is_read" BOOLEAN DEFAULT false,
    "read_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "permissions" (
    "code" VARCHAR(150) NOT NULL,
    "description" VARCHAR(255),
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "phan_anh" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "ma_phan_anh" VARCHAR(255) NOT NULL,
    "id_linh_vuc_phan_anh" UUID,
    "tieu_de" TEXT,
    "mo_ta" TEXT,
    "muc_do" VARCHAR(255),
    "vi_tri" TEXT,
    "ten_nguoi_phan_anh" VARCHAR(255),
    "sdt_nguoi_phan_anh" VARCHAR(20),
    "thoi_gian_tiep_nhan" TIMESTAMP(6),
    "thoi_gian_phan_hoi_du_kien" TIMESTAMP(6),
    "ngay_du_kien_hoan_thanh" TIMESTAMP(6),
    "nguoi_cap_nhat" UUID,
    "nguoi_tao" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "id_video" VARCHAR(255)[],
    "id_to" UUID,
    "is_approve" BOOLEAN DEFAULT false,

    CONSTRAINT "phan_anh_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_code" VARCHAR(150) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_code")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "tin_tuc" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_danh_muc" UUID,
    "tieu_de" TEXT,
    "noi_dung" TEXT,
    "tac_gia" VARCHAR(255),
    "url_anh_dai_dien" VARCHAR(500),
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "is_noti" BOOLEAN DEFAULT false,

    CONSTRAINT "tin_tuc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tin_tuc_view" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_tin_tuc" UUID NOT NULL,
    "ip_address" VARCHAR(100),
    "device_info" TEXT,
    "view_count" INTEGER DEFAULT 1,
    "last_view_at" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "tin_tuc_view_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
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
CREATE TABLE "video_upload_chunks" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "upload_id" VARCHAR(255) NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "path" VARCHAR(500),
    "size_mb" DECIMAL(10,2),
    "created_at" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "video_upload_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_uploads" (
    "id" VARCHAR(255) NOT NULL,
    "total_chunks" INTEGER,
    "received_chunks" INTEGER DEFAULT 0,
    "status" VARCHAR(20) DEFAULT 'UPLOADING',
    "final_mp4_url" VARCHAR(500),
    "final_hls_url" VARCHAR(500),
    "created_at" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updated_at" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "video_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_co_so_dich_vu_cong_is_active" ON "co_so_dich_vu_cong"("is_active" ASC);

-- CreateIndex
CREATE INDEX "idx_co_so_dich_vu_cong_is_delete" ON "co_so_dich_vu_cong"("is_delete" ASC);

-- CreateIndex
CREATE INDEX "idx_co_so_dich_vu_cong_ten_co_so" ON "co_so_dich_vu_cong"("ten_co_so" ASC);

-- CreateIndex
CREATE INDEX "idx_co_so_dich_vu_cong_thoi_gian_tao" ON "co_so_dich_vu_cong"("thoi_gian_tao" ASC);

-- CreateIndex
CREATE INDEX "idx_danh_muc_tin_tuc_id" ON "danh_muc_tin_tuc"("id" ASC);

-- CreateIndex
CREATE INDEX "idx_danh_muc_tin_tuc_is_active" ON "danh_muc_tin_tuc"("is_active" ASC);

-- CreateIndex
CREATE INDEX "idx_danh_muc_tin_tuc_is_delete" ON "danh_muc_tin_tuc"("is_delete" ASC);

-- CreateIndex
CREATE INDEX "idx_danh_muc_tin_tuc_ten_danh_muc" ON "danh_muc_tin_tuc"("ten_danh_muc" ASC);

-- CreateIndex
CREATE INDEX "idx_dinh_kem_tin_tuc_id_tin_tuc" ON "dinh_kem_tin_tuc"("id_tin_tuc" ASC);

-- CreateIndex
CREATE INDEX "idx_lich_tiep_dan_is_active" ON "lich_tiep_dan"("is_active" ASC);

-- CreateIndex
CREATE INDEX "idx_lich_tiep_dan_is_delete" ON "lich_tiep_dan"("is_delete" ASC);

-- CreateIndex
CREATE INDEX "idx_lich_tiep_dan_ngay_tiep_dan" ON "lich_tiep_dan"("ngay_tiep_dan" ASC);

-- CreateIndex
CREATE INDEX "idx_lich_tiep_dan_ten_can_bo" ON "lich_tiep_dan"("ten_can_bo" ASC);

-- CreateIndex
CREATE INDEX "idx_linh_vuc_id" ON "linh_vuc"("id" ASC);

-- CreateIndex
CREATE INDEX "idx_linh_vuc_is_active" ON "linh_vuc"("is_active" ASC);

-- CreateIndex
CREATE INDEX "idx_linh_vuc_is_delete" ON "linh_vuc"("is_delete" ASC);

-- CreateIndex
CREATE INDEX "idx_linh_vuc_ten_linh_vuc" ON "linh_vuc"("ten_linh_vuc" ASC);

-- CreateIndex
CREATE INDEX "idx_linh_vuc_thoi_gian_tao" ON "linh_vuc"("thoi_gian_tao" ASC);

-- CreateIndex
CREATE INDEX "idx_linh_vuc_phan_anh_id" ON "linh_vuc_phan_anh"("id" ASC);

-- CreateIndex
CREATE INDEX "idx_linh_vuc_phan_anh_is_active" ON "linh_vuc_phan_anh"("is_active" ASC);

-- CreateIndex
CREATE INDEX "idx_linh_vuc_phan_anh_is_delete" ON "linh_vuc_phan_anh"("is_delete" ASC);

-- CreateIndex
CREATE INDEX "idx_linh_vuc_phan_anh_ten" ON "linh_vuc_phan_anh"("ten" ASC);

-- CreateIndex
CREATE INDEX "idx_linh_vuc_phan_anh_thoi_gian_tao" ON "linh_vuc_phan_anh"("thoi_gian_tao" ASC);

-- CreateIndex
CREATE INDEX "idx_mau_don_id" ON "mau_don"("id" ASC);

-- CreateIndex
CREATE INDEX "idx_mau_don_is_active" ON "mau_don"("is_active" ASC);

-- CreateIndex
CREATE INDEX "idx_mau_don_is_delete" ON "mau_don"("is_delete" ASC);

-- CreateIndex
CREATE INDEX "idx_mau_don_ma_mau_don" ON "mau_don"("ma_mau_don" ASC);

-- CreateIndex
CREATE INDEX "idx_mau_don_ten_mau_don" ON "mau_don"("ten_mau_don" ASC);

-- CreateIndex
CREATE INDEX "idx_mau_don_thoi_gian_tao" ON "mau_don"("thoi_gian_tao" ASC);

-- CreateIndex
CREATE INDEX "idx_nguoi_dung_email" ON "nguoi_dung"("email" ASC);

-- CreateIndex
CREATE INDEX "idx_nguoi_dung_is_active" ON "nguoi_dung"("is_active" ASC);

-- CreateIndex
CREATE INDEX "idx_nguoi_dung_is_delete" ON "nguoi_dung"("is_delete" ASC);

-- CreateIndex
CREATE INDEX "idx_nguoi_dung_ten_dang_nhap" ON "nguoi_dung"("ten_dang_nhap" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "nguoi_dung_email_key" ON "nguoi_dung"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "nguoi_dung_ten_dang_nhap_key" ON "nguoi_dung"("ten_dang_nhap" ASC);

-- CreateIndex
CREATE INDEX "idx_notifications_created_at" ON "notifications"("created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_notifications_id" ON "notifications"("id" ASC);

-- CreateIndex
CREATE INDEX "idx_notifications_is_read" ON "notifications"("is_read" ASC);

-- CreateIndex
CREATE INDEX "idx_notifications_user_id" ON "notifications"("user_id" ASC);

-- CreateIndex
CREATE INDEX "idx_otp_expires_at" ON "otp"("expires_at" ASC);

-- CreateIndex
CREATE INDEX "idx_otp_id_nguoi_dung" ON "otp"("id_nguoi_dung" ASC);

-- CreateIndex
CREATE INDEX "idx_otp_is_used" ON "otp"("is_used" ASC);

-- CreateIndex
CREATE INDEX "idx_otp_loai_otp" ON "otp"("loai_otp" ASC);

-- CreateIndex
CREATE INDEX "idx_otp_ma_otp" ON "otp"("ma_otp" ASC);

-- CreateIndex
CREATE INDEX "idx_permissions_code" ON "permissions"("code" ASC);

-- CreateIndex
CREATE INDEX "idx_permissions_description" ON "permissions"("description" ASC);

-- CreateIndex
CREATE INDEX "idx_phan_anh_id_linh_vuc_phan_anh" ON "phan_anh"("id_linh_vuc_phan_anh" ASC);

-- CreateIndex
CREATE INDEX "idx_phan_anh_id_to" ON "phan_anh"("id_to" ASC);

-- CreateIndex
CREATE INDEX "idx_phan_anh_id_video" ON "phan_anh"("id_video" ASC);

-- CreateIndex
CREATE INDEX "idx_phan_anh_is_approve" ON "phan_anh"("is_approve" ASC);

-- CreateIndex
CREATE INDEX "idx_phan_anh_ma_phan_anh" ON "phan_anh"("ma_phan_anh" ASC);

-- CreateIndex
CREATE INDEX "idx_phan_anh_nguoi_tao" ON "phan_anh"("nguoi_tao" ASC);

-- CreateIndex
CREATE INDEX "idx_phan_anh_thoi_gian_tao" ON "phan_anh"("thoi_gian_tao" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "phan_anh_ma_phan_anh_key" ON "phan_anh"("ma_phan_anh" ASC);

-- CreateIndex
CREATE INDEX "idx_refresh_token_id_nguoi_dung" ON "refresh_token"("id_nguoi_dung" ASC);

-- CreateIndex
CREATE INDEX "idx_refresh_token_is_revoked" ON "refresh_token"("is_revoked" ASC);

-- CreateIndex
CREATE INDEX "idx_refresh_token_revoked_by_ip" ON "refresh_token"("revoked_by_ip" ASC);

-- CreateIndex
CREATE INDEX "idx_refresh_token_token_hash" ON "refresh_token"("token_hash" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash" ASC);

-- CreateIndex
CREATE INDEX "idx_roles_is_active_is_delete" ON "roles"("is_active" ASC, "is_delete" ASC);

-- CreateIndex
CREATE INDEX "idx_roles_name" ON "roles"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name" ASC);

-- CreateIndex
CREATE INDEX "idx_thu_tuc_is_active_is_delete" ON "thu_tuc_hanh_chinh"("is_active" ASC, "is_delete" ASC);

-- CreateIndex
CREATE INDEX "idx_thu_tuc_name_code" ON "thu_tuc_hanh_chinh"("ten_thu_tuc" ASC, "ma_thu_tuc" ASC);

-- CreateIndex
CREATE INDEX "idx_tin_tuc_id_danh_muc" ON "tin_tuc"("id_danh_muc" ASC);

-- CreateIndex
CREATE INDEX "idx_tin_tuc_is_active_is_delete" ON "tin_tuc"("is_active" ASC, "is_delete" ASC);

-- CreateIndex
CREATE INDEX "idx_tin_tuc_tieu_de" ON "tin_tuc"("tieu_de" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "tin_tuc_view_id_tin_tuc_ip_address_device_info_key" ON "tin_tuc_view"("id_tin_tuc" ASC, "ip_address" ASC, "device_info" ASC);

-- CreateIndex
CREATE INDEX "idx_user_session_logs_id_nguoi_dung" ON "user_session_logs"("id_nguoi_dung" ASC);

-- CreateIndex
CREATE INDEX "idx_user_session_logs_is_active" ON "user_session_logs"("is_active" ASC);

-- CreateIndex
CREATE INDEX "idx_user_session_logs_thoi_gian_dang_xuat" ON "user_session_logs"("thoi_gian_dang_xuat" ASC);

-- CreateIndex
CREATE INDEX "idx_video_uploads_created_at" ON "video_uploads"("created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_video_uploads_status" ON "video_uploads"("status" ASC);

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "fk_audit_logs_performed_by" FOREIGN KEY ("performed_by") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

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
ALTER TABLE "danh_muc_tin_tuc" ADD CONSTRAINT "fk_danh_muc_tin_tuc_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "danh_muc_tin_tuc" ADD CONSTRAINT "fk_danh_muc_tin_tuc_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dinh_kem_phan_anh" ADD CONSTRAINT "fk_dinh_kem_phan_anh_phan_anh" FOREIGN KEY ("id_phan_anh") REFERENCES "phan_anh"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dinh_kem_tin_tuc" ADD CONSTRAINT "fk_dinh_kem_tin_tuc_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dinh_kem_tin_tuc" ADD CONSTRAINT "fk_dinh_kem_tin_tuc_tin_tuc" FOREIGN KEY ("id_tin_tuc") REFERENCES "tin_tuc"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lich_su_trang_thai" ADD CONSTRAINT "fk_lich_su_trang_thai_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lich_su_trang_thai" ADD CONSTRAINT "fk_lich_su_trang_thai_phan_anh" FOREIGN KEY ("id_phan_anh") REFERENCES "phan_anh"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lich_tiep_dan" ADD CONSTRAINT "fk_lich_tiep_dan_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lich_tiep_dan" ADD CONSTRAINT "fk_lich_tiep_dan_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "linh_vuc" ADD CONSTRAINT "fk_linh_vuc_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "linh_vuc" ADD CONSTRAINT "fk_linh_vuc_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "linh_vuc_phan_anh" ADD CONSTRAINT "fk_linh_vuc_phan_anh_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "linh_vuc_phan_anh" ADD CONSTRAINT "fk_linh_vuc_phan_anh_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "linh_vuc_phan_anh_nguoi_quan_ly" ADD CONSTRAINT "fk_lvpq_linh_vuc_phan_anh" FOREIGN KEY ("id_linh_vuc_phan_anh") REFERENCES "linh_vuc_phan_anh"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "linh_vuc_phan_anh_nguoi_quan_ly" ADD CONSTRAINT "fk_lvpq_nguoi_dung" FOREIGN KEY ("id_nguoi_dung") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "linh_vuc_phan_anh_nguoi_quan_ly" ADD CONSTRAINT "fk_lvpq_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mau_don" ADD CONSTRAINT "fk_mau_don_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mau_don" ADD CONSTRAINT "fk_mau_don_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_user" FOREIGN KEY ("user_id") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "otp" ADD CONSTRAINT "fk_otp_nguoi_dung" FOREIGN KEY ("id_nguoi_dung") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "phan_anh" ADD CONSTRAINT "fk_linh_vuc_phan_anh_phan_anh" FOREIGN KEY ("id_linh_vuc_phan_anh") REFERENCES "linh_vuc_phan_anh"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "phan_anh" ADD CONSTRAINT "fk_phan_anh_id_to_nguoi_dung" FOREIGN KEY ("id_to") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phan_anh" ADD CONSTRAINT "fk_phan_anh_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "phan_anh" ADD CONSTRAINT "fk_phan_anh_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "fk_refresh_token_nguoi_dung" FOREIGN KEY ("id_nguoi_dung") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "fk_role_permissions_perm" FOREIGN KEY ("permission_code") REFERENCES "permissions"("code") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "fk_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "fk_roles_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "fk_roles_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thanh_phan_ho_so" ADD CONSTRAINT "fk_thanh_phan_ho_so_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thanh_phan_ho_so" ADD CONSTRAINT "fk_thanh_phan_ho_so_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thanh_phan_ho_so" ADD CONSTRAINT "fk_thanh_phan_ho_so_truong_hop" FOREIGN KEY ("id_truong_hop") REFERENCES "truong_hop_thu_tuc"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

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
ALTER TABLE "tin_tuc" ADD CONSTRAINT "fk_tin_tuc_danh_muc" FOREIGN KEY ("id_danh_muc") REFERENCES "danh_muc_tin_tuc"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tin_tuc" ADD CONSTRAINT "fk_tin_tuc_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tin_tuc" ADD CONSTRAINT "fk_tin_tuc_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tin_tuc_view" ADD CONSTRAINT "fk_tin_tuc_view__tin_tuc" FOREIGN KEY ("id_tin_tuc") REFERENCES "tin_tuc"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trinh_tu_thuc_hien_thu_tuc" ADD CONSTRAINT "fk_trinh_tu_thuc_hien_thu_tuc_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trinh_tu_thuc_hien_thu_tuc" ADD CONSTRAINT "fk_trinh_tu_thuc_hien_thu_tuc_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trinh_tu_thuc_hien_thu_tuc" ADD CONSTRAINT "fk_trinh_tu_thuc_hien_thu_tuc_thu_tuc" FOREIGN KEY ("id_thu_tuc") REFERENCES "thu_tuc_hanh_chinh"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "truong_hop_thu_tuc" ADD CONSTRAINT "fk_truong_hop_thu_tuc_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "truong_hop_thu_tuc" ADD CONSTRAINT "fk_truong_hop_thu_tuc_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "truong_hop_thu_tuc" ADD CONSTRAINT "fk_truong_hop_thu_tuc_thu_tuc" FOREIGN KEY ("id_thu_tuc") REFERENCES "thu_tuc_hanh_chinh"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "fk_user_roles_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "fk_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_session_logs" ADD CONSTRAINT "fk_user_session_logs_nguoi_dung" FOREIGN KEY ("id_nguoi_dung") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "uy_ban" ADD CONSTRAINT "fk_uy_ban_nguoi_cap_nhat" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "uy_ban" ADD CONSTRAINT "fk_uy_ban_nguoi_tao" FOREIGN KEY ("nguoi_tao") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "video_upload_chunks" ADD CONSTRAINT "fk_video_upload_chunks_upload_id" FOREIGN KEY ("upload_id") REFERENCES "video_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

