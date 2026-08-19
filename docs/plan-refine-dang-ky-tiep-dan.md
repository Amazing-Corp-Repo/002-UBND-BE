# Plan: Tách `dang_ky_tiep_dan` — Tạo bảng `quay_tiep_dan` + Hệ thống đăng ký gặp lãnh đạo

> Mục tiêu:
> - `dang_ky_tiep_dan` → chỉ cho **tiếp dân quầy** (COUNTER_RECEPTION), xoá field thừa
> - Hệ thống **đăng ký gặp lãnh đạo** riêng: `lich_gap_lanh_dao`, `khung_gio_gap_lanh_dao`, `dang_ky_gap_lanh_dao`, `dinh_kem_dang_ky_gap_lanh_dao`, `danh_gia_gap_lanh_dao`
> - `quay_tiep_dan` → bảng mới quản lý danh sách quầy
>
> ⚠️ **Chiến lược migration: expand → backfill → verify → cleanup** (3 phase)
> - Phase 1: Thêm bảng mới + cột mới, chưa xoá gì
> - Phase 2: Backfill dữ liệu, chuyển code, verify
> - Phase 3: Xoá cột cũ sau khi xác nhận ổn định

---

## 1. Tạo bảng `quay_tiep_dan` mới

```prisma
model quay_tiep_dan {
  id                 String    @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  ma_quay            String    @unique @db.VarChar(20)     // QUAY_1, QUAY_2, ...
  ten_quay           String    @db.VarChar(100)            // "Quầy số 1"
  so_thu_tu          Int       @unique                     // Thứ tự hiển thị
  mo_ta              String?
  suc_chua_mac_dinh  Int       @default(2)                 // Sức chứa mặc định mỗi ca
  vi_tri             String?   @db.VarChar(255)            // Vị trí (VD: "Tầng 1, khu A")
  is_active          Boolean   @default(true)
  is_delete          Boolean   @default(false)
  nguoi_tao          String?   @db.Uuid
  nguoi_cap_nhat     String?   @db.Uuid
  thoi_gian_tao      DateTime  @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)
  thoi_gian_cap_nhat DateTime? @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)

  khung_gio_tiep_dan khung_gio_tiep_dan[]
  dang_ky_tiep_dan   dang_ky_tiep_dan[]

  @@index([is_active, is_delete], map: "idx_quay_tiep_dan_trang_thai")
  @@index([so_thu_tu], map: "idx_quay_tiep_dan_so_thu_tu")
}
```

---

## 2. Sửa bảng `dang_ky_tiep_dan` — chỉ cho tiếp dân quầy

### 2.1 Các field sẽ xoá (PHASE 3 — sau khi xác nhận)

| Field | Lý do | Ghi chú |
|---|---|---|
| `loai` | Không còn phân loại | Phase 3 |
| `ten_lanh_dao` | Chuyển sang hệ thống gặp lãnh đạo | Phase 3, sau khi chuyển dữ liệu |
| `chuc_vu_lanh_dao` | Chuyển sang hệ thống gặp lãnh đạo | Phase 3, sau khi chuyển dữ liệu |

### 2.2 Giữ nguyên (KHÔNG xoá)

| Field | Lý do (theo review) |
|---|---|
| `dia_chi` | Mobile đang gửi và hiển thị địa chỉ người dân |
| `nguoi_tao` | Audit quan trọng cho nghiệp vụ hành chính |
| `nguoi_cap_nhat` | Audit quan trọng cho nghiệp vụ hành chính |

### 2.3 Thêm cột mới (PHASE 1)

| Field | Kiểu | Ghi chú |
|---|---|---|
| `id_quay` | `UUID?` FK → `quay_tiep_dan.id` | Thêm mới, **KHÔNG** rename từ `bo_phan` |
| `nguoi_duyet_don` | `String?` `@db.Uuid` FK → `nguoi_dung.id` | |
| `id_khung_gio_tiep_dan` | `String?` `@db.Uuid` FK → `khung_gio_tiep_dan.id` | Liên kết trực tiếp đến khung giờ |

### 2.4 Xoá cột cũ (PHASE 3)

| Cột | Thời điểm |
|---|---|
| `bo_phan` | Phase 3, sau khi backfill `id_quay` hoàn tất |
| `loai` | Phase 3, sau khi chuyển hết LEADER_MEETING |
| `ten_lanh_dao` | Phase 3 |
| `chuc_vu_lanh_dao` | Phase 3 |

### 2.5 Model kết quả (sau Phase 3)

```prisma
model dang_ky_tiep_dan {
  id                  String        @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  ma_tiep_dan         String        @unique @db.VarChar(50)
  id_lich_tiep_dan    String?       @db.Uuid
  id_khung_gio_tiep_dan String?     @db.Uuid           // Liên kết trực tiếp khung giờ
  id_quay             String?       @db.Uuid
  ngay                DateTime?     @db.Date
  slot                String?       @db.VarChar(50)    // Giữ snapshot cho API cũ
  chu_de              String?       @db.VarChar(255)
  ly_do               String?
  ho_ten              String?       @db.VarChar(150)
  sdt                 String?       @db.VarChar(20)
  cccd                String?       @db.VarChar(20)
  dia_chi             String?                           // GIỮ — Mobile đang dùng
  trang_thai          String?       @default("PENDING") @db.VarChar(30)
  thoi_gian_phe_duyet DateTime?     @db.Timestamp(6)
  thoi_gian_hoan_thanh DateTime?    @db.Timestamp(6)
  nguoi_hoan_thanh    String?       @db.Uuid
  ly_do_tu_choi       String?
  thoi_gian_tu_choi   DateTime?     @db.Timestamp(6)
  nguoi_tu_choi       String?       @db.Uuid
  nguoi_duyet_don     String?       @db.Uuid
  nguoi_tao           String?       @db.Uuid            // GIỮ
  nguoi_cap_nhat      String?       @db.Uuid            // GIỮ
  is_active           Boolean?      @default(true)
  is_delete           Boolean?      @default(false)
  thoi_gian_tao       DateTime?     @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)
  thoi_gian_cap_nhat  DateTime?     @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)

  lich_tiep_dan       lich_tiep_dan?  @relation(fields: [id_lich_tiep_dan], references: [id], onUpdate: NoAction, map: "fk_dang_ky_tiep_dan_lich_tiep_dan")
  khung_gio_tiep_dan  khung_gio_tiep_dan? @relation(fields: [id_khung_gio_tiep_dan], references: [id], onUpdate: NoAction, map: "fk_dang_ky_tiep_dan_khung_gio")
  quay_tiep_dan       quay_tiep_dan?  @relation(fields: [id_quay], references: [id], onUpdate: NoAction, map: "fk_dang_ky_tiep_dan_quay")
  danh_gia_tiep_dan   danh_gia_tiep_dan[]

  @@index([trang_thai], map: "idx_dang_ky_tiep_dan_trang_thai")
}
```

---

## 3. Hệ thống đăng ký gặp lãnh đạo

### 3.1 `lich_gap_lanh_dao` — Lịch gặp lãnh đạo

```prisma
model lich_gap_lanh_dao {
  id                 String    @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  id_lanh_dao        String    @db.Uuid                    // Lãnh đạo phụ trách
  ngay               DateTime  @db.Date                    // Ngày gặp
  dia_diem           String?   @db.VarChar(255)            // Địa điểm / phòng gặp
  ghi_chu            String?
  is_active          Boolean   @default(true)
  is_delete          Boolean   @default(false)
  nguoi_tao          String?   @db.Uuid
  nguoi_cap_nhat     String?   @db.Uuid
  thoi_gian_tao      DateTime  @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)
  thoi_gian_cap_nhat DateTime? @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)

  lanh_dao               nguoi_dung                    @relation("LichGapLanhDao_LanhDao", fields: [id_lanh_dao], references: [id])
  khung_gio_gap_lanh_dao khung_gio_gap_lanh_dao[]

  @@unique([id_lanh_dao, ngay], map: "uq_lich_gap_lanh_dao_ngay")
  @@index([id_lanh_dao], map: "idx_lich_gap_lanh_dao_id_lanh_dao")
  @@index([ngay], map: "idx_lich_gap_lanh_dao_ngay")
  @@index([is_active, is_delete], map: "idx_lich_gap_lanh_dao_trang_thai")
}
```

### 3.2 `khung_gio_gap_lanh_dao` — Khung giờ gặp lãnh đạo

```prisma
model khung_gio_gap_lanh_dao {
  id                String    @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  id_lich_gap       String    @db.Uuid
  gio_bat_dau       String    @db.VarChar(10)             // VD: 08:00
  gio_ket_thuc      String    @db.VarChar(10)             // VD: 08:30
  suc_chua          Int       @default(1)                 // Số người có thể đăng ký
  is_active         Boolean   @default(true)
  is_delete         Boolean   @default(false)
  nguoi_tao         String?   @db.Uuid
  nguoi_cap_nhat    String?   @db.Uuid
  thoi_gian_tao     DateTime  @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)
  thoi_gian_cap_nhat DateTime? @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)

  lich_gap_lanh_dao      lich_gap_lanh_dao @relation(fields: [id_lich_gap], references: [id])
  dang_ky_gap_lanh_dao   dang_ky_gap_lanh_dao[]

  @@unique([id_lich_gap, gio_bat_dau, gio_ket_thuc], map: "uq_khung_gio_gap_lanh_dao")
  @@index([id_lich_gap], map: "idx_khung_gio_gap_lanh_dao_id_lich")
  @@index([is_active, is_delete], map: "idx_khung_gio_gap_lanh_dao_trang_thai")
}
```

### 3.3 `dang_ky_gap_lanh_dao` — Đăng ký gặp lãnh đạo

> **Lưu ý:** Dùng `VARCHAR(30)` + CHECK constraint thay vì Prisma enum để tránh schema drift giữa Prisma enum và SQL. Xem giải thích ở mục 5.3.

```prisma
model dang_ky_gap_lanh_dao {
  id                        String                    @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  ma_dang_ky                String                    @unique @db.VarChar(50)
  id_khung_gio_gap          String                    @db.Uuid
  ho_ten                    String                    @db.VarChar(150)
  sdt                       String                    @db.VarChar(20)
  cccd                      String                    @db.VarChar(20)
  ngay_cap_cccd             DateTime?                 @db.Date
  noi_cap_cccd              String?                   @db.VarChar(255)
  dia_chi                   String
  ngay_lam_don              DateTime?                 @db.Date
  ly_do                     String
  trang_thai                String                    @default("PENDING") @db.VarChar(30)
  thoi_gian_phe_duyet       DateTime?                 @db.Timestamp(6)
  thoi_gian_hoan_thanh      DateTime?                 @db.Timestamp(6)
  thoi_gian_tu_choi         DateTime?                 @db.Timestamp(6)
  ly_do_tu_choi             String?
  nguoi_duyet_don           String?                   @db.Uuid
  nguoi_hoan_thanh          String?                   @db.Uuid
  nguoi_tu_choi             String?                   @db.Uuid
  is_active                 Boolean                   @default(true)
  is_delete                 Boolean                   @default(false)
  nguoi_tao                 String?                   @db.Uuid
  nguoi_cap_nhat            String?                   @db.Uuid
  thoi_gian_tao             DateTime                  @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)
  thoi_gian_cap_nhat        DateTime?                 @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)

  khung_gio_gap_lanh_dao    khung_gio_gap_lanh_dao @relation(fields: [id_khung_gio_gap], references: [id])
  // Lãnh đạo được xác định qua: khung_gio_gap → lich_gap → id_lanh_dao

  nguoi_duyet               nguoi_dung? @relation("DangKyGapLanhDao_NguoiDuyet", fields: [nguoi_duyet_don], references: [id])
  nguoi_hoan_thanh_ref      nguoi_dung? @relation("DangKyGapLanhDao_NguoiHoanThanh", fields: [nguoi_hoan_thanh], references: [id])
  nguoi_tu_choi_ref         nguoi_dung? @relation("DangKyGapLanhDao_NguoiTuChoi", fields: [nguoi_tu_choi], references: [id])

  dinh_kem_dang_ky_gap_lanh_dao dinh_kem_dang_ky_gap_lanh_dao[]
  danh_gia_gap_lanh_dao         danh_gia_gap_lanh_dao?

  @@index([id_khung_gio_gap], map: "idx_dang_ky_gap_id_khung_gio")
  @@index([sdt], map: "idx_dang_ky_gap_sdt")
  @@index([cccd], map: "idx_dang_ky_gap_cccd")
  @@index([trang_thai], map: "idx_dang_ky_gap_trang_thai")
  @@index([thoi_gian_tao], map: "idx_dang_ky_gap_thoi_gian_tao")
}
```

### 3.4 `dinh_kem_dang_ky_gap_lanh_dao` — Ảnh CCCD và tài liệu đính kèm

```prisma
model dinh_kem_dang_ky_gap_lanh_dao {
  id            String   @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  id_dang_ky    String   @db.Uuid
  loai_dinh_kem String   @db.VarChar(30)    // CCCD_FRONT | CCCD_BACK | SUPPORTING_DOCUMENT
  ten_file_goc  String   @db.VarChar(255)
  duong_dan_file String
  mime_type     String?  @db.VarChar(100)
  kich_thuoc    Int?                          // bytes
  thoi_gian_tao DateTime @default(now())

  dang_ky_gap_lanh_dao dang_ky_gap_lanh_dao @relation(fields: [id_dang_ky], references: [id], onDelete: Cascade)

  @@index([id_dang_ky], map: "idx_dinh_kem_gap_id_dang_ky")
}
```

### 3.5 `danh_gia_gap_lanh_dao` — Đánh giá gặp lãnh đạo

```prisma
model danh_gia_gap_lanh_dao {
  id                      String   @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  id_dang_ky_gap_lanh_dao String   @unique @db.Uuid
  diem_tong               Int
  tieu_chi                Json?
  ly_do                   Json?
  nhan_xet                String?
  is_active               Boolean  @default(true)
  is_delete               Boolean  @default(false)
  thoi_gian_tao           DateTime @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)
  thoi_gian_cap_nhat      DateTime? @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)

  dang_ky_gap_lanh_dao dang_ky_gap_lanh_dao @relation(fields: [id_dang_ky_gap_lanh_dao], references: [id], onUpdate: NoAction, map: "fk_danh_gia_gap_lanh_dao_dang_ky")

  @@index([diem_tong], map: "idx_danh_gia_gap_lanh_dao_diem_tong")
}
```

---

## 4. Sửa bảng `khung_gio_tiep_dan`

### 4.1 Thêm cột mới (PHASE 1)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id_quay` | `UUID?` FK → `quay_tiep_dan.id` | Thêm mới, **KHÔNG** rename từ `ma_quay` |

### 4.2 Xoá cột cũ (PHASE 3)

| Cột | Thời điểm |
|---|---|
| `ma_quay` | Phase 3, sau khi backfill `id_quay` + verify |

Unique: `@@unique([id_lich_tiep_dan, khung_gio, id_quay])`

---

## 5. Migration SQL theo 3 Phase

### 5.1 Phase 1 — Mở rộng (EXPAND)

```sql
-- ========================================
-- PHASE 1: Tạo bảng mới + thêm cột, KHÔNG xoá gì
-- ========================================

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

-- 9. Thêm unique constraint mới cho khung_gio_tiep_dan
ALTER TABLE "khung_gio_tiep_dan"
  ADD CONSTRAINT "uq_khung_gio_tiep_dan_lich_slot_quay"
  UNIQUE ("id_lich_tiep_dan", "khung_gio", "id_quay");
```

### 5.2 Phase 2 — Backfill dữ liệu

```sql
-- ========================================
-- PHASE 2: Backfill dữ liệu vào cột mới
-- ========================================

-- 2.1 Backfill id_quay cho dang_ky_tiep_dan từ bo_phan
UPDATE "dang_ky_tiep_dan" r
  SET "id_quay" = q."id"
  FROM "quay_tiep_dan" q
  WHERE r."bo_phan" = q."ma_quay"
    AND r."loai" = 'COUNTER_RECEPTION';

-- Kiểm tra: không còn bản ghi COUNTER_RECEPTION nào thiếu id_quay
-- SELECT COUNT(*) FROM "dang_ky_tiep_dan"
-- WHERE "loai" = 'COUNTER_RECEPTION' AND "id_quay" IS NULL;

-- 2.2 Backfill id_quay cho khung_gio_tiep_dan từ ma_quay
UPDATE "khung_gio_tiep_dan" kg
  SET "id_quay" = q."id"
  FROM "quay_tiep_dan" q
  WHERE kg."ma_quay" = q."ma_quay";

-- Kiểm tra: không còn bản ghi nào thiếu id_quay
-- SELECT COUNT(*) FROM "khung_gio_tiep_dan" WHERE "id_quay" IS NULL;

-- 2.3 Chuyển dữ liệu LEADER_MEETING từ dang_ky_tiep_dan sang dang_ky_gap_lanh_dao
-- Bước này cần script Node.js để xử lý mapping ten_lanh_dao → nguoi_dung.id
-- Do không thể tự động map tên lãnh đạo sang UUID, cần chạy script riêng.
-- Xem file `scripts/migrate-leader-meeting.js`
```

### 5.3 Phase 3 — Thu gọn (sau khi xác nhận ổn định)

```sql
-- ========================================
-- PHASE 3: Xoá cột cũ (chỉ chạy sau khi verify)
-- ========================================

-- 3.1 Xoá cột cũ trong dang_ky_tiep_dan
ALTER TABLE "dang_ky_tiep_dan"
  DROP COLUMN IF EXISTS "bo_phan",
  DROP COLUMN IF EXISTS "loai",
  DROP COLUMN IF EXISTS "ten_lanh_dao",
  DROP COLUMN IF EXISTS "chuc_vu_lanh_dao";

-- 3.2 Xoá cột cũ trong khung_gio_tiep_dan
ALTER TABLE "khung_gio_tiep_dan"
  DROP COLUMN IF EXISTS "ma_quay";

-- 3.3 Đặt NOT NULL cho id_quay sau khi đã backfill đủ
ALTER TABLE "khung_gio_tiep_dan"
  ALTER COLUMN "id_quay" SET NOT NULL;
```

---

## 6. Ghi chú quan trọng về thiết kế

### 6.1 Giữ nguyên contract API cũ

API **giữ nguyên** request/response field `department` (chuỗi `QUAY_3`), **không** đổi thành `idQuay`:

- **Request vào:** Backend nhận `department: "QUAY_3"` → tự tra `quay_tiep_dan` để lấy `id`
- **Response ra:** Backend trả `department: "QUAY_3"` + `departmentName: "Quầy số 3"`
- Mobile/Swagger **không bị ảnh hưởng**

### 6.2 Dùng VARCHAR + CHECK thay vì Prisma enum

Prisma enum và SQL `VARCHAR(30)` không đồng nhất → gây schema drift. Chọn:
- **Prisma model:** `String @db.VarChar(30)` (không enum)
- **SQL:** `CHECK` constraint liệt kê giá trị hợp lệ
- **Constant file:** `src/constants/trang-thai-gap-lanh-dao.constant.js` để BE code dùng

### 6.3 Thêm `id_khung_gio_tiep_dan` vào `dang_ky_tiep_dan`

- Đăng ký mới sẽ dùng FK `id_khung_gio_tiep_dan` → `khung_gio_tiep_dan.id`
- `slot` (chuỗi) giữ lại làm snapshot cho API cũ
- Đảm bảo khung giờ thực sự tồn tại (ràng buộc DB)

### 6.4 Thêm CHECK constraint

| Bảng | Constraint | Mục đích |
|---|---|---|
| `quay_tiep_dan` | `suc_chua_mac_dinh >= 1` | Sức chứa phải >= 1 |
| `khung_gio_gap_lanh_dao` | `suc_chua >= 1` | Sức chứa phải >= 1 |
| `dang_ky_gap_lanh_dao` | `trang_thai IN (...)` | Chỉ chấp nhận giá trị hợp lệ |
| `danh_gia_gap_lanh_dao` | `diem_tong BETWEEN 1 AND 5` | Điểm trong khoảng 1-5 |
| `dinh_kem_dang_ky_gap_lanh_dao` | `loai_dinh_kem IN (...)` | Chỉ chấp nhận loại hợp lệ |
| `dinh_kem_dang_ky_gap_lanh_dao` | `kich_thuoc >= 0` | Kích thước không âm |

---

## 7. File cần thêm/sửa (BE)

### Phase 1 — Ngay khi migration

| File | Thay đổi |
|---|---|
| `prisma/schema.prisma` | Thêm `quay_tiep_dan`, `lich_gap_lanh_dao`, `khung_gio_gap_lanh_dao`, `dang_ky_gap_lanh_dao`, `dinh_kem_dang_ky_gap_lanh_dao`, `danh_gia_gap_lanh_dao`. Sửa `dang_ky_tiep_dan` (thêm `id_quay`, `nguoi_duyet_don`, `id_khung_gio_tiep_dan`, giữ nguyên cột cũ). Sửa `khung_gio_tiep_dan` (thêm `id_quay`). |
| `src/constants/trang-thai-gap-lanh-dao.constant.js` | **Mới:** `PENDING, APPROVED, REJECTED, COMPLETED` |
| `src/repositories/reception-schedule.repository.js` | Thêm `id_quay` vào create/update, giữ `bo_phan` |
| `prisma/seed.js` | Seed `quay_tiep_dan` |

### Phase 2 — Khi backfill + chuyển code

| File | Thay đổi |
|---|---|
| `src/repositories/dang-ky-tiep-dan.repository.js` | Thêm filter bằng `id_quay` song song với `bo_phan` |
| `src/repositories/reception-schedule-management.repository.js` | Select thêm `id_quay` |
| `src/repositories/reception-rating.repository.js` | Sửa filter `loai` → filter bằng bảng mới nếu cần |
| `src/services/dang-ky-tiep-dan.service.js` | Sửa mapper: dùng `id_quay` để tra `ma_quay` + `ten_quay`, trả về `department` |
| `src/services/reception-schedule-management.service.js` | Đọc quầy từ DB thay vì `RECEPTION_COUNTER_CODES` |
| `src/services/reception-schedule.service.js` | Đọc quầy từ DB |
| **Mới:** `src/repositories/dang-ky-gap-lanh-dao.repository.js` | |
| **Mới:** `src/services/dang-ky-gap-lanh-dao.service.js` | |
| **Mới:** `src/controllers/dang-ky-gap-lanh-dao.controller.js` | |
| **Mới:** `src/routes/dang-ky-gap-lanh-dao.route.js` | |
| **Mới:** `src/repositories/lich-gap-lanh-dao.repository.js` | |
| **Mới:** `src/services/lich-gap-lanh-dao.service.js` | |
| **Mới:** `src/controllers/lich-gap-lanh-dao.controller.js` | |
| **Mới:** `src/routes/lich-gap-lanh-dao.route.js` | |
| `src/validators/dang-ky-tiep-dan.validator.js` | Giữ `department` (chuỗi `QUAY_3`), thêm mapping nội bộ |
| **Mới:** `src/validators/dang-ky-gap-lanh-dao.validator.js` | |
| **Mới:** `src/validators/lich-gap-lanh-dao.validator.js` | |
| `src/swagger/dang-ky-tiep-dan.swagger.js` | Thêm field mới, giữ field cũ |
| **Mới:** `src/swagger/dang-ky-gap-lanh-dao.swagger.js` | |
| **Mới:** `src/swagger/lich-gap-lanh-dao.swagger.js` | |
| `src/routes/root.route.js` | Mount route mới |
| `prisma/seed.js` | Seed `dang_ky_gap_lanh_dao` |

### Phase 3 — Sau khi xác nhận

| File | Thay đổi |
|---|---|
| `prisma/schema.prisma` | Xoá cột cũ trong Prisma model |
| `src/constants/reception-schedule.constant.js` | Xoá `RECEPTION_COUNTER_CODES` |
| `src/constants/tiep-dan.constant.js` | Xoá `TIEP_DAN_TYPE` |
| `src/repositories/dang-ky-tiep-dan.repository.js` | Xoá code liên quan `bo_phan` |
| `src/repositories/reception-schedule-management.repository.js` | Xoá select `bo_phan` |
| `src/services/dang-ky-tiep-dan.service.js` | Xoá mapper cũ |
| `src/validators/dang-ky-tiep-dan.validator.js` | Xoá validator `bo_phan` cũ |

---

## 8. Câu hỏi đã chốt

Các câu hỏi sau đã được giải quyết dựa trên review:

| Câu hỏi | Quyết định |
|---|---|
| Sức chứa khung giờ gặp lãnh đạo? | Mặc định 1 người (có thể cấu hình qua `suc_chua`) |
| `chu_de` có giữ không? | Giữ nullable để bổ sung sau |
| Cho phép hủy đơn từ Mobile? | **Không** — đã chốt không cho hủy. Không thêm `CANCELLED` |
| Có bắt buộc `COMPLETED` trước khi đánh giá? | **Có** — chỉ đánh giá sau `COMPLETED` (áp dụng cùng quy tắc với tiếp dân quầy) |
| Xoá `dia_chi`? | **Không** — giữ nguyên |
| Xoá audit fields? | **Không** — giữ `nguoi_tao`, `nguoi_cap_nhat` |
| Đổi contract API `department` → `idQuay`? | **Không** — giữ `department`, map nội bộ |

---

## 9. Thứ tự thực hiện

```
PHASE 1 — MỞ RỘNG
  Bước 1:  Sửa prisma/schema.prisma (thêm bảng mới + cột mới, giữ cột cũ)
  Bước 2:  prisma migrate dev --name phase1_expand_dang_ky_tiep_dan
  Bước 3:  prisma generate
  Bước 4:  Thêm constant file mới (trang-thai-gap-lanh-dao.constant.js)
  Bước 5:  Sửa prisma/seed.js (seed quay_tiep_dan)
  Bước 6:  Sửa reception-schedule.repository.js (thêm id_quay)

PHASE 2 — BACKFILL + CHUYỂN CODE
  Bước 7:  Chạy migration SQL Phase 2 (backfill dữ liệu)
  Bước 8:  Chạy script migrate-leader-meeting.js (nếu có dữ liệu cũ)
  Bước 9:  Sửa repositories cũ + tạo mới
  Bước 10: Sửa services cũ + tạo mới
  Bước 11: Tạo controllers mới
  Bước 12: Tạo routes mới + root.route.js
  Bước 13: Tạo validators mới, sửa validators cũ (giữ department)
  Bước 14: Tạo/swagger mới, sửa swagger cũ
  Bước 15: Kiểm tra API docs, Mobile integration test
  Bước 16: Xác nhận dữ liệu, verify toàn bộ

PHASE 3 — THU GỌN (sau 1-2 tuần ổn định)
  Bước 17: Sửa prisma/schema.prisma (xoá cột cũ)
  Bước 18: prisma migrate dev --name phase3_cleanup_dang_ky_tiep_dan
  Bước 19: Xoá constants cũ (RECEPTION_COUNTER_CODES, TIEP_DAN_TYPE)
  Bước 20: Dọn code repositories/services/validators cũ
```

---

## 10. Rollback an toàn

### Rollback Phase 1 (xoá bảng mới, giữ nguyên dữ liệu cũ)

```sql
-- Xoá FK trước, sau đó mới DROP TABLE (tránh CASCADE xoá nhầm)
ALTER TABLE "dang_ky_tiep_dan" DROP CONSTRAINT IF EXISTS "fk_dang_ky_tiep_dan_khung_gio";
ALTER TABLE "dang_ky_tiep_dan" DROP CONSTRAINT IF EXISTS "fk_dang_ky_tiep_dan_nguoi_duyet";
ALTER TABLE "dang_ky_tiep_dan" DROP CONSTRAINT IF EXISTS "fk_dang_ky_tiep_dan_quay";
ALTER TABLE "khung_gio_tiep_dan" DROP CONSTRAINT IF EXISTS "fk_khung_gio_tiep_dan_quay";
ALTER TABLE "khung_gio_tiep_dan" DROP CONSTRAINT IF EXISTS "uq_khung_gio_tiep_dan_lich_slot_quay";

ALTER TABLE "dang_ky_tiep_dan" DROP COLUMN IF EXISTS "id_quay";
ALTER TABLE "dang_ky_tiep_dan" DROP COLUMN IF EXISTS "nguoi_duyet_don";
ALTER TABLE "dang_ky_tiep_dan" DROP COLUMN IF EXISTS "id_khung_gio_tiep_dan";
ALTER TABLE "khung_gio_tiep_dan" DROP COLUMN IF EXISTS "id_quay";

DROP TABLE IF EXISTS "danh_gia_gap_lanh_dao";
DROP TABLE IF EXISTS "dinh_kem_dang_ky_gap_lanh_dao";
DROP TABLE IF EXISTS "dang_ky_gap_lanh_dao";
DROP TABLE IF EXISTS "khung_gio_gap_lanh_dao";
DROP TABLE IF EXISTS "lich_gap_lanh_dao";
DROP TABLE IF EXISTS "quay_tiep_dan";
```

### Rollback Phase 3 (khôi phục cột cũ nếu có dữ liệu)

```sql
ALTER TABLE "dang_ky_tiep_dan"
  ADD COLUMN "bo_phan" VARCHAR(30),
  ADD COLUMN "loai" VARCHAR(30),
  ADD COLUMN "ten_lanh_dao" VARCHAR(255),
  ADD COLUMN "chuc_vu_lanh_dao" VARCHAR(255);

-- Khôi phục bo_phan từ id_quay (nếu có dữ liệu)
UPDATE "dang_ky_tiep_dan" r
  SET "bo_phan" = q."ma_quay"
  FROM "quay_tiep_dan" q
  WHERE r."id_quay" = q."id";

ALTER TABLE "khung_gio_tiep_dan"
  ADD COLUMN "ma_quay" VARCHAR(20);

UPDATE "khung_gio_tiep_dan" kg
  SET "ma_quay" = q."ma_quay"
  FROM "quay_tiep_dan" q
  WHERE kg."id_quay" = q."id";
```

---

## 11. Chuẩn bị trước khi chạy

1. **Backup database:** `pg_dump -n '"<SCHEMA>"' --no-owner > backup-$(date +%Y%m%d).sql`
2. **Preflight:** Kiểm tra kết nối DB, chạy `prisma migrate status`
3. **Kiểm tra dữ liệu hiện tại:**
   - Đếm số bản ghi `dang_ky_tiep_dan` theo `loai` (COUNTER_RECEPTION vs LEADER_MEETING)
   - Đếm `danh_gia_tiep_dan` liên quan đến LEADER_MEETING
   - Xác nhận tất cả `bo_phan` đều khớp với `QUAY_1`...`QUAY_8`
4. **Dừng tất cả service** trước khi migration
5. **Chạy Phase 1 → verify → Phase 2 → verify → chuyển code → verify → Phase 3**