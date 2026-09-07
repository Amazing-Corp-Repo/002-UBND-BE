-- Phase 2: V2 — Normalize ca_tiep_dan + phan_cong_quay_tiep_dan
-- EXPAND only: add new tables, columns, indexes. No destructive changes.
-- Generated from docs/plan-refine-dang-ky-tiep-dan (2).md

BEGIN;

-- ============================================
-- 1. Create ca_tiep_dan table
--    A "ca" is a time slot within a lich_tiep_dan, not tied to any counter.
-- ============================================
CREATE TABLE "ca_tiep_dan" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_lich_tiep_dan" UUID NOT NULL,
    "gio_bat_dau" TIME(0) NOT NULL,
    "gio_ket_thuc" TIME(0) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_delete" BOOLEAN NOT NULL DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    CONSTRAINT "ca_tiep_dan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ck_ca_tiep_dan_thoi_gian" CHECK ("gio_bat_dau" < "gio_ket_thuc")
);
CREATE UNIQUE INDEX "uq_ca_tiep_dan_lich_thoi_gian" ON "ca_tiep_dan"("id_lich_tiep_dan", "gio_bat_dau", "gio_ket_thuc");
CREATE INDEX "idx_ca_tiep_dan_id_lich" ON "ca_tiep_dan"("id_lich_tiep_dan");
CREATE INDEX "idx_ca_tiep_dan_trang_thai" ON "ca_tiep_dan"("is_active", "is_delete");

ALTER TABLE "ca_tiep_dan"
  ADD CONSTRAINT "fk_ca_tiep_dan_lich"
  FOREIGN KEY ("id_lich_tiep_dan") REFERENCES "lich_tiep_dan"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

-- ============================================
-- 2. Add id_ca_tiep_dan to khung_gio_tiep_dan
-- ============================================
ALTER TABLE "khung_gio_tiep_dan"
  ADD COLUMN "id_ca_tiep_dan" UUID;

ALTER TABLE "khung_gio_tiep_dan"
  ADD CONSTRAINT "fk_khung_gio_tiep_dan_ca"
  FOREIGN KEY ("id_ca_tiep_dan") REFERENCES "ca_tiep_dan"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

-- New unique constraint on (id_ca_tiep_dan, id_quay) — different name from existing V1 constraint
CREATE UNIQUE INDEX "uq_khung_gio_tiep_dan_ca_quay_v2"
  ON "khung_gio_tiep_dan" ("id_ca_tiep_dan", "id_quay");

-- New index for id_quay lookups
CREATE INDEX "idx_khung_gio_tiep_dan_id_quay"
  ON "khung_gio_tiep_dan" ("id_quay");

-- Rename existing trang_thai index to avoid naming collision ambiguity
DROP INDEX IF EXISTS "idx_khung_gio_tiep_dan_trang_thai";
CREATE INDEX "idx_khung_gio_tiep_dan_trang_thai_v2"
  ON "khung_gio_tiep_dan" ("is_active", "is_delete");

-- ============================================
-- 3. Create phan_cong_quay_tiep_dan table
--    Assigns officers to specific counter configurations (khung_gio_tiep_dan)
-- ============================================
CREATE TABLE "phan_cong_quay_tiep_dan" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_cau_hinh_quay" UUID NOT NULL,
    "id_can_bo" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_delete" BOOLEAN NOT NULL DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    CONSTRAINT "phan_cong_quay_tiep_dan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_phan_cong_quay_cau_hinh" ON "phan_cong_quay_tiep_dan"("id_cau_hinh_quay");
CREATE INDEX "idx_phan_cong_quay_id_can_bo" ON "phan_cong_quay_tiep_dan"("id_can_bo");
CREATE INDEX "idx_phan_cong_quay_trang_thai" ON "phan_cong_quay_tiep_dan"("is_active", "is_delete");

ALTER TABLE "phan_cong_quay_tiep_dan"
  ADD CONSTRAINT "fk_phan_cong_quay_cau_hinh"
  FOREIGN KEY ("id_cau_hinh_quay") REFERENCES "khung_gio_tiep_dan"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "phan_cong_quay_tiep_dan"
  ADD CONSTRAINT "fk_phan_cong_quay_can_bo"
  FOREIGN KEY ("id_can_bo") REFERENCES "nguoi_dung"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

-- ============================================
-- 4. Add columns to dang_ky_tiep_dan
-- ============================================
ALTER TABLE "dang_ky_tiep_dan"
  ADD COLUMN "id_ca_tiep_dan" UUID;

ALTER TABLE "dang_ky_tiep_dan"
  ADD COLUMN "id_cau_hinh_quay" UUID;

ALTER TABLE "dang_ky_tiep_dan"
  ADD CONSTRAINT "fk_dang_ky_tiep_dan_ca"
  FOREIGN KEY ("id_ca_tiep_dan") REFERENCES "ca_tiep_dan"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "dang_ky_tiep_dan"
  ADD CONSTRAINT "fk_dang_ky_tiep_dan_cau_hinh_quay"
  FOREIGN KEY ("id_cau_hinh_quay") REFERENCES "khung_gio_tiep_dan"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

-- New indexes for dang_ky_tiep_dan
CREATE INDEX "idx_dang_ky_tiep_dan_id_ca"
  ON "dang_ky_tiep_dan" ("id_ca_tiep_dan");

CREATE INDEX "idx_dang_ky_tiep_dan_id_cau_hinh_quay"
  ON "dang_ky_tiep_dan" ("id_cau_hinh_quay");

-- ============================================
-- 5. Add chu_de to dang_ky_gap_lanh_dao
-- ============================================
ALTER TABLE "dang_ky_gap_lanh_dao"
  ADD COLUMN "chu_de" VARCHAR(255);

-- ============================================
-- 6. Anti-duplicate unique indexes for dang_ky_tiep_dan (by ca)
--    Partial indexes with WHERE to handle nullable columns
-- ============================================
CREATE UNIQUE INDEX "uq_counter_registration_ca_phone_v2"
  ON "dang_ky_tiep_dan" ("id_ca_tiep_dan", "sdt")
  WHERE "id_ca_tiep_dan" IS NOT NULL AND "sdt" IS NOT NULL;

CREATE UNIQUE INDEX "uq_counter_registration_ca_citizen_v2"
  ON "dang_ky_tiep_dan" ("id_ca_tiep_dan", "cccd")
  WHERE "id_ca_tiep_dan" IS NOT NULL AND "cccd" IS NOT NULL;

-- ============================================
-- 7. Anti-duplicate unique indexes for dang_ky_gap_lanh_dao
-- ============================================
CREATE UNIQUE INDEX "uq_leader_meeting_slot_phone"
  ON "dang_ky_gap_lanh_dao" ("id_khung_gio_gap", "sdt");

CREATE UNIQUE INDEX "uq_leader_meeting_slot_citizen"
  ON "dang_ky_gap_lanh_dao" ("id_khung_gio_gap", "cccd");

COMMIT;