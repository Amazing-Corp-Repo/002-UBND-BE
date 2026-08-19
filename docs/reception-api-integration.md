# Reception APIs - FE integration guide

Tài liệu này mô tả contract đã chốt cho Mobile đăng ký lịch tiếp dân, màn hình cán bộ, iPad đánh giá và màn hình lãnh đạo. Tất cả endpoint mới dùng tên tiếng Anh, response theo wrapper chung:

```json
{
  "success": true,
  "data": {},
  "message": "...",
  "pagination": null
}
```

## API contract

| Client | Method | Endpoint | Auth / permission | Mục đích |
| --- | --- | --- | --- | --- |
| Mobile | GET | `/api/reception-schedules` | Public | Lấy lịch còn hoạt động và các khung giờ hiển thị |
| Mobile | POST | `/api/reception-registrations` | Public | Đăng ký và nhận mã ngắn do BE sinh |
| Mobile | POST | `/api/reception-registrations/lookup` | Public | Tra cứu bằng mã hoặc số điện thoại |
| Desktop cán bộ | GET | `/api/reception-registrations` | `RR_GET_ALL` | Danh sách, phân trang và lọc |
| Desktop cán bộ | GET | `/api/reception-registrations/:id` | `RR_GET_DETAIL` | Chi tiết khi bấm mã tiếp dân |
| Desktop cán bộ | PATCH | `/api/reception-registrations/:id/approve` | `RR_APPROVE` | Phê duyệt và gán `QUAY_1` đến `QUAY_8` |
| iPad | GET | `/api/reception-registrations/rating-lookup/:receptionCode` | Public | Xác nhận yêu cầu trước khi đánh giá |
| iPad | GET | `/api/reception-ratings/configuration` | Public | Thang điểm, giới hạn text và gợi ý theo sao |
| iPad | POST | `/api/reception-ratings` | Public | Gửi đánh giá, một mã chỉ gửi một lần |
| Lãnh đạo | GET | `/api/reception-ratings` | `RRT_GET_ALL` | Danh sách đánh giá |
| Lãnh đạo | GET | `/api/reception-ratings/:id` | `RRT_GET_DETAIL` | Chi tiết đánh giá và yêu cầu gốc |
| Lãnh đạo | GET | `/api/reception-ratings/statistics` | `RRT_GET_STATS` | Thống kê điểm và từng quầy |

Không có API hủy đơn Mobile, nút mời đánh giá, truyền desktop sang iPad, quản lý iPad hay lịch sử chuyển trạng thái.

## Mobile flow

### 1. Load schedules

```http
GET /api/reception-schedules?fromDate=2026-09-01&toDate=2026-09-30
```

Mỗi phần tử có `id`, `officerName`, `location`, `receptionDate`, `timeRange`, `availableSlots` và `note`. FE dùng `id` làm `idLichTiepDan` khi đăng ký.

### 2. Create registration

```json
{
  "idLichTiepDan": "00000000-0000-4000-8000-000000000301",
  "slot": "08:30 - 09:30",
  "chuDe": "Xác nhận thông tin cư trú",
  "lyDo": "Cần xác nhận thông tin cư trú để hoàn thiện hồ sơ hành chính.",
  "hoTen": "Nguyễn Văn An",
  "sdt": "0912345678",
  "cccd": "042204001234",
  "diaChi": "Phường Thành Sen, tỉnh Hà Tĩnh"
}
```

FE không tự sinh mã. Lưu `data.ma_tiep_dan` trả về từ BE để hiển thị cho người dân.

### 3. Citizen lookup

Chỉ gửi đúng một trong hai field:

```json
{ "receptionCode": "A00002" }
```

hoặc:

```json
{ "phoneNumber": "0912345678" }
```

## Desktop staff flow

Gửi JWT bằng `Authorization: Bearer <access_token>`.

Danh sách hỗ trợ `page`, `size`, `search`, `receptionDate`, `approvalStatus`, `ratingStatus` (`RATED`/`NOT_RATED`) và `department` (`QUAY_1`...`QUAY_8`). `ratingStatus` chỉ để hiển thị, được BE suy ra từ bản ghi đánh giá, không có nút thao tác đánh giá.

Khi bấm `id`/mã, gọi API chi tiết. Nút duy nhất là phê duyệt:

```json
{ "department": "QUAY_2" }
```

BE tự lấy tên/chức vụ người duyệt từ tài khoản đăng nhập và ghi thời điểm vào `thoi_gian_cap_nhat`.

## iPad rating flow

1. Cán bộ nhập tay mã trên iPad.
2. FE gọi `rating-lookup`; chỉ mã `APPROVED`, đã gán quầy và chưa đánh giá mới trả `200`.
3. FE gọi `configuration` và hiển thị gợi ý theo số sao đang chọn.
4. Khi người dân chạm gợi ý, FE tự nối nội dung vào textarea; BE không cần API cho thao tác UI này.
5. Gửi payload:

```json
{
  "receptionCode": "A00002",
  "score": 5,
  "selectedSuggestions": ["Cán bộ rất tận tình và chuyên nghiệp"],
  "comment": "Tôi rất hài lòng với buổi tiếp dân."
}
```

`score` bắt buộc từ 1 đến 5. `comment` tối đa 2000 ký tự. Gợi ý phải thuộc đúng danh sách của `score`. Khi nhận `409`, FE phải khóa gửi lại và yêu cầu nhập mã khác.

Quầy/iPad được hiểu theo `department`; không có bảng hoặc token định danh riêng cho 8 iPad.

## Leader flow

Danh sách hỗ trợ `page`, `size`, `search`, `score`, `department`, `fromDate`, `toDate`.

Thống kê trả:

- `totalRatings`
- `averageScore`
- `satisfactionRate`: tỷ lệ đánh giá 4 hoặc 5 sao
- `scoreDistribution`: đủ các mức 1 đến 5
- `byDepartment`: tổng lượt và điểm trung bình từng quầy

## Status and error handling

| HTTP | Ý nghĩa FE |
| --- | --- |
| `200` | Thành công |
| `400` | Payload, UUID, bộ lọc hoặc gợi ý không hợp lệ; đọc `errors` nếu có |
| `401` | Thiếu/hết hạn token |
| `403` | Tài khoản không có permission |
| `404` | Không tìm thấy lịch, đăng ký hoặc đánh giá |
| `409` | Đăng ký trùng, chưa đủ điều kiện, đã duyệt hoặc đã đánh giá |

## Swagger, migration and sample data

- Swagger UI: `/api-docs/` (dùng tài khoản Swagger của môi trường).
- Hai migration mới phải được review và chạy bằng `prisma migrate deploy`; không dùng `migrate dev` hoặc `migrate reset` trên staging/production.
- Permission mới phải được đồng bộ qua cơ chế permission sync hiện có trước khi gán role.
- `prisma/seed.js` có ba mã DEV: `A00001` chờ duyệt, `A00002` đã duyệt/chưa đánh giá, `A00003` đã đánh giá.
- Không chạy seed trên production.
