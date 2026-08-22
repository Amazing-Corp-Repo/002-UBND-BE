# Đề xuất cập nhật API đánh giá tiếp dân nhập thủ công

> Trạng thái: **Đã triển khai code, migration, Swagger và test ngày 22/08/2026. Migration chưa được áp dụng lên DB thật trong bước này.**

## Kết quả triển khai

- `POST /api/reception-ratings` nhận toàn bộ dữ liệu thủ công, không cần đăng nhập và không đối chiếu đăng ký tiếp dân.
- Chống trùng `ma_tiep_dan` ở cả service và unique index DB.
- `GET /api/reception-ratings/configuration` trả thêm 8 quầy.
- API danh sách, chi tiết và thống kê của lãnh đạo đọc trực tiếp snapshot mới.
- Thống kê trả theo quầy, theo cán bộ và giữ alias `byDepartment`.
- Bổ sung loại quyền `GET_STATS: "Xem thống kê"`.
- API tra cứu đánh giá theo đăng ký cũ chỉ được đánh dấu deprecated trong Swagger; route và code runtime không đổi.
- Migration có backfill dữ liệu lịch sử và giữ khóa ngoại cũ để truy vết.

## 1. Phạm vi nghiệp vụ mới

- Người dân không đăng ký lịch tiếp dân.
- Người dân chỉ xem lịch để biết ngày, giờ và địa điểm tiếp dân.
- Tại iPad, cán bộ nhập thủ công thông tin phiên tiếp dân.
- Không đăng nhập.
- Không đối chiếu mã, người dân, cán bộ, quầy hoặc lịch với DB.
- Người dân đánh giá ngay sau khi cán bộ nhập thông tin.
- Mã tiếp dân không được trùng.
- API đăng ký tiếp dân cũ dừng sử dụng nhưng không xóa, không đổi contract.

## 2. Chỉnh bảng `danh_gia_tiep_dan`

Bổ sung các trường snapshot:

```prisma
ma_tiep_dan       String   @unique @db.VarChar(50)
ten_nguoi_dan     String   @db.VarChar(150)
ten_can_bo        String   @db.VarChar(150)
ma_quay           String   @db.VarChar(20)
ngay_tiep_dan     DateTime @db.Date
khung_gio         String   @db.VarChar(50)
noi_dung_lam_viec String
```

Giữ các trường đánh giá:

```prisma
diem_tong Int
ly_do     Json
nhan_xet  String
```

Chỉnh quan hệ cũ thành không bắt buộc:

```prisma
id_dang_ky_tiep_dan String?            @unique @db.Uuid
dang_ky_tiep_dan    dang_ky_tiep_dan?
```

Các trường audit hiện tại vẫn giữ:

- `thoi_gian_tao`
- `thoi_gian_cap_nhat`
- `nguoi_tao`
- `nguoi_cap_nhat`
- `is_active`
- `is_delete`

Do iPad không đăng nhập:

- `nguoi_tao = null`.
- Audit ghi nhận IP, thiết bị và thời gian gửi.

## 3. Migration và dữ liệu cũ

Migration sẽ:

1. Thêm các cột snapshot.
2. Chuyển `id_dang_ky_tiep_dan` thành nullable.
3. Backfill đánh giá cũ từ `dang_ky_tiep_dan`:

| Trường mới | Nguồn cũ |
|---|---|
| `ma_tiep_dan` | `dang_ky_tiep_dan.ma_tiep_dan` |
| `ten_nguoi_dan` | `dang_ky_tiep_dan.ho_ten` |
| `ma_quay` | Cấu hình quầy hoặc `bo_phan` cũ |
| `ngay_tiep_dan` | `dang_ky_tiep_dan.ngay` |
| `khung_gio` | `dang_ky_tiep_dan.slot` |
| `noi_dung_lam_viec` | `ly_do` hoặc `chu_de` |
| `ten_can_bo` | Người duyệt hoặc tên cán bộ cũ |

4. Thêm unique constraint cho `ma_tiep_dan`.
5. Dữ liệu mới chỉ đọc trực tiếp từ `danh_gia_tiep_dan`.
6. Giữ quan hệ cũ để truy vết dữ liệu lịch sử.

Nếu bản ghi cũ không xác định được cán bộ, tạm backfill:

```text
Chưa cập nhật
```

## 4. API gửi đánh giá từ iPad

Giữ endpoint:

```http
POST /api/reception-ratings
```

API công khai, không yêu cầu access token và không có permission `RRT_CREATE`.

### 4.1. Request mới

```json
{
  "receptionCode": "TD-20260822-001",
  "citizenName": "Nguyễn Văn An",
  "officerName": "Trần Thị Bình",
  "counterCode": "QUAY_2",
  "receptionDate": "2026-08-22",
  "timeSlot": "08:30 - 09:30",
  "workingContent": "Hướng dẫn thủ tục hành chính",
  "score": 5,
  "comment": "Cán bộ hướng dẫn rõ ràng và dễ hiểu."
}
```

### 4.2. Tất cả trường đều bắt buộc

- `receptionCode`
- `citizenName`
- `officerName`
- `counterCode`
- `receptionDate`
- `timeSlot`
- `workingContent`
- `score`
- `comment`

### 4.3. Validate đề xuất

| Trường | Validate |
|---|---|
| `receptionCode` | 4–50 ký tự, chữ/số/dấu gạch, tự viết hoa |
| `citizenName` | 2–150 ký tự |
| `officerName` | 2–150 ký tự |
| `counterCode` | `QUAY_1` đến `QUAY_8` |
| `receptionDate` | Ngày hợp lệ, `YYYY-MM-DD` |
| `timeSlot` | `HH:mm - HH:mm`, giờ bắt đầu nhỏ hơn giờ kết thúc |
| `workingContent` | Bắt buộc, không chỉ chứa khoảng trắng |
| `score` | Số nguyên từ 1–5 |
| `comment` | Bắt buộc, tối đa 2.000 ký tự |

### 4.4. Điều kiện bị loại bỏ

Không còn kiểm tra:

- Mã có trong `dang_ky_tiep_dan` hay không.
- Trạng thái `COMPLETED`.
- Đơn đã phân quầy hay chưa.
- Cán bộ có được phân công quầy hay không.
- Lịch hoặc ca tiếp dân có tồn tại hay không.

### 4.5. Chống trùng

- Kiểm tra `ma_tiep_dan` trước khi tạo.
- DB có unique constraint để chống gửi đồng thời.
- Nếu mã trùng trả `409 Conflict`:

```json
{
  "success": false,
  "message": "Mã tiếp dân đã được đánh giá"
}
```

### 4.6. Response thành công

```json
{
  "success": true,
  "message": "Gửi đánh giá tiếp dân thành công",
  "data": {
    "id": "uuid",
    "receptionCode": "TD-20260822-001",
    "citizenName": "Nguyễn Văn An",
    "officerName": "Trần Thị Bình",
    "counterCode": "QUAY_2",
    "receptionDate": "2026-08-22",
    "timeSlot": "08:30 - 09:30",
    "workingContent": "Hướng dẫn thủ tục hành chính",
    "score": 5,
    "comment": "Cán bộ hướng dẫn rõ ràng và dễ hiểu.",
    "ratedAt": "2026-08-22T09:30:00+07:00"
  }
}
```

## 5. API cấu hình iPad

Giữ nguyên:

```http
GET /api/reception-ratings/configuration
```

Trả:

- Thang điểm 1–5.
- Giới hạn nhận xét 2.000 ký tự.
- Danh sách quầy `QUAY_1` đến `QUAY_8` có thể được bổ sung vào response để iPad dựng lựa chọn.

API không cần đăng nhập.

## 6. API tra cứu mã cũ

```http
GET /api/reception-registrations/rating-lookup/:receptionCode
```

- Không xóa.
- Không đổi code cũ.
- iPad mới ngừng gọi.
- Swagger đánh dấu `deprecated: true`.
- Mô tả rõ đây là API luồng cũ.

## 7. API danh sách dành cho lãnh đạo

```http
GET /api/reception-ratings
```

Permission:

```text
RRT_GET_ALL
```

### 7.1. Bộ lọc

- `page`
- `size`
- `search`: tìm mã, tên người dân, tên cán bộ, nội dung nhận xét.
- `score`
- `department`: `QUAY_1` đến `QUAY_8`.
- `fromDate`
- `toDate`

### 7.2. Response mỗi bản ghi

```json
{
  "id": "uuid",
  "receptionCode": "TD-20260822-001",
  "citizenName": "Nguyễn Văn An",
  "applicantName": "Nguyễn Văn An",
  "officerName": "Trần Thị Bình",
  "counterCode": "QUAY_2",
  "department": "QUAY_2",
  "receptionDate": "2026-08-22",
  "timeSlot": "08:30 - 09:30",
  "workingContent": "Hướng dẫn thủ tục hành chính",
  "score": 5,
  "comment": "Cán bộ hướng dẫn rõ ràng.",
  "ratedAt": "2026-08-22T09:30:00+07:00"
}
```

Giữ `applicantName` và `department` để không phá FE cũ; bổ sung `citizenName` và `counterCode` theo contract mới.

## 8. API chi tiết dành cho lãnh đạo

```http
GET /api/reception-ratings/:id
```

Permission:

```text
RRT_GET_DETAIL
```

Response trả đầy đủ:

- Mã tiếp dân.
- Tên người dân.
- Tên cán bộ.
- Quầy.
- Ngày tiếp dân.
- Khung giờ.
- Nội dung làm việc.
- Điểm.
- Nhận xét.
- Thời gian đánh giá.
- ID đăng ký cũ nếu đây là dữ liệu lịch sử.

Không còn bắt buộc `dang_ky_tiep_dan` phải tồn tại.

## 9. API thống kê dành cho lãnh đạo

```http
GET /api/reception-ratings/statistics
```

Permission:

```text
RRT_GET_STATS
```

Response đề xuất:

```json
{
  "totalRatings": 15,
  "averageScore": 4.6,
  "satisfactionRate": 86.67,
  "scoreDistribution": [
    { "score": 1, "count": 0 },
    { "score": 2, "count": 1 },
    { "score": 3, "count": 1 },
    { "score": 4, "count": 4 },
    { "score": 5, "count": 9 }
  ],
  "byCounter": [
    {
      "counterCode": "QUAY_2",
      "totalRatings": 5,
      "averageScore": 4.8
    }
  ],
  "byOfficer": [
    {
      "officerName": "Trần Thị Bình",
      "totalRatings": 5,
      "averageScore": 4.8
    }
  ]
}
```

Giữ thêm `byDepartment` làm alias cho `byCounter` để không phá FE cũ.

## 10. Phân quyền

API iPad không có login:

- Không có permission gửi đánh giá.
- Không thêm `RRT_CREATE`.

API lãnh đạo:

- `RRT_GET_ALL`
- `RRT_GET_DETAIL`
- `RRT_GET_STATS`

Bổ sung loại quyền vào response phân quyền:

```js
GET_STATS: "Xem thống kê"
```

Màn hình phân quyền sẽ có cột “Xem thống kê”.

## 11. API đăng ký tiếp dân cũ

Toàn bộ API `reception-registrations`:

- Giữ code.
- Giữ route.
- Giữ permission `RR_*`.
- Không xóa DB.
- Không sửa contract.
- Mobile/iPad ngừng sử dụng.

## 12. Test cần cập nhật

### 12.1. API gửi đánh giá

- Gửi hợp lệ → `200`.
- Thiếu từng trường bắt buộc → `400`.
- Sai định dạng mã → `400`.
- Sai quầy → `400`.
- Sai ngày/giờ → `400`.
- Sai số sao → `400`.
- Mã trùng → `409`.
- Gửi đồng thời cùng mã → chỉ một request thành công.
- Vượt rate limit → `429`.

### 12.2. API lãnh đạo

- Danh sách trả đủ dữ liệu thủ công.
- Chi tiết không cần quan hệ đăng ký.
- Thống kê theo quầy.
- Thống kê theo cán bộ.
- Thiếu token → `401`.
- Thiếu quyền → `403`.
- ID không hợp lệ → `400`.
- Không tồn tại → `404`.

### 12.3. Migration

- Backfill dữ liệu cũ.
- Không mất đánh giá cũ.
- Dữ liệu mới có thể lưu khi `id_dang_ky_tiep_dan = null`.
- Unique mã tiếp dân hoạt động.
