CREATE TABLE "khung_gio_tiep_dan" (
    "id" UUID NOT NULL DEFAULT public.uuid_generate_v4(),
    "id_lich_tiep_dan" UUID NOT NULL,
    "khung_gio" VARCHAR(50) NOT NULL,
    "ma_quay" VARCHAR(20) NOT NULL,
    "suc_chua" INTEGER NOT NULL DEFAULT 2,
    "is_active" BOOLEAN DEFAULT true,
    "is_delete" BOOLEAN DEFAULT false,
    "nguoi_tao" UUID,
    "nguoi_cap_nhat" UUID,
    "thoi_gian_tao" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'),
    "thoi_gian_cap_nhat" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'utc'),

    CONSTRAINT "khung_gio_tiep_dan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ck_khung_gio_tiep_dan_suc_chua" CHECK ("suc_chua" >= 1),
    CONSTRAINT "ck_khung_gio_tiep_dan_ma_quay" CHECK ("ma_quay" IN (
        'QUAY_1', 'QUAY_2', 'QUAY_3', 'QUAY_4',
        'QUAY_5', 'QUAY_6', 'QUAY_7', 'QUAY_8'
    )),
    CONSTRAINT "fk_khung_gio_tiep_dan_lich"
        FOREIGN KEY ("id_lich_tiep_dan")
        REFERENCES "lich_tiep_dan"("id")
        ON DELETE RESTRICT
        ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "uq_khung_gio_tiep_dan_lich_slot_quay"
ON "khung_gio_tiep_dan"("id_lich_tiep_dan", "khung_gio", "ma_quay");

CREATE INDEX "idx_khung_gio_tiep_dan_lich_slot"
ON "khung_gio_tiep_dan"("id_lich_tiep_dan", "khung_gio");

CREATE INDEX "idx_khung_gio_tiep_dan_ma_quay"
ON "khung_gio_tiep_dan"("ma_quay");

CREATE INDEX "idx_khung_gio_tiep_dan_trang_thai"
ON "khung_gio_tiep_dan"("is_active", "is_delete");
