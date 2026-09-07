-- Phase 1: Expand — thêm bảng mới + cột mới, KHÔNG xoá gì
-- Generated from plan-refine-dang-ky-tiep-dan.md

-- 1. Tạo bảng quay_tiep_dan
CREATE TABLE "quay_tiep_dan" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "ma_quay" VARCHAR(20) NOT NULL,
    "ten_quay" VARCHAR(100) NOT NULL,
    "so_thu_tu" INTEGER NOT NULL,
    "mo_ta" TEXT,
    "suc_chua_mac_dinh" INTEGER DEFAULT 2,
    "vi_tri" VARCHAR(255),
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    CONSTRAINT "quay_tiep_dan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ck_quay_tiep_dan_suc_chua" CHECK ("suc_chua_mac_dinh" >= 1)
);
CREATE UNIQUE INDEX "uq_quay_tiep_dan_ma_quay" ON "quay_tiep_dan"("ma_quay");
CREATE UNIQUE INDEX "uq_quay_tiep_dan_so_thu_tu" ON "quay_tiep_dan"("so_thu_tu");
CREATE INDEX "idx_quay_tiep_dan_trang_thai" ON "quay_tiep_dan"("is_active", "is_delete");
CREATE INDEX "idx_quay_tiep_dan_so_thu_tu" ON "quay_tiep_dan"("so_thu_tu");

-- Seed 8 quầy, tất cả suc_chua_mac_dinh = 2
INSERT INTO "quay_tiep_dan" ("id", "ma_quay", "ten_quay", "so_thu_tu", "vi_tri", "suc_chua_mac_dinh") VALUES
  (public.uuid_generate_v4(), 'QUAY_1', 'Quầy số 1', 1, 'Tầng 1, khu A', 2),
  (public.uuid_generate_v4(), 'QUAY_2', 'Quầy số 2', 2, 'Tầng 1, khu A', 2),
  (public.uuid_generate_v4(), 'QUAY_3', 'Quầy số 3', 3, 'Tầng 1, khu B', 2),
  (public.uuid_generate_v4(), 'QUAY_4', 'Quầy số 4', 4, 'Tầng 1, khu B', 2),
  (public.uuid_generate_v4(), 'QUAY_5', 'Quầy số 5', 5, 'Tầng 2, khu A', 2),
  (public.uuid_generate_v4(), 'QUAY_6', 'Quầy số 6', 6, 'Tầng 2, khu A', 2),
  (public.uuid_generate_v4(), 'QUAY_7', 'Quầy số 7', 7, 'Tầng 2, khu B', 2),
  (public.uuid_generate_v4(), 'QUAY_8', 'Quầy số 8', 8, 'Tầng 2, khu B', 2);

-- 2. Tạo bảng lich_gap_lanh_dao
CREATE TABLE "lich_gap_lanh_dao" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_lanh_dao" UUID NOT NULL,
    "ngay" DATE NOT NULL,
    "dia_diem" VARCHAR(255),
    "ghi_chu" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    CONSTRAINT "lich_gap_lanh_dao_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_lich_gap_lanh_dao_ngay" ON "lich_gap_lanh_dao"("id_lanh_dao", "ngay");
CREATE INDEX "idx_lich_gap_lanh_dao_id_lanh_dao" ON "lich_gap_lanh_dao"("id_lanh_dao");
CREATE INDEX "idx_lich_gap_lanh_dao_ngay" ON "lich_gap_lanh_dao"("ngay");
CREATE INDEX "idx_lich_gap_lanh_dao_trang_thai" ON "lich_gap_lanh_dao"("is_active", "is_delete");

ALTER TABLE "lich_gap_lanh_dao"
  ADD CONSTRAINT "fk_lich_gap_lanh_dao_lanh_dao"
  FOREIGN KEY ("id_lanh_dao") REFERENCES "nguoi_dung"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

-- 3. Tạo bảng khung_gio_gap_lanh_dao
CREATE TABLE "khung_gio_gap_lanh_dao" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_lich_gap" UUID NOT NULL,
    "gio_bat_dau" VARCHAR(10) NOT NULL,
    "gio_ket_thuc" VARCHAR(10) NOT NULL,
    "suc_chua" INTEGER DEFAULT 1,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    CONSTRAINT "khung_gio_gap_lanh_dao_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ck_khung_gio_gap_suc_chua" CHECK ("suc_chua" >= 1)
);
CREATE UNIQUE INDEX "uq_khung_gio_gap_lanh_dao" ON "khung_gio_gap_lanh_dao"("id_lich_gap", "gio_bat_dau", "gio_ket_thuc");
CREATE INDEX "idx_khung_gio_gap_lanh_dao_id_lich" ON "khung_gio_gap_lanh_dao"("id_lich_gap");
CREATE INDEX "idx_khung_gio_gap_lanh_dao_trang_thai" ON "khung_gio_gap_lanh_dao"("is_active", "is_delete");

ALTER TABLE "khung_gio_gap_lanh_dao"
  ADD CONSTRAINT "fk_khung_gio_gap_lanh_dao_lich"
  FOREIGN KEY ("id_lich_gap") REFERENCES "lich_gap_lanh_dao"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

-- 4. Tạo bảng dang_ky_gap_lanh_dao
CREATE TABLE "dang_ky_gap_lanh_dao" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "ma_dang_ky" VARCHAR(50) NOT NULL,
    "id_khung_gio_gap" UUID NOT NULL,
    "ho_ten" VARCHAR(150) NOT NULL,
    "sdt" VARCHAR(20) NOT NULL,
    "cccd" VARCHAR(20) NOT NULL,
    "ngay_cap_cccd" DATE,
    "noi_cap_cccd" VARCHAR(255),
    "dia_chi" TEXT NOT NULL,
    "ngay_lam_don" DATE,
    "ly_do" TEXT NOT NULL,
    "trang_thai" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "thoi_gian_phe_duyet" TIMESTAMP(6),
    "thoi_gian_hoan_thanh" TIMESTAMP(6),
    "thoi_gian_tu_choi" TIMESTAMP(6),
    "ly_do_tu_choi" TEXT,
    "nguoi_duyet_don" UUID,
    "nguoi_hoan_thanh" UUID,
    "nguoi_tu_choi" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_delete" BOOLEAN NOT NULL DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    CONSTRAINT "dang_ky_gap_lanh_dao_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ck_dang_ky_gap_trang_thai" CHECK ("trang_thai" IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'))
);
CREATE UNIQUE INDEX "uq_dang_ky_gap_lanh_dao_ma" ON "dang_ky_gap_lanh_dao"("ma_dang_ky");
CREATE INDEX "idx_dang_ky_gap_id_khung_gio" ON "dang_ky_gap_lanh_dao"("id_khung_gio_gap");
CREATE INDEX "idx_dang_ky_gap_sdt" ON "dang_ky_gap_lanh_dao"("sdt");
CREATE INDEX "idx_dang_ky_gap_cccd" ON "dang_ky_gap_lanh_dao"("cccd");
CREATE INDEX "idx_dang_ky_gap_trang_thai" ON "dang_ky_gap_lanh_dao"("trang_thai");
CREATE INDEX "idx_dang_ky_gap_thoi_gian_tao" ON "dang_ky_gap_lanh_dao"("thoi_gian_tao");

ALTER TABLE "dang_ky_gap_lanh_dao"
  ADD CONSTRAINT "fk_dang_ky_gap_khung_gio"
  FOREIGN KEY ("id_khung_gio_gap") REFERENCES "khung_gio_gap_lanh_dao"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "dang_ky_gap_lanh_dao"
  ADD CONSTRAINT "fk_dang_ky_gap_nguoi_duyet"
  FOREIGN KEY ("nguoi_duyet_don") REFERENCES "nguoi_dung"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "dang_ky_gap_lanh_dao"
  ADD CONSTRAINT "fk_dang_ky_gap_nguoi_hoan_thanh"
  FOREIGN KEY ("nguoi_hoan_thanh") REFERENCES "nguoi_dung"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "dang_ky_gap_lanh_dao"
  ADD CONSTRAINT "fk_dang_ky_gap_nguoi_tu_choi"
  FOREIGN KEY ("nguoi_tu_choi") REFERENCES "nguoi_dung"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

-- 5. Tạo bảng dinh_kem_dang_ky_gap_lanh_dao
CREATE TABLE "dinh_kem_dang_ky_gap_lanh_dao" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_dang_ky" UUID NOT NULL,
    "loai_dinh_kem" VARCHAR(30) NOT NULL,
    "ten_file_goc" VARCHAR(255) NOT NULL,
    "duong_dan_file" TEXT NOT NULL,
    "mime_type" VARCHAR(100),
    "kich_thuoc" INTEGER,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    CONSTRAINT "dinh_kem_dang_ky_gap_lanh_dao_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ck_dinh_kem_loai" CHECK ("loai_dinh_kem" IN ('CCCD_FRONT', 'CCCD_BACK', 'SUPPORTING_DOCUMENT')),
    CONSTRAINT "ck_dinh_kem_kich_thuoc" CHECK ("kich_thuoc" IS NULL OR "kich_thuoc" >= 0)
);
CREATE INDEX "idx_dinh_kem_gap_id_dang_ky" ON "dinh_kem_dang_ky_gap_lanh_dao"("id_dang_ky");

ALTER TABLE "dinh_kem_dang_ky_gap_lanh_dao"
  ADD CONSTRAINT "fk_dinh_kem_gap_dang_ky"
  FOREIGN KEY ("id_dang_ky") REFERENCES "dang_ky_gap_lanh_dao"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- 6. Tạo bảng danh_gia_gap_lanh_dao
CREATE TABLE "danh_gia_gap_lanh_dao" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_dang_ky_gap_lanh_dao" UUID NOT NULL,
    "diem_tong" INTEGER NOT NULL,
    "tieu_chi" JSONB,
    "ly_do" JSONB,
    "nhan_xet" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_delete" BOOLEAN NOT NULL DEFAULT false,
    "thoi_gian_tao" TIMESTAMP(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    CONSTRAINT "danh_gia_gap_lanh_dao_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ck_danh_gia_gap_diem_tong" CHECK ("diem_tong" BETWEEN 1 AND 5)
);
CREATE UNIQUE INDEX "uq_danh_gia_gap_lanh_dao_id_dang_ky" ON "danh_gia_gap_lanh_dao"("id_dang_ky_gap_lanh_dao");
CREATE INDEX "idx_danh_gia_gap_lanh_dao_diem_tong" ON "danh_gia_gap_lanh_dao"("diem_tong");

ALTER TABLE "danh_gia_gap_lanh_dao"
  ADD CONSTRAINT "fk_danh_gia_gap_lanh_dao_dang_ky"
  FOREIGN KEY ("id_dang_ky_gap_lanh_dao") REFERENCES "dang_ky_gap_lanh_dao"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

-- 7. Thêm cột mới vào dang_ky_tiep_dan (GIỮ nguyên cột cũ)
ALTER TABLE "dang_ky_tiep_dan"
  ADD COLUMN "id_quay" UUID;

ALTER TABLE "dang_ky_tiep_dan"
  ADD COLUMN "nguoi_duyet_don" UUID;

ALTER TABLE "dang_ky_tiep_dan"
  ADD COLUMN "id_khung_gio_tiep_dan" UUID;

ALTER TABLE "dang_ky_tiep_dan"
  ADD CONSTRAINT "fk_dang_ky_tiep_dan_quay"
  FOREIGN KEY ("id_quay") REFERENCES "quay_tiep_dan"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "dang_ky_tiep_dan"
  ADD CONSTRAINT "fk_dang_ky_tiep_dan_nguoi_duyet"
  FOREIGN KEY ("nguoi_duyet_don") REFERENCES "nguoi_dung"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "dang_ky_tiep_dan"
  ADD CONSTRAINT "fk_dang_ky_tiep_dan_khung_gio"
  FOREIGN KEY ("id_khung_gio_tiep_dan") REFERENCES "khung_gio_tiep_dan"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

-- 8. Thêm cột id_quay vào khung_gio_tiep_dan (GIỮ nguyên ma_quay)
ALTER TABLE "khung_gio_tiep_dan"
  ADD COLUMN "id_quay" UUID;

ALTER TABLE "khung_gio_tiep_dan"
  ADD CONSTRAINT "fk_khung_gio_tiep_dan_quay"
  FOREIGN KEY ("id_quay") REFERENCES "quay_tiep_dan"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

-- 9. Drop index cũ (nếu có) và tạo unique constraint mới với id_quay
DROP INDEX IF EXISTS "uq_khung_gio_tiep_dan_lich_slot_quay";
ALTER TABLE "khung_gio_tiep_dan"
  ADD CONSTRAINT "uq_khung_gio_tiep_dan_lich_slot_quay"
  UNIQUE ("id_lich_tiep_dan", "khung_gio", "id_quay");