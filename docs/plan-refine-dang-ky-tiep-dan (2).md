# Plan V2 — Chuẩn hóa đăng ký tiếp dân, quầy và đăng ký gặp lãnh đạo

> Trạng thái: Đang triển khai theo từng phần trên nhánh `jun`.
>
> Phạm vi hiện tại: Backend, API, database và migration. Prisma schema đã được đồng bộ với DB DEV; các bước backfill, dual-read/dual-write và API tiếp tục được triển khai theo thứ tự trong tài liệu này.
>
> Ngoài phạm vi: Chưa chỉnh sửa Frontend. Backend chỉ duy trì contract tương thích và trả lỗi nghiệp vụ rõ ràng để Frontend tích hợp sau.

## 1. Mục tiêu

1. Giữ `dang_ky_tiep_dan` cho nghiệp vụ tiếp dân tại quầy.
2. Tách nghiệp vụ gặp lãnh đạo sang hệ thống bảng riêng.
3. Tạo danh mục tám quầy thay cho việc phụ thuộc hoàn toàn vào constant `QUAY_1` đến `QUAY_8`.
4. Tách khái niệm ca tiếp dân khỏi cấu hình sức chứa của từng quầy.
5. Quản lý phân công cán bộ trực quầy theo từng ngày/ca; không gắn cố định một quầy vào tài khoản cán bộ.
6. Giữ khả năng tương thích với API cũ:
   - Request/response vẫn dùng `department: "QUAY_3"`.
   - Không bắt API client truyền UUID nội bộ của quầy.
   - Không đổi tên route cũ.
7. Thực hiện migration theo chiến lược:

```text
EXPAND -> BACKFILL -> DUAL READ/WRITE -> VERIFY -> CLEANUP
```

## 2. Các quyết định đã chốt

| Nội dung | Quyết định |
|---|---|
| Số quầy | Tám quầy, mã `QUAY_1` đến `QUAY_8` |
| Sức chứa mặc định | Hai người/quầy/ca |
| Điều chỉnh sức chứa | Cán bộ được tăng hoặc giảm, nhưng không được thấp hơn số đơn đã giữ chỗ |
| API cũ | Giữ nguyên route và contract |
| Trường `department` | Tiếp tục sử dụng mã quầy, backend tự map UUID |
| Địa chỉ người dân | Giữ `dia_chi` |
| Audit | Giữ người tạo/cập nhật và thời gian tạo/cập nhật |
| Mobile hủy đơn | Không hỗ trợ, không có trạng thái `CANCELLED` |
| Đánh giá | Chỉ được đánh giá sau trạng thái `COMPLETED` |
| Nhận xét | Tối đa 2.000 ký tự |
| Chủ đề gặp lãnh đạo | Giữ nullable để có thể sử dụng về sau |
| Khung giờ gặp lãnh đạo | Mặc định một người, có thể cấu hình sức chứa |
| Quan hệ cán bộ - quầy | Một tài khoản có thể được phân công nhiều quầy ở các ngày/ca khác nhau; không lưu `id_quay` cố định trong `nguoi_dung` |
| Xác định quầy khi phê duyệt | Backend đối chiếu tài khoản đăng nhập với phân công của đúng ca; không tin trực tiếp mã quầy do client gửi |
| Phân công trong cùng ca | Mặc định một cán bộ chỉ trực một quầy và một quầy chỉ có một cán bộ chính trong cùng ca; cần xác nhận nếu nghiệp vụ cho phép ngoại lệ |

## 3. Sửa điểm chưa đúng của plan cũ

### 3.1. Không dùng một bản ghi quầy làm ID ca

`khung_gio_tiep_dan` hiện có tám bản ghi cho cùng một ca, mỗi bản ghi tương ứng một quầy. Trong khi người dân chọn ca trước và chỉ được phân quầy khi cán bộ phê duyệt.

Vì vậy không lưu `id_khung_gio_tiep_dan` đại diện ngẫu nhiên vào đơn ngay khi đăng ký. Thay vào đó tạo bảng `ca_tiep_dan`:

```text
lich_tiep_dan
  └── ca_tiep_dan
        └── khung_gio_tiep_dan (cấu hình quầy và sức chứa)
```

Đăng ký giữ `id_ca_tiep_dan`. Khi phê duyệt, backend lưu `id_cau_hinh_quay`, trỏ đến đúng cấu hình quầy của ca đó.

### 3.2. Không tạo lại unique bằng tên đang tồn tại

Unique cũ đang có tên:

```text
uq_khung_gio_tiep_dan_lich_slot_quay
```

Unique mới phải dùng tên khác:

```text
uq_khung_gio_tiep_dan_ca_quay_v2
```

### 3.3. Không xóa `loai` khi còn dữ liệu `LEADER_MEETING`

Trước Phase 3 phải bảo đảm:

- Toàn bộ đăng ký `LEADER_MEETING` đã được chuyển sang bảng mới.
- Toàn bộ đánh giá liên quan đã được chuyển.
- Có bảng mapping và báo cáo đối soát.
- Không còn bản ghi `LEADER_MEETING` trong `dang_ky_tiep_dan`.

## 4. Thiết kế database mục tiêu

### 4.1. Bảng `quay_tiep_dan`

```prisma
model quay_tiep_dan {
  id                 String    @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  ma_quay            String    @unique(map: "uq_quay_tiep_dan_ma_quay") @db.VarChar(20)
  ten_quay           String    @db.VarChar(100)
  so_thu_tu          Int       @unique(map: "uq_quay_tiep_dan_so_thu_tu")
  mo_ta              String?
  suc_chua_mac_dinh  Int       @default(2)
  vi_tri             String?   @db.VarChar(255)
  is_active          Boolean   @default(true)
  is_delete          Boolean   @default(false)
  nguoi_tao          String?   @db.Uuid
  nguoi_cap_nhat     String?   @db.Uuid
  thoi_gian_tao      DateTime  @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)
  thoi_gian_cap_nhat DateTime? @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)

  khung_gio_tiep_dan khung_gio_tiep_dan[]

  @@index([is_active, is_delete], map: "idx_quay_tiep_dan_trang_thai")
}
```

Ràng buộc SQL bổ sung:

```sql
CHECK ("suc_chua_mac_dinh" >= 1)
CHECK ("ma_quay" ~ '^QUAY_[1-8]$')
CHECK ("so_thu_tu" BETWEEN 1 AND 8)
```

### 4.2. Bảng `ca_tiep_dan`

Một ca là khung thời gian người dân lựa chọn, không gắn sẵn với quầy.

```prisma
model ca_tiep_dan {
  id                 String    @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  id_lich_tiep_dan   String    @db.Uuid
  gio_bat_dau        DateTime  @db.Time(0)
  gio_ket_thuc       DateTime  @db.Time(0)
  is_active          Boolean   @default(true)
  is_delete          Boolean   @default(false)
  nguoi_tao          String?   @db.Uuid
  nguoi_cap_nhat     String?   @db.Uuid
  thoi_gian_tao      DateTime  @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)
  thoi_gian_cap_nhat DateTime? @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)

  lich_tiep_dan      lich_tiep_dan          @relation(fields: [id_lich_tiep_dan], references: [id], onDelete: Restrict, onUpdate: NoAction, map: "fk_ca_tiep_dan_lich")
  cau_hinh_quay      khung_gio_tiep_dan[]
  dang_ky_tiep_dan   dang_ky_tiep_dan[]

  @@unique([id_lich_tiep_dan, gio_bat_dau, gio_ket_thuc], map: "uq_ca_tiep_dan_lich_thoi_gian")
  @@index([id_lich_tiep_dan], map: "idx_ca_tiep_dan_id_lich")
  @@index([is_active, is_delete], map: "idx_ca_tiep_dan_trang_thai")
}
```

Ràng buộc SQL:

```sql
CHECK ("gio_bat_dau" < "gio_ket_thuc")
```

Service phải chặn các ca giao nhau trong cùng lịch.

### 4.3. Bảng `khung_gio_tiep_dan`

Giữ tên bảng hiện tại để giảm ảnh hưởng code, nhưng sau chuẩn hóa bảng này đóng vai trò cấu hình sức chứa từng quầy trong một ca.

Model mục tiêu sau Phase 3:

```prisma
model khung_gio_tiep_dan {
  id                 String    @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  id_ca_tiep_dan     String    @db.Uuid
  id_quay            String    @db.Uuid
  suc_chua           Int       @default(2)
  is_active          Boolean   @default(true)
  is_delete          Boolean   @default(false)
  nguoi_tao          String?   @db.Uuid
  nguoi_cap_nhat     String?   @db.Uuid
  thoi_gian_tao      DateTime  @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)
  thoi_gian_cap_nhat DateTime? @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)

  ca_tiep_dan        ca_tiep_dan   @relation(fields: [id_ca_tiep_dan], references: [id], onDelete: Restrict, onUpdate: NoAction, map: "fk_khung_gio_tiep_dan_ca")
  quay_tiep_dan      quay_tiep_dan @relation(fields: [id_quay], references: [id], onDelete: Restrict, onUpdate: NoAction, map: "fk_khung_gio_tiep_dan_quay")
  dang_ky_duoc_phan  dang_ky_tiep_dan[]
  phan_cong_can_bo   phan_cong_quay_tiep_dan[]

  @@unique([id_ca_tiep_dan, id_quay], map: "uq_khung_gio_tiep_dan_ca_quay_v2")
  @@index([id_quay], map: "idx_khung_gio_tiep_dan_id_quay")
  @@index([is_active, is_delete], map: "idx_khung_gio_tiep_dan_trang_thai_v2")
}
```

Ràng buộc SQL:

```sql
CHECK ("suc_chua" >= 1)
```

Trong Phase 1 và Phase 2 vẫn giữ các cột cũ:

```text
id_lich_tiep_dan
khung_gio
ma_quay
```

### 4.3.1. Bảng `phan_cong_quay_tiep_dan`

Không thêm `id_quay` trực tiếp vào `nguoi_dung`, vì cán bộ có thể trực các quầy khác nhau theo ngày và ca. Phân công phải gắn với đúng cấu hình quầy của một ca.

```prisma
model phan_cong_quay_tiep_dan {
  id                    String    @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  id_cau_hinh_quay      String    @db.Uuid
  id_can_bo             String    @db.Uuid
  is_active             Boolean   @default(true)
  is_delete             Boolean   @default(false)
  nguoi_tao             String?   @db.Uuid
  nguoi_cap_nhat        String?   @db.Uuid
  thoi_gian_tao         DateTime  @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)
  thoi_gian_cap_nhat    DateTime? @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)

  cau_hinh_quay         khung_gio_tiep_dan @relation(fields: [id_cau_hinh_quay], references: [id], onDelete: Restrict, onUpdate: NoAction, map: "fk_phan_cong_quay_cau_hinh")
  can_bo                nguoi_dung          @relation("PhanCongQuay_CanBo", fields: [id_can_bo], references: [id], onDelete: Restrict, onUpdate: NoAction)

  @@index([id_can_bo], map: "idx_phan_cong_quay_id_can_bo")
  @@index([is_active, is_delete], map: "idx_phan_cong_quay_trang_thai")
}
```

Vì phân công dùng soft delete và cần giữ lịch sử, không dùng `@@unique([id_cau_hinh_quay])` cho toàn bộ bảng. Database dùng partial unique index chỉ áp dụng cho phân công đang hoạt động:

```sql
CREATE UNIQUE INDEX "uq_phan_cong_quay_cau_hinh_active_v2"
ON "phan_cong_quay_tiep_dan" ("id_cau_hinh_quay")
WHERE "is_active" = true AND "is_delete" = false;
```

Quy tắc service:

- Một tài khoản được có nhiều bản ghi phân công ở các ngày hoặc ca khác nhau.
- Không được tạo hai phân công đang hoạt động cho cùng một quầy trong cùng ca.
- Mặc định không cho một cán bộ trực hai quầy trong cùng ca; service phải kiểm tra qua `id_cau_hinh_quay -> id_ca_tiep_dan` trong transaction.
- Không suy luận quầy từ tên đăng nhập như `canbo3 -> QUAY_3`.
- Không tự suy luận cán bộ từ trường chuỗi `ten_can_bo` của lịch khi backfill.
- Mọi thao tác tạo, đổi hoặc ngừng phân công phải lưu audit.

### 4.4. Bảng `dang_ky_tiep_dan`

Các cột mới:

```prisma
id_ca_tiep_dan      String? @db.Uuid
id_cau_hinh_quay    String? @db.Uuid
nguoi_duyet_don     String? @db.Uuid
```

Ý nghĩa:

- `id_ca_tiep_dan`: ca người dân đã chọn, bắt buộc sau khi backfill hoàn tất.
- `id_cau_hinh_quay`: null khi `PENDING`; được gán khi cán bộ phê duyệt và chọn quầy.
- Quầy được xác định qua `id_cau_hinh_quay -> khung_gio_tiep_dan -> quay_tiep_dan`.

Model mục tiêu sau Phase 3:

```prisma
model dang_ky_tiep_dan {
  id                    String    @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  ma_tiep_dan           String    @unique(map: "uq_dang_ky_tiep_dan_ma_tiep_dan") @db.VarChar(50)
  id_lich_tiep_dan      String?   @db.Uuid
  id_ca_tiep_dan        String    @db.Uuid
  id_cau_hinh_quay      String?   @db.Uuid
  ngay                  DateTime? @db.Date
  slot                  String?   @db.VarChar(50)
  chu_de                String?   @db.VarChar(255)
  ly_do                 String?
  ho_ten                String?   @db.VarChar(150)
  sdt                   String?   @db.VarChar(20)
  cccd                  String?   @db.VarChar(20)
  dia_chi               String?
  trang_thai            String    @default("PENDING") @db.VarChar(30)
  thoi_gian_phe_duyet   DateTime? @db.Timestamp(6)
  thoi_gian_hoan_thanh  DateTime? @db.Timestamp(6)
  thoi_gian_tu_choi     DateTime? @db.Timestamp(6)
  ly_do_tu_choi         String?
  nguoi_duyet_don       String?   @db.Uuid
  nguoi_hoan_thanh      String?   @db.Uuid
  nguoi_tu_choi         String?   @db.Uuid
  nguoi_tao             String?   @db.Uuid
  nguoi_cap_nhat        String?   @db.Uuid
  is_active             Boolean   @default(true)
  is_delete             Boolean   @default(false)
  thoi_gian_tao         DateTime  @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)
  thoi_gian_cap_nhat    DateTime? @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)

  lich_tiep_dan         lich_tiep_dan?       @relation(fields: [id_lich_tiep_dan], references: [id], onUpdate: NoAction, map: "fk_dang_ky_tiep_dan_lich_tiep_dan")
  ca_tiep_dan           ca_tiep_dan           @relation(fields: [id_ca_tiep_dan], references: [id], onDelete: Restrict, onUpdate: NoAction, map: "fk_dang_ky_tiep_dan_ca")
  cau_hinh_quay         khung_gio_tiep_dan?   @relation(fields: [id_cau_hinh_quay], references: [id], onDelete: SetNull, onUpdate: NoAction, map: "fk_dang_ky_tiep_dan_cau_hinh_quay")
  danh_gia_tiep_dan     danh_gia_tiep_dan[]

  @@index([trang_thai], map: "idx_dang_ky_tiep_dan_trang_thai")
  @@index([id_ca_tiep_dan], map: "idx_dang_ky_tiep_dan_id_ca")
  @@index([id_cau_hinh_quay], map: "idx_dang_ky_tiep_dan_id_cau_hinh_quay")
}
```

Tiếp tục giữ `id_lich_tiep_dan`, `ngay` và `slot` làm snapshot để không phá API cũ.

Ràng buộc SQL sau Phase 3:

```sql
CHECK ("trang_thai" IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'))
CHECK (
  "trang_thai" NOT IN ('APPROVED', 'COMPLETED')
  OR "id_cau_hinh_quay" IS NOT NULL
)
```

Service phê duyệt phải kiểm tra `id_cau_hinh_quay` thuộc đúng `id_ca_tiep_dan` của đơn.

### 4.4.1. Quy ước field chuẩn trong giai đoạn chuyển tiếp

| Bảng | Field | Vai trò | Quy tắc ghi mới |
|---|---|---|---|
| `dang_ky_tiep_dan` | `id_ca_tiep_dan` | Field V2 chuẩn xác định ca người dân đăng ký | Luôn ghi khi tạo đơn tiếp dân mới |
| `dang_ky_tiep_dan` | `id_cau_hinh_quay` | Field V2 chuẩn xác định quầy được phân | Để null khi `PENDING`; chỉ ghi khi phê duyệt |
| `dang_ky_tiep_dan` | `id_quay` | Field V1 dư thừa | Không ghi trong code mới; chỉ giữ để đọc tương thích cho đến Phase 3 cleanup |
| `dang_ky_tiep_dan` | `id_khung_gio_tiep_dan` | Field V1 dư thừa | Không ghi trong code mới; không dùng thay thế `id_ca_tiep_dan` |
| `khung_gio_tiep_dan` | `id_ca_tiep_dan` | Field V2 chuẩn liên kết cấu hình quầy với ca | Luôn ghi khi tạo/import/cập nhật lịch |
| `khung_gio_tiep_dan` | `id_quay` | Field V2 chuẩn liên kết danh mục quầy | Luôn ghi khi tạo/import/cập nhật lịch |

Các snapshot `id_lich_tiep_dan`, `ngay`, `slot`, `bo_phan` vẫn được giữ và dual-write trong giai đoạn chuyển tiếp để không phá response cũ. Riêng `id_quay` trên `khung_gio_tiep_dan` là field V2 chuẩn, không được nhầm với `dang_ky_tiep_dan.id_quay` V1.

Thứ tự đọc trong repository:

1. Đọc `id_ca_tiep_dan` và `id_cau_hinh_quay` cùng relation V2 trước.
2. Chỉ fallback snapshot V1 cho bản ghi cũ chưa backfill.
3. Không suy luận ca bằng cách coi `id_khung_gio_tiep_dan` là `id_ca_tiep_dan`.
4. Không xóa cột V1 trước khi các truy vấn verify bắt buộc trả về `0` và Phase 3 được duyệt riêng.

### 4.5. Hệ thống gặp lãnh đạo

#### `lich_gap_lanh_dao`

```prisma
model lich_gap_lanh_dao {
  id                 String    @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  id_lanh_dao        String    @db.Uuid
  ngay               DateTime  @db.Date
  dia_diem           String?   @db.VarChar(255)
  ghi_chu            String?
  is_active          Boolean   @default(true)
  is_delete          Boolean   @default(false)
  nguoi_tao          String?   @db.Uuid
  nguoi_cap_nhat     String?   @db.Uuid
  thoi_gian_tao      DateTime  @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)
  thoi_gian_cap_nhat DateTime? @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)

  lanh_dao            nguoi_dung                  @relation("LichGapLanhDao_LanhDao", fields: [id_lanh_dao], references: [id], onDelete: Restrict, onUpdate: NoAction)
  khung_gio            khung_gio_gap_lanh_dao[]

  @@unique([id_lanh_dao, ngay], map: "uq_lich_gap_lanh_dao_ngay")
  @@index([ngay], map: "idx_lich_gap_lanh_dao_ngay")
  @@index([is_active, is_delete], map: "idx_lich_gap_lanh_dao_trang_thai")
}
```

#### `khung_gio_gap_lanh_dao`

```prisma
model khung_gio_gap_lanh_dao {
  id                 String    @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  id_lich_gap        String    @db.Uuid
  gio_bat_dau        DateTime  @db.Time(0)
  gio_ket_thuc       DateTime  @db.Time(0)
  suc_chua           Int       @default(1)
  is_active          Boolean   @default(true)
  is_delete          Boolean   @default(false)
  nguoi_tao          String?   @db.Uuid
  nguoi_cap_nhat     String?   @db.Uuid
  thoi_gian_tao      DateTime  @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)
  thoi_gian_cap_nhat DateTime? @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)

  lich_gap_lanh_dao  lich_gap_lanh_dao       @relation(fields: [id_lich_gap], references: [id], onDelete: Restrict, onUpdate: NoAction)
  dang_ky             dang_ky_gap_lanh_dao[]

  @@unique([id_lich_gap, gio_bat_dau, gio_ket_thuc], map: "uq_khung_gio_gap_lanh_dao")
  @@index([id_lich_gap], map: "idx_khung_gio_gap_lanh_dao_id_lich")
}
```

Ràng buộc:

```sql
CHECK ("suc_chua" >= 1)
CHECK ("gio_bat_dau" < "gio_ket_thuc")
```

#### `dang_ky_gap_lanh_dao`

```prisma
model dang_ky_gap_lanh_dao {
  id                   String    @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  ma_dang_ky           String    @unique(map: "uq_dang_ky_gap_lanh_dao_ma") @db.VarChar(50)
  id_khung_gio_gap     String    @db.Uuid
  chu_de               String?   @db.VarChar(255)
  ly_do                String
  ho_ten               String    @db.VarChar(150)
  sdt                  String    @db.VarChar(20)
  cccd                 String    @db.VarChar(20)
  ngay_cap_cccd        DateTime? @db.Date
  noi_cap_cccd         String?   @db.VarChar(255)
  dia_chi              String
  ngay_lam_don         DateTime? @db.Date
  trang_thai           String    @default("PENDING") @db.VarChar(30)
  thoi_gian_phe_duyet  DateTime? @db.Timestamp(6)
  thoi_gian_hoan_thanh DateTime? @db.Timestamp(6)
  thoi_gian_tu_choi    DateTime? @db.Timestamp(6)
  ly_do_tu_choi        String?
  nguoi_duyet_don      String?   @db.Uuid
  nguoi_hoan_thanh     String?   @db.Uuid
  nguoi_tu_choi        String?   @db.Uuid
  is_active            Boolean   @default(true)
  is_delete            Boolean   @default(false)
  nguoi_tao            String?   @db.Uuid
  nguoi_cap_nhat       String?   @db.Uuid
  thoi_gian_tao        DateTime  @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)
  thoi_gian_cap_nhat   DateTime? @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)

  khung_gio            khung_gio_gap_lanh_dao @relation(fields: [id_khung_gio_gap], references: [id], onDelete: Restrict, onUpdate: NoAction)
  nguoi_duyet          nguoi_dung? @relation("DangKyGapLanhDao_NguoiDuyet", fields: [nguoi_duyet_don], references: [id], onDelete: SetNull, onUpdate: NoAction)
  nguoi_hoan_thanh_ref nguoi_dung? @relation("DangKyGapLanhDao_NguoiHoanThanh", fields: [nguoi_hoan_thanh], references: [id], onDelete: SetNull, onUpdate: NoAction)
  nguoi_tu_choi_ref    nguoi_dung? @relation("DangKyGapLanhDao_NguoiTuChoi", fields: [nguoi_tu_choi], references: [id], onDelete: SetNull, onUpdate: NoAction)
  dinh_kem             dinh_kem_dang_ky_gap_lanh_dao[]
  danh_gia             danh_gia_gap_lanh_dao?

  @@index([id_khung_gio_gap], map: "idx_dang_ky_gap_id_khung_gio")
  @@index([sdt], map: "idx_dang_ky_gap_sdt")
  @@index([cccd], map: "idx_dang_ky_gap_cccd")
  @@index([trang_thai], map: "idx_dang_ky_gap_trang_thai")
}
```

Ràng buộc trạng thái:

```sql
CHECK ("trang_thai" IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'))
```

#### `dinh_kem_dang_ky_gap_lanh_dao`

```prisma
model dinh_kem_dang_ky_gap_lanh_dao {
  id             String   @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  id_dang_ky     String   @db.Uuid
  loai_dinh_kem  String   @db.VarChar(30)
  ten_file_goc   String   @db.VarChar(255)
  duong_dan_file String
  mime_type      String?  @db.VarChar(100)
  kich_thuoc     Int?
  thoi_gian_tao  DateTime @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)

  dang_ky dang_ky_gap_lanh_dao @relation(fields: [id_dang_ky], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@index([id_dang_ky], map: "idx_dinh_kem_gap_id_dang_ky")
}
```

Ràng buộc:

```sql
CHECK ("loai_dinh_kem" IN ('CCCD_FRONT', 'CCCD_BACK', 'SUPPORTING_DOCUMENT'))
CHECK ("kich_thuoc" IS NULL OR "kich_thuoc" >= 0)
```

Một đơn chỉ được có một ảnh trước và một ảnh sau:

```sql
CREATE UNIQUE INDEX "uq_dinh_kem_gap_cccd_front"
ON "dinh_kem_dang_ky_gap_lanh_dao" ("id_dang_ky")
WHERE "loai_dinh_kem" = 'CCCD_FRONT';

CREATE UNIQUE INDEX "uq_dinh_kem_gap_cccd_back"
ON "dinh_kem_dang_ky_gap_lanh_dao" ("id_dang_ky")
WHERE "loai_dinh_kem" = 'CCCD_BACK';
```

Giới hạn ba tài liệu hỗ trợ phải được kiểm tra trong transaction ở service.

#### `danh_gia_gap_lanh_dao`

```prisma
model danh_gia_gap_lanh_dao {
  id                      String    @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  id_dang_ky_gap_lanh_dao String    @unique(map: "uq_danh_gia_gap_lanh_dao_id_dang_ky") @db.Uuid
  diem_tong               Int
  tieu_chi                Json?
  ly_do                   Json?
  nhan_xet                String?
  is_active               Boolean   @default(true)
  is_delete               Boolean   @default(false)
  thoi_gian_tao           DateTime  @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)
  thoi_gian_cap_nhat      DateTime? @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)

  dang_ky dang_ky_gap_lanh_dao @relation(fields: [id_dang_ky_gap_lanh_dao], references: [id], onDelete: Restrict, onUpdate: NoAction)

  @@index([diem_tong], map: "idx_danh_gia_gap_lanh_dao_diem_tong")
}
```

Ràng buộc:

```sql
CHECK ("diem_tong" BETWEEN 1 AND 5)
CHECK ("nhan_xet" IS NULL OR char_length("nhan_xet") <= 2000)
```

### 4.6. Relation cần bổ sung vào `nguoi_dung`

```prisma
lich_gap_lanh_dao_phu_trach       lich_gap_lanh_dao[]     @relation("LichGapLanhDao_LanhDao")
dang_ky_gap_lanh_dao_da_duyet     dang_ky_gap_lanh_dao[]  @relation("DangKyGapLanhDao_NguoiDuyet")
dang_ky_gap_lanh_dao_da_hoan_thanh dang_ky_gap_lanh_dao[] @relation("DangKyGapLanhDao_NguoiHoanThanh")
dang_ky_gap_lanh_dao_da_tu_choi   dang_ky_gap_lanh_dao[]  @relation("DangKyGapLanhDao_NguoiTuChoi")
phan_cong_quay_tiep_dan            phan_cong_quay_tiep_dan[] @relation("PhanCongQuay_CanBo")
```

Quan hệ người duyệt/hoàn thành/từ chối của tiếp dân quầy cũng cần được đặt tên riêng nếu bổ sung relation Prisma.

## 5. Quy tắc sức chứa và chống gửi trùng

### 5.1. Tiếp dân tại quầy

- Khi tạo đơn, giữ chỗ ở cấp `ca_tiep_dan`, chưa gán quầy.
- Mọi bản ghi đã tạo đều giữ chỗ, không trả lại chỗ.
- Khi phê duyệt, backend lấy cán bộ từ access token và tìm phân công quầy trong đúng ca của đơn.
- Nếu request cũ còn gửi `department`, backend chỉ dùng để đối chiếu với phân công; không được dùng làm nguồn dữ liệu tin cậy duy nhất.
- Không có phân công hợp lệ trả `403` với thông báo `Cán bộ chưa được phân công quầy trong ca này`.
- Mã quầy không khớp phân công trả `403` với thông báo `Cán bộ không được phân công tại quầy này trong ca này`.
- Không được giảm sức chứa quầy thấp hơn số đăng ký đã được gán vào quầy.
- Không được giảm tổng sức chứa ca thấp hơn tổng đăng ký đã giữ chỗ.
- Giữ giới hạn hiện tại: một SĐT hoặc CCCD tối đa hai đơn trong một ngày.
- Chống gửi trùng cùng ca bằng unique index:

```sql
CREATE UNIQUE INDEX "uq_counter_registration_ca_phone_v2"
ON "dang_ky_tiep_dan" ("id_ca_tiep_dan", "sdt")
WHERE "sdt" IS NOT NULL;

CREATE UNIQUE INDEX "uq_counter_registration_ca_citizen_v2"
ON "dang_ky_tiep_dan" ("id_ca_tiep_dan", "cccd")
WHERE "cccd" IS NOT NULL;
```

### 5.2. Gặp lãnh đạo

- Sức chứa mặc định một người/khung giờ, có thể cấu hình.
- Tạo đơn và kiểm tra sức chứa trong transaction `Serializable`.
- Chống cùng SĐT hoặc CCCD đăng ký trùng cùng khung giờ:

```sql
CREATE UNIQUE INDEX "uq_leader_meeting_slot_phone"
ON "dang_ky_gap_lanh_dao" ("id_khung_gio_gap", "sdt");

CREATE UNIQUE INDEX "uq_leader_meeting_slot_citizen"
ON "dang_ky_gap_lanh_dao" ("id_khung_gio_gap", "cccd");
```

Nội dung còn cần xác nhận trước khi code API gặp lãnh đạo: đơn `REJECTED` có tiếp tục giữ chỗ hay trả lại chỗ. Đề xuất nhất quán với tiếp dân quầy: đã tạo đơn thì không trả chỗ.

## 6. Migration theo ba phase

### 6.1. Phase 0 — Chuẩn bị

1. Tạo database local có quyền owner để sinh migration.
2. Chạy `prisma migrate status` trên DEV dùng chung.
3. Backup schema và dữ liệu DEV.
4. Đếm dữ liệu theo `loai`.
5. Đếm đánh giá liên quan `LEADER_MEETING`.
6. Kiểm tra tất cả `bo_phan` và `ma_quay` có thuộc `QUAY_1` đến `QUAY_8`.
7. Kiểm tra mọi chuỗi `slot` và `khung_gio` có định dạng hợp lệ.

Không dùng `prisma migrate dev` trực tiếp trên DEV dùng chung.

### 6.2. Phase 1 — Expand

Chỉ thêm mới, không xóa hoặc rename cột cũ:

1. Tạo `quay_tiep_dan` và seed tám quầy, tất cả mặc định hai người.
2. Tạo `ca_tiep_dan`.
3. Thêm `id_ca_tiep_dan`, `id_quay` vào `khung_gio_tiep_dan` dưới dạng nullable.
4. Thêm `id_ca_tiep_dan`, `id_cau_hinh_quay`, `nguoi_duyet_don` vào `dang_ky_tiep_dan` dưới dạng nullable.
5. Tạo bảng `phan_cong_quay_tiep_dan` và các FK/index liên quan.
6. Tạo năm bảng nghiệp vụ gặp lãnh đạo.
7. Tạo FK, CHECK constraint và index mới bằng tên có hậu tố `_v2` nếu tên cũ đang tồn tại.
8. Bổ sung relation Prisma phía `nguoi_dung`.

Migration PostgreSQL phải có transaction:

```sql
BEGIN;
-- DDL Phase 1
COMMIT;
```

Quy trình lệnh:

```text
Local:  prisma migrate dev --create-only --name phase1_expand_reception_models
Review migration.sql
DEV:    prisma migrate deploy
```

### 6.3. Phase 2 — Backfill

#### Bước 1: Backfill ca

Tạo một `ca_tiep_dan` cho mỗi tổ hợp lịch và khung giờ đang có:

```sql
INSERT INTO "ca_tiep_dan" (
  "id",
  "id_lich_tiep_dan",
  "gio_bat_dau",
  "gio_ket_thuc"
)
SELECT
  public.uuid_generate_v4(),
  kg."id_lich_tiep_dan",
  trim(split_part(kg."khung_gio", '-', 1))::time,
  trim(split_part(kg."khung_gio", '-', 2))::time
FROM "khung_gio_tiep_dan" kg
GROUP BY
  kg."id_lich_tiep_dan",
  trim(split_part(kg."khung_gio", '-', 1))::time,
  trim(split_part(kg."khung_gio", '-', 2))::time
ON CONFLICT ("id_lich_tiep_dan", "gio_bat_dau", "gio_ket_thuc") DO NOTHING;
```

#### Bước 2: Backfill cấu hình quầy

```sql
UPDATE "khung_gio_tiep_dan" kg
SET
  "id_ca_tiep_dan" = ca."id",
  "id_quay" = q."id"
FROM "ca_tiep_dan" ca, "quay_tiep_dan" q
WHERE ca."id_lich_tiep_dan" = kg."id_lich_tiep_dan"
  AND ca."gio_bat_dau" = trim(split_part(kg."khung_gio", '-', 1))::time
  AND ca."gio_ket_thuc" = trim(split_part(kg."khung_gio", '-', 2))::time
  AND q."ma_quay" = kg."ma_quay";
```

#### Bước 3: Backfill đăng ký quầy

```sql
UPDATE "dang_ky_tiep_dan" dk
SET "id_ca_tiep_dan" = ca."id"
FROM "ca_tiep_dan" ca
WHERE dk."loai" = 'COUNTER_RECEPTION'
  AND ca."id_lich_tiep_dan" = dk."id_lich_tiep_dan"
  AND ca."gio_bat_dau" = trim(split_part(dk."slot", '-', 1))::time
  AND ca."gio_ket_thuc" = trim(split_part(dk."slot", '-', 2))::time;
```

Đơn đã được phân quầy được backfill đúng cấu hình quầy:

```sql
UPDATE "dang_ky_tiep_dan" dk
SET "id_cau_hinh_quay" = kg."id"
FROM "khung_gio_tiep_dan" kg
JOIN "quay_tiep_dan" q ON q."id" = kg."id_quay"
WHERE dk."loai" = 'COUNTER_RECEPTION'
  AND dk."id_ca_tiep_dan" = kg."id_ca_tiep_dan"
  AND dk."bo_phan" = q."ma_quay";
```

#### Bước 3.1: Khởi tạo phân công cán bộ - quầy

- Không tự động map dựa trên tên tài khoản (`canbo3`) hoặc trường chuỗi `ten_can_bo`.
- Chuẩn bị file dữ liệu phân công đã được người phụ trách xác nhận, gồm: ngày/lịch, ca, mã quầy và UUID cán bộ.
- Script import phải có dry-run, kiểm tra cán bộ tồn tại/đang hoạt động, quầy thuộc đúng ca và phát hiện trùng phân công.
- Không ghi dữ liệu nếu một quầy có nhiều cán bộ chính trong cùng ca hoặc một cán bộ bị phân vào nhiều quầy trong cùng ca.
- Xuất báo cáo các ca chưa có phân công để xử lý thủ công.

#### Bước 4: Chuyển dữ liệu gặp lãnh đạo

Tạo script `scripts/migrate-leader-meeting.js` với các yêu cầu:

- Chỉ đọc bản ghi `LEADER_MEETING` chưa được map.
- Mapping lãnh đạo bằng file cấu hình UUID đã được kiểm tra thủ công; không tự đoán chỉ dựa trên tên gần giống.
- Tạo lịch, khung giờ, đăng ký và đánh giá trong transaction.
- Giữ mã đăng ký, trạng thái, thời gian và audit cũ.
- Ghi bảng mapping `migration_leader_meeting_map` gồm ID cũ, ID mới và thời gian migrate.
- Có chế độ dry-run.
- Chạy lại không tạo dữ liệu trùng.
- Xuất báo cáo các bản ghi không ánh xạ được.

#### Bước 5: Dual read/dual write

- Tạo đăng ký mới ghi đồng thời `id_ca_tiep_dan` và các snapshot cũ.
- Phê duyệt lấy `currentUser.userId`, tìm phân công của đúng ca, kiểm tra quầy và sức chứa trong cùng transaction rồi ghi đồng thời `id_cau_hinh_quay`, `bo_phan` và `nguoi_duyet_don`.
- API vẫn trả `department` và `departmentName`.
- Trong thời gian chuyển tiếp, repository đọc trường mới trước và fallback trường cũ.
- Giữ `TIEP_DAN_TYPE.COUNTER_RECEPTION` để response cũ vẫn có `receptionType`.

#### Bước 6: Verify bắt buộc

Các truy vấn dưới đây phải trả về `0`:

```sql
SELECT COUNT(*)
FROM "khung_gio_tiep_dan"
WHERE "id_ca_tiep_dan" IS NULL OR "id_quay" IS NULL;

SELECT COUNT(*)
FROM "dang_ky_tiep_dan"
WHERE "loai" = 'COUNTER_RECEPTION'
  AND "id_ca_tiep_dan" IS NULL;

SELECT COUNT(*)
FROM "dang_ky_tiep_dan"
WHERE "loai" = 'COUNTER_RECEPTION'
  AND "trang_thai" IN ('APPROVED', 'COMPLETED')
  AND "id_cau_hinh_quay" IS NULL;

SELECT COUNT(*)
FROM "dang_ky_tiep_dan"
WHERE "loai" = 'LEADER_MEETING'
  AND "id" NOT IN (
    SELECT "id_dang_ky_cu" FROM "migration_leader_meeting_map"
  );

SELECT COUNT(*)
FROM "phan_cong_quay_tiep_dan" pc
LEFT JOIN "khung_gio_tiep_dan" kg ON kg."id" = pc."id_cau_hinh_quay"
LEFT JOIN "nguoi_dung" nd ON nd."id" = pc."id_can_bo"
WHERE kg."id" IS NULL OR nd."id" IS NULL;
```

### 6.4. Phase 3 — Cleanup

Chỉ thực hiện sau khi chạy ổn định và được xác nhận bằng văn bản:

1. Backup lần cuối.
2. Xác nhận mọi dữ liệu `LEADER_MEETING` đã có mapping.
3. Chuyển/xóa đánh giá gặp lãnh đạo khỏi bảng cũ.
4. Chuyển/xóa đăng ký `LEADER_MEETING` khỏi `dang_ky_tiep_dan`.
5. Tạo unique chống trùng mới theo `id_ca_tiep_dan`.
6. Xóa các unique cũ phụ thuộc `loai` bằng `DROP INDEX`, không dùng `DROP CONSTRAINT`.
7. Xóa `bo_phan`, `loai`, `ten_lanh_dao`, `chuc_vu_lanh_dao`.
8. Xóa `ma_quay`, `khung_gio` và `id_lich_tiep_dan` cũ khỏi bảng cấu hình quầy nếu code không còn dùng.
9. Đặt `id_ca_tiep_dan` và `id_quay` của cấu hình quầy thành `NOT NULL`.
10. Đặt `id_ca_tiep_dan` của đăng ký quầy thành `NOT NULL`.
11. Không xóa `dia_chi`, `nguoi_tao` hoặc `nguoi_cap_nhat`.
12. Có thể xóa `RECEPTION_COUNTER_CODES` sau khi mọi truy vấn đọc quầy từ DB.
13. Không xóa `TIEP_DAN_TYPE` nếu API cũ vẫn trả `receptionType`.
14. Giữ bảng phân công làm nguồn xác định cán bộ trực quầy; không chuyển quan hệ này thành `nguoi_dung.id_quay`.

## 7. Rollback

### 7.1. Phase 1

Chỉ rollback tự động khi chưa có dữ liệu nghiệp vụ mới:

1. Drop FK mới.
2. Drop cột mới.
3. Drop bảng mới theo thứ tự phụ thuộc.
4. Không dùng `CASCADE` ngoài phạm vi đã kiểm tra.

### 7.2. Phase 2

Không cần xóa dữ liệu mới ngay. Có thể rollback ứng dụng về đọc trường cũ vì các cột cũ vẫn còn. Giữ mapping và dữ liệu đã backfill để điều tra.

### 7.3. Phase 3

Không coi việc thêm lại cột rỗng là rollback. Sau cleanup, rollback hợp lệ là:

- Restore từ backup đã kiểm chứng; hoặc
- Khôi phục từ bảng archive/mapping được giữ riêng.

## 8. API contract được giữ nguyên

### Phê duyệt và gán quầy

Request vẫn là:

```http
PATCH /api/reception-registrations/{id}/approve
```

```json
{
  "department": "QUAY_3"
}
```

Trong giai đoạn tương thích, `department` được giữ nhưng không còn là nguồn xác định quầy duy nhất. Backend phải xác thực mã này khớp với phân công của cán bộ đăng nhập trong đúng ca.

Backend thực hiện:

1. Lấy `id_ca_tiep_dan` của đơn.
2. Lấy `currentUser.userId` từ access token.
3. Tìm phân công đang hoạt động của cán bộ trong đúng ca.
4. Nếu request có `department`, kiểm tra mã quầy đó khớp phân công.
5. Không có phân công hoặc không khớp phân công thì trả `403`.
6. Kiểm tra sức chứa của quầy được phân công trong transaction.
7. Lưu `id_cau_hinh_quay` và `nguoi_duyet_don`.
8. Trong giai đoạn dual-write vẫn lưu `bo_phan` bằng mã quầy đã được backend xác thực.

Response tiếp tục trả:

```json
{
  "department": "QUAY_3",
  "departmentName": "Quầy số 3"
}
```

## 9. Kiểm thử bắt buộc

### Database/migration

- Phase 1 chạy thành công trên bản sao database.
- Không trùng tên index/constraint.
- Backfill ca đúng số lượng distinct lịch/khung giờ.
- Tám cấu hình quầy của mỗi ca được map đúng.
- Không có đăng ký quầy thiếu `id_ca_tiep_dan`.
- Đơn đã duyệt/hoàn thành không thiếu cấu hình quầy.
- Số đăng ký và đánh giá gặp lãnh đạo trước/sau bằng nhau.
- Migration chạy lại không tạo bản ghi trùng.

### API

- API cũ tiếp tục nhận `department`, nhưng backend phải đối chiếu với phân công thay vì tin trực tiếp giá trị client gửi.
- Cán bộ có phân công đúng ca/quầy phê duyệt thành công.
- Cán bộ không có phân công trong ca nhận `403`.
- Cán bộ gửi mã quầy khác phân công nhận `403`.
- Một tài khoản được phân công các quầy khác nhau ở các ngày/ca khác nhau.
- Không tạo được hai cán bộ chính cho cùng quầy/ca.
- Không tạo được hai quầy cho cùng cán bộ trong cùng ca theo quy tắc mặc định.
- Tạo đơn mới giữ chỗ theo ca.
- Phê duyệt gán đúng quầy.
- Quầy đầy trả `409`.
- Hai request đồng thời không vượt sức chứa.
- Thiếu quyền trả `403`.
- Chỉ `COMPLETED` mới được đánh giá.
- Gửi đánh giá trùng trả `409`.

### Regression

- Chạy toàn bộ `npm test`.
- Chạy `prisma validate`.
- Chạy `prisma migrate status`.
- Kiểm tra Swagger đủ ví dụ request/response.
- Kiểm tra các route cũ không đổi tên và response cũ vẫn tương thích.

## 10. Thứ tự thực hiện sau khi plan được duyệt

```text
1. Chốt quy tắc REJECTED của gặp lãnh đạo có giữ chỗ hay không.
2. Chốt có cho một cán bộ trực nhiều quầy hoặc một quầy có nhiều cán bộ trong cùng một ca hay không; mặc định plan đang không cho phép.
3. Chuẩn bị dữ liệu phân công cán bộ - quầy được xác nhận, không suy luận từ username.
4. Tạo migration Phase 1 bằng --create-only trên local.
5. Review SQL và chạy thử trên database clone.
6. Chạy test và đối soát.
7. Backup DEV.
8. prisma migrate deploy lên DEV.
9. Chạy backfill dry-run rồi backfill thật.
10. Deploy code dual-read/dual-write.
11. Chạy integration/API regression test.
12. Theo dõi ổn định.
13. Chỉ tạo Phase 3 sau khi có xác nhận riêng.
```

## 11. Điều kiện để được phép thay đổi DB

Chỉ bắt đầu migration khi đồng thời đáp ứng:

- Plan này được duyệt.
- Quy tắc giữ chỗ của đơn gặp lãnh đạo bị từ chối đã được chốt.
- Quy tắc một hay nhiều cán bộ/quầy trong cùng ca đã được chốt.
- Có dữ liệu phân công cán bộ - quầy đã được xác nhận để import/backfill.
- Có backup hoặc database clone khôi phục được.
- Có quyền owner cho migration.
- Không còn Prisma drift chưa giải thích.
- Có test migration và test regression.
- Có kế hoạch dừng service hoặc bảo đảm dual-write trong thời gian backfill.
