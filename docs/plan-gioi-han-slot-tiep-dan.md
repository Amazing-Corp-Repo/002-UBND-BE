# Plan — Giới hạn số lượng đăng ký theo khung giờ tiếp dân

> Dạng: **task plan** — chờ review. Nhánh: `jun` (merge về `staging`).
> Context: hạn chế số người đăng ký mỗi **khung giờ** (VD `07:30 - 08:30`) của lịch tiếp dân, giúp cán bộ quản được năng lực tiếp đón thực tế.

---

## 1. Vấn đề hiện tại

- `lich_tiep_dan.thoi_gian` là **một dải giờ** (VD `07:30 - 11:30`), service `buildHourlySlots()` tự tách thành nhiều khung giờ 1h.
- `dang_ky_tiep_dan.slot` lưu chuỗi khung giờ đã chọn (VD `08:30 - 09:30`).
- Nghiệp vụ đăng ký hiện chỉ chặn trùng `(id_lich_tiep_dan, slot, sdt)` — **không giới hạn số người đăng ký mỗi khung giờ**. Người dân có thể đăng ký vô hạn vào cùng khung giờ.

## 2. Mục tiêu (yêu cầu mới)

1. **Role cán bộ** set được **số lượng tối đa** được đăng ký cho **từng khung giờ** (VD riêng `07:30 - 08:30` = 5 người).
2. Có **API riêng** để set/đọc cấu hình giới hạn theo từng khung giờ.
3. Mỗi khung giờ có **trạng thái sẵn sàng**: còn lượt thì `AVAILABLE`, đủ giới hạn thì `FULL`.
4. Khi `FULL` → **chặn đăng ký** (400/409), FE ẩn/khóa khung giờ.
5. Giữ nguyên hành vi cũ khi **chưa cấu hình** khung giờ nào (không giới hạn) — tránh vỡ contract Mobile hiện tại.
6. Khi **hủy đơn** hoặc **tiếp xong** → **giảm `registeredCount`** (giải phóng chỗ), để khung giờ **còn trong thời gian hiệu lực** nhận đăng ký tiếp.
7. Vì điểm 6 cần phân biệt đơn còn chiếm chỗ hay không → bổ sung **trạng thái mới** `CANCELLED` (đã hủy) và `DONE` (đã tiếp xong), và **API hủy / hoàn tất**.

---

## 3. Thiết kế dữ liệu

### 3.1. Bảng mới `lich_tiep_dan_cau_hinh`

Config theo **từng (lịch, khung giờ)**. Vì `lich_tiep_dan` lưu dải giờ và khung giờ là giá trị suy ra, config phải nằm ở bảng con, không thêm cột trực tiếp vào `lich_tiep_dan`.

```prisma
model lich_tiep_dan_cau_hinh {
  id               String       @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  id_lich_tiep_dan String       @db.Uuid
  slot             String       @db.VarChar(50) // VD "07:30 - 08:30" (khớp chuỗi buildHourlySlots)
  so_luong_toi_da  Int                         // tối đa số đăng ký cho khung giờ này
  is_active        Boolean?     @default(true)
  is_delete        Boolean?     @default(false)
  nguoi_tao        String?      @db.Uuid
  nguoi_cap_nhat   String?      @db.Uuid
  thoi_gian_tao    DateTime?    @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)
  thoi_gian_cap_nhat DateTime?  @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)

  lich_tiep_dan    lich_tiep_dan @relation(fields: [id_lich_tiep_dan], references: [id], onUpdate: NoAction, map: "fk_lich_tiep_dan_cau_hinh_lich")

  @@unique([id_lich_tiep_dan, slot], map: "uq_lich_tiep_dan_cau_hinh_slot")
  @@index([id_lich_tiep_dan], map: "idx_ltd_ch_id_lich")
}
```

- **1 row = 1 config** cho một khung giờ của một lịch. Khung giờ nào **chưa có row** → mặc định **không giới hạn** (bảo toàn hành vi cũ).
- Kèm `@@relation` ở model `lich_tiep_dan` (thêm mảng `lich_tiep_dan_cau_hinh`).
- Tuân theo chuẩn: PK UUID + bộ cột audit + `is_active`/`is_delete`.

> **Phương án thay thế đơn giản hơn (đang cân nhắc):** thêm cột `so_luong_toi_da Int?` lên thẳng `lich_tiep_dan` — nhưng khi đó **cả dải giờ chung 1 con số**, không tách được riêng `07:30-08:30` như yêu cầu. **Không chọn** vì trái mục tiêu.

### 3.2. Số lượt đã dùng (`registeredCount`)

- `Đã dùng (registeredCount)` = số `dang_ky_tiep_dan` có `id_lich_tiep_dan` + `slot` trùng + `is_delete = false` + **`trang_thai IN (PENDING, APPROVED)`**.
- Các bản ghi `CANCELLED` / `DONE` **không đếm** → khi hủy hoặc tiếp xong, `registeredCount` tự giảm (slot được giải phóng).
- **`FULL`** khi `registeredCount >= so_luong_toi_da`.
- **`AVAILABLE`** khi `registeredCount < so_luong_toi_da` **hoặc** chưa config khung giờ đó.

> **"nếu vẫn còn trong khung giờ"**: việc *đăng ký mới* vốn đã chặn khung giờ đã qua (`createCounterReception` từ chối `ngay` < hôm nay). Do đó khi hủy/tiếp xong mà khung giờ đã trôi qua thì chỉ đơn giản là giảm count, không mở lại cho người khác — không cần logic thêm. Điều kiện "còn trong khung giờ" chỉ liên quan tới việc **cho phép hủy/hoàn tất trong thời điểm nào** (xem 4.4).

---

## 4. Thay đổi endpoint

### 4.1. Công khai khả năng của khung giờ — `GET /api/reception-schedules` (Mobile)

Hiện `availableSlots` là `string[]`. Đổi thành `array` object để FE biết khung nào full:

```json
{
  "id": "…",
  "officerName": "…",
  "location": "…",
  "receptionDate": "…",
  "timeRange": "07:30 - 11:30",
  "slotAvailability": [
    { "slot": "07:30 - 08:30", "capacity": 5, "registeredCount": 3, "status": "AVAILABLE" },
    { "slot": "08:30 - 09:30", "capacity": null, "registeredCount": 1, "status": "AVAILABLE", "unlimited": true }
  ],
  "note": "…"
}
```

- `capacity: null` + `unlimited: true` → chưa cấu hình (không giới hạn).
- **⚠ Breaking cho Mobile**: FE đang dùng `availableSlots` (array string). Cần **2 lựa chọn** — xem mục 9.1.

### 4.2. Cấu hình giới hạn — endpoint cán bộ

| Method | Endpoint | Permission (mới) | Body / Mô tả |
| --- | --- | --- | --- |
| `GET` | `/api/reception-schedules/:id/capacity` | `RRS_GET_CAPACITY` | Đọc config + số lượt từng khung giờ của lịch |
| `PUT` | `/api/reception-schedules/:id/capacity` | `RRS_SET_CAPACITY` | Bulk set config theo từng khung giờ |

Body `PUT`:
```json
{
  "slots": [
    { "slot": "07:30 - 08:30", "capacity": 5 },
    { "slot": "08:30 - 09:30", "capacity": 3 }
  ]
}
```

- `capacity >= 1`. Nếu `capacity: 0` → xóa config (trả về "không giới hạn"). Upsert theo `@@unique(..., slot)`.
- Validate: `slot` phải khớp giá trị `buildHourlySlots(thoi_gian)` của lịch + `capacity >= capacity` hiện tại... → validation cụ thể ở mục 6.

### 4.3. Chặn đăng ký khi đủ — `POST /api/reception-registrations`

Trong `createCounterReception`, **trước** khi insert:
1. Đọc config khung giờ đang đăng ký (`so_luong_toi_da`); nếu không có → bỏ qua check (không giới hạn).
2. `count` bản ghi đang active của `(id_lich_tiep_dan, slot)`.
3. Nếu `count >= so_luong_toi_da` → `BaseError(409, "Khung giờ này đã đủ số lượng đăng ký")`.

**Chống race** (2 request cùng lúc vượt giới hạn): xem mục 7.

### 4.4. Hủy đơn & hoàn tất (state machine + giải phóng chỗ)

**Máy trạng thái `trang_thai`:**
```
COUNTER_RECEPTION:
  PENDING ──approve──▶ APPROVED ──complete──▶ DONE
     │                    │
     └────cancel──────────┴────cancel──(chưa tới giờ)──▶ CANCELLED
```
- `PENDING`→`APPROVED` (cán bộ duyệt, đã có endpoint `PATCH /:id/approve`).
- `APPROVED`→`DONE` (cán bộ đánh dấu **đã tiếp xong**).
- `PENDING`/`APPROVED` →`CANCELLED` (hủy đơn) — chỉ khi **khung giờ chưa bắt đầu** (vẫn còn trong khung giờ).

**Endpoint mới:**

| Method | Endpoint | Auth | Permission | Mô tả |
| --- | --- | --- | --- | --- |
| `PATCH` | `/api/reception-registrations/:id/cancel` | Public hoặc theo mã | — (xem note) | Người dân **hủy đơn** của mình; giải phóng chỗ trong khung giờ còn hiệu lực |
| `PATCH` | `/api/reception-registrations/:id/complete` | `authenticate` | `RR_COMPLETE` | Cán bộ đánh dấu đã tiếp xong; giải phóng chỗ |

> **Note cancel:** docs hiện tại ghi *"Không có API hủy đơn Mobile"*. Nay cần hủy — chọn mô hình xác thực cho `cancel`:
> - **A (khuyến nghị):** Như `lookup` — người dân gửi `receptionCode` (+ số điện thoại để xác thực) trong body, không cần login → Public, dùng `logAuthMiddleware`/`receptionAudit`.
> - **B:** Yêu cầu login Mobile. Nặng hơn vì đăng ký hiện là Public.

**Luồng giải phóng chỗ (chung cho cancel & complete):**
1. Query bản ghi theo id/code → phải tồn tại, `is_delete = false`.
2. Validate trạng thái hợp lệ (máy trạng thái trên) + **khung giờ chưa bắt đầu** (cancel) / đã `APPROVED` (complete).
3. Cập nhật `trang_thai = CANCELLED | DONE`, ghi `nguoi_cap_nhat`/`thoi_gian_cap_nhat`.
4. `registeredCount` tự giảm (vì đã loại trừ `CANCELLED`/`DONE` ở 3.2) → nếu slot đang FULL sẽ quay về AVAILABLE (nếu khung giờ còn hiệu lực).

---

## 5. Permission mới

Thêm vào `src/constants/permission.constant.js` + **sync** qua `POST /api/permission/sync`:

| Code | Mô tả |
| --- | --- |
| `RRS_GET_CAPACITY` | Xem cấu hình giới hạn khung giờ |
| `RRS_SET_CAPACITY` | Set/cập nhật giới hạn khung giờ |

Ràng buộc (nghiệp vụ): role cán bộ đang dùng `RR_*`; `RRS_*` (Schedule) đi cùng nhóm để gán trong sync.

---

## 6. Layer & validate (đi đủ chuỗi)

| Layer | File | Thay đổi |
| --- | --- | --- |
| **schema** | `prisma/schema.prisma` | + model `lich_tiep_dan_cau_hinh` + relation ở `lich_tiep_dan` |
| **repository** | `src/repositories/reception-schedule.repository.js` | + `findConfig(scheduleId, slot)`, `countRegistered(scheduleId, slot)`, `upsertConfigs(...)`, `findConfigsBySchedule(id)` |
| **service** | `src/services/reception-schedule.service.js` | tính `slotAvailability` + `status` per khung giờ |
| **service** | `src/services/dang-ky-tiep-dan.service.js` | check capacity trước insert |
| **controller** | `src/controllers/reception-schedule.controller.js` | + `getCapacity`, `setCapacity` |
| **validators** | `src/validators/reception-schedule.validator.js` | + `UpdateCapacityRequest` (slot ∈ hợp lệ, capacity ≥ 1) |
| **routes** | `src/routes/reception-schedule.route.js` | + `GET/PUT :id/capacity` (authenticate + authorize + validate) |
| **swagger** | `src/swagger/reception-schedule.swagger.js` | cập nhật response + endpoint mới |
| **constants** | `src/constants/permission.constant.js` | + `RRS_*` |
| **seed** | `prisma/seed.js` | (tùy chọn) 1 lịch DEV có config để test full |

**Validation capacity**:
- `capacity` nguyên 1..255.
- `slot` có 2 dạng chuẩn hóa: `"07:30 - 08:30"` (FE Mobile gửi có dấu cách) và `"07:30-08:30"` (từ `buildHourlySlots`). **Chuẩn hóa** về một dạng khi so khớp.
- `slot` phải thuộc danh sách khung giờ của `lich_tiep_dan.thoi_gian` (từ `buildHourlySlots`), else `BaseError(400)`.

---

## 7. Chống race / tính nhất quán

Có 2 hướng (chọn 1, mặc định **cả hai** để chắc):

1. **Read → check → insert theo transaction** (`$transaction`): đếm rồi insert trong cùng transaction — đủ với mức tải này, chặn phần lớn race.
2. **(Đề xuất thêm) cột `so_luong_toi_da` + trigger/Kiểm tra ở DB** — phức tạp, skip ở phase đầu; ghi TODO nếu sau này cần đúng tuyệt đối.

> Vì không có API hủy và slot không thể vượt giới hạn bình thường, phương án `$transaction` đếm+insert là đủ thực tế.

---

## 8. Migration & deploy

1. Sửa `schema.prisma` → `npx prisma migrate dev --name add_slot_capacity` (**DB dev cục bộ**).
2. #new migration **giữ schema-agnostic** (bỏ `"<SCHEMA>".` qualifier + dòng `CREATE SCHEMA`).
3. `npx prisma generate`.
4. `prisma migrate deploy` lên staging → chạy test → prod. **Backup `pg_dump -n '"<SCHEMA>"'` trước khi lên prod.**
5. Không dùng `migrate dev/reset` trên server.

---

## 9. Quyết định cần chốt (open points)

### 9.1. Response `GET /api/reception-schedules` — breaking hay không phá vỡ Mobile
- **Option A (khuyến nghị):** Đổi `availableSlots` → `slotAvailability` (objects có `status/capacity/registeredCount`). FE Mobile **phải cập nhật** để ẩn khung full.
- **Option B (không phá vỡ):** Giữ `availableSlots` (chuỗi full chỉ ẩn phía FE bằng cách vẫn trả nhưng thêm field phụ). → Cần FE chủ động.

### 9.2. Capacity áp cho cả khung giờ hay mỗi khung khác nhau?
Đã chốt theo **từng khung giờ** (yêu cầu rõ). Xác nhận lại với PO trước khi code.

### 9.3. Đếm `registeredCount` có gồm bản ghi `PENDING`?
Mặc định: **có** (tất cả active). Nếu sau này có trạng thái "từ chối/hết hạn" thì thêm lọc.

### 9.4. Có cần nút "tắt giới hạn" (clear config) riêng?
Đã gộp vào `capacity: 0` = xóa config → không giới hạn.

---

## 10. Checklist triển khai

- [ ] Thêm model `lich_tiep_dan_cau_hinh` + relation
- [ ] Migration `add_slot_capacity` + generate + schema-agnostic
- [ ] Permission `RRS_GET_CAPACITY`, `RRS_SET_CAPACITY` + sync
- [ ] `GET/PUT /:id/capacity` (route → controller → service → repo, validate + swagger)
- [ ] Mở rộng `GET /api/reception-schedules` trả `slotAvailability` + `status`
- [ ] Chặn đăng ký khi full trong `createCounterReception` (`$transaction` đếm+insert)
- [ ] Test (xem mục 11)
- [ ] `migrate deploy` staging → test → backup → deploy prod

---

## 11. Kế hoạch test

**Unit/INTEGRATION** (kế thừa `test/reception-schedule.*`, `test/dang-ky-tiep-dan.create.test.js`):
- Chưa config khung giờ → đăng ký bình thường (không giới hạn). ✅ hành vi cũ
- Config `capacity=2`, 2 người đăng ký OK; người thứ 3 → `409` "đã đủ".
- Set `capacity` mới nhỏ hơn số đã đăng ký → `registeredCount` phản ánh `FULL` ngay, khóa thêm.
- Clear config (`capacity:0`) → về không giới hạn.
- `slot` không hợp lệ / không thuộc khung giờ của lịch → `400`.
- Bulk upsert config, thay đổi từng slot độc lập không ảnh hưởng slot khác.
- `GET schedule` trả đúng `status`/`capacity`/`registeredCount` từng khung.

**Race (mô phỏng):** gửi N request đồng thời vào slot còn 1 lượt → chỉ 1 thành công.