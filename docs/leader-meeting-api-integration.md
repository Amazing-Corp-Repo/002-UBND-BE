# Hướng dẫn tích hợp API đăng ký gặp lãnh đạo

## 1. Phạm vi và nguyên tắc

- Base URL local: `http://localhost:8880/api`.
- Tên endpoint và field dùng tiếng Anh; mô tả Swagger dùng tiếng Việt.
- Module gặp lãnh đạo độc lập với quầy tiếp dân: không gửi hoặc đọc `counterId`, `counterCode`, `department` hay phân công cán bộ-quầy.
- Lãnh đạo được xác định từ access token. Client không được gửi `leaderId` trong API tạo/sửa lịch hoặc xử lý đơn.
- Response JSON chuẩn:

```json
{
  "success": true,
  "message": "Thông báo tiếng Việt",
  "data": {}
}
```

- HTTP chính: `200/201` thành công, `400` sai dữ liệu, `401` thiếu/sai token, `403` thiếu quyền, `404` không tồn tại/ngoài phạm vi, `409` xung đột nghiệp vụ, `429` vượt rate limit.

## 2. Xác thực và role

Đăng nhập:

```http
POST /api/auths/login
Content-Type: application/json
```

```json
{
  "tenDangNhap": "swagger_leader_meeting",
  "matKhau": "Swagger@Leader2026"
}
```

Lấy `data.access_token`, sau đó gửi:

```http
Authorization: Bearer <access_token>
```

Phạm vi:

- `LANH_DAO/LEADER`: quản lý lịch, đơn và đánh giá thuộc chính lãnh đạo đăng nhập.
- `ADMIN/APPROVER/PHE_DUYET`: xem toàn bộ nếu có permission tương ứng.
- Chỉ đúng lãnh đạo sở hữu lịch được duyệt, từ chối, bắt đầu xử lý, hoàn thành hoặc hủy đơn.
- Chỉ lãnh đạo được hủy; admin/approver không hủy thay.

## 3. Contract 23 API

### 3.1. Lịch gặp lãnh đạo

| API | Quyền | Đầu vào chính | Đầu ra/chức năng |
|---|---|---|---|
| `GET /leader-meeting-schedules` | Công khai | `fromDate`, `toDate`, `leaderId` | Lịch và slot còn hiệu lực, sức chứa, số chỗ đã giữ/còn lại |
| `GET /leader-meeting-schedules/management` | `LMS_GET_ALL` | Danh sách: `fromDate`, `toDate`, `isActive`, `search`, `page`, `size`; lưới ca: `date` | Không có `date`: danh sách cũ; có `date`: trả đủ 15 ca cố định của lãnh đạo đăng nhập |
| `GET /leader-meeting-schedules/management/{id}` | `LMS_GET_DETAIL` | UUID lịch | Chi tiết lãnh đạo, ngày, địa điểm, slot và tổng hợp trạng thái đơn |
| `POST /leader-meeting-schedules/management` | `LMS_CREATE` | Contract cũ `slots[]` hoặc lưới mới `openSlots[]` | Lãnh đạo tự tạo lịch của mình; slot mặc định sức chứa 1 |
| `PUT /leader-meeting-schedules/management/{id}` | `LMS_UPDATE` | Contract cũ `slots[]` hoặc lưới mới `openSlots[]` | Đồng bộ ca mở; không đóng ca đã có người giữ chỗ |
| `PUT /leader-meeting-schedules/management/{id}/status` | `LMS_UPDATE_STATUS` | `{ "isActive": false }` | Bật/tắt lịch chưa có đơn giữ chỗ |
| `PATCH /leader-meeting-schedules/management/daily-slots/status` | `LMS_UPDATE_STATUS` | `receptionDate`, `startTime`, `endTime`, `isOpen` | Bật/tắt một ca 30 phút; tự tạo hoặc khôi phục lịch khi mở ca đầu tiên |
| `DELETE /leader-meeting-schedules/management/{id}` | `LMS_DELETE` | UUID lịch | Xóa mềm lịch chưa có đơn giữ chỗ |

Body tạo/cập nhật lịch:

```json
{
  "receptionDate": "2099-08-29",
  "location": "Phòng tiếp công dân",
  "note": "Tiếp công dân định kỳ",
  "slots": [
    { "startTime": "08:00", "endTime": "09:30" },
    { "startTime": "09:30", "endTime": "11:00" }
  ]
}
```

### 3.2. Đăng ký gặp lãnh đạo

| API | Quyền | Đầu vào chính | Đầu ra/chức năng |
|---|---|---|---|
| `POST /leader-meeting-registrations` | Công khai, rate limit | `multipart/form-data` | Tạo đơn `PENDING`, giữ chỗ ngay, trả mã `LDxxxxxx` |
| `POST /leader-meeting-registrations/lookup` | Công khai, rate limit | `registrationCode` hoặc `phoneNumber` | Tra cứu đơn, che SĐT/CCCD |
| `GET /leader-meeting-registrations` | `LMR_GET_ALL` | `search`, `status`, `leaderId`, `fromDate`, `toDate`, `page`, `limit` | Danh sách đơn theo phạm vi token |
| `GET /leader-meeting-registrations/{id}` | `LMR_GET_DETAIL` | UUID đơn | Hồ sơ, lịch, workflow, metadata tài liệu và đánh giá |
| `PATCH /leader-meeting-registrations/{id}/approve` | `LMR_APPROVE` | Không có body | `PENDING → APPROVED` |
| `PATCH /leader-meeting-registrations/{id}/reject` | `LMR_REJECT` | `{ "reason": "..." }` | `PENDING → REJECTED`, không hoàn chỗ |
| `PATCH /leader-meeting-registrations/{id}/process` | `LMR_PROCESS` | `{ "note": "..." }` | `APPROVED → IN_PROGRESS` |
| `PATCH /leader-meeting-registrations/{id}/complete` | `LMR_COMPLETE` | `{ "note": "..." }` | `IN_PROGRESS → COMPLETED`, mở quyền đánh giá |
| `PATCH /leader-meeting-registrations/{id}/cancel` | `LMR_CANCEL` | `{ "reason": "..." }` | `APPROVED → CANCELED`, chỉ lãnh đạo sở hữu, không hoàn chỗ |
| `GET /leader-meeting-registrations/{id}/attachments/{attachmentId}` | `LMR_GET_DETAIL` | `download=true/false` | CCCD chỉ inline; tài liệu hỗ trợ cho xem/tải |

Body multipart tạo đăng ký:

```text
slotId                  bắt buộc, UUID
fullName                bắt buộc
phoneNumber             bắt buộc
citizenId               bắt buộc, đúng 12 số
citizenIdIssuedDate     không bắt buộc, YYYY-MM-DD
citizenIdIssuedPlace    không bắt buộc
address                 bắt buộc
topic                   không bắt buộc
reason                  bắt buộc
citizenIdFront          không bắt buộc, tối đa 1 ảnh
citizenIdBack           không bắt buộc, tối đa 1 ảnh
supportingDocuments     không bắt buộc, tối đa 3 file
```

Client không gửi `leaderId`, `applicationDate`, `status`, `registrationCode` hoặc thông tin người xử lý.

### 3.3. Đánh giá trên iPad

| API | Quyền | Đầu vào chính | Đầu ra/chức năng |
|---|---|---|---|
| `GET /leader-meeting-ratings/configuration` | Công khai | Không | Thang 1–5 và giới hạn nhận xét 2.000 ký tự |
| `POST /leader-meeting-ratings` | Công khai, rate limit | `registrationCode`, `score`, `comment` | Gửi một đánh giá cho đơn `COMPLETED`; gửi trùng trả `409` |
| `GET /leader-meeting-ratings` | `LMRT_GET_ALL` | `search`, `score`, `leaderId`, `fromDate`, `toDate`, `page`, `limit` | Danh sách đánh giá theo phạm vi token |
| `GET /leader-meeting-ratings/statistics` | `LMRT_GET_STATS` | `leaderId`, `fromDate`, `toDate` | Tổng lượt, điểm trung bình, tỷ lệ hài lòng, phân bố sao, theo lãnh đạo |
| `GET /leader-meeting-ratings/{id}` | `LMRT_GET_DETAIL` | UUID đánh giá | Chi tiết đánh giá, người dân, lịch và lãnh đạo |

Body gửi đánh giá:

```json
{
  "registrationCode": "LD000130",
  "score": 5,
  "suggestions": ["Lãnh đạo lắng nghe và giải thích rõ ràng"],
  "comment": "Tôi hài lòng với buổi làm việc."
}
```

## 4. Quy tắc nghiệp vụ cần xử lý theo HTTP

- `PENDING`, `APPROVED`, `IN_PROGRESS`, `COMPLETED` chặn cùng SĐT hoặc CCCD đăng ký lại trong cùng ngày hẹn.
- `REJECTED`, `CANCELED` cho phép đăng ký lại, nhưng chỗ cũ không được hoàn nên phải chọn slot khác còn chỗ.
- Mọi đơn từng tạo đều tính vào sức chứa slot cũ.
- Lịch có bất kỳ đơn giữ chỗ không được sửa, bật/tắt hoặc xóa.
- Chuyển trạng thái sai thứ tự trả `409`; client không tự sửa trạng thái local trước khi BE xác nhận.
- Đánh giá trước `COMPLETED` hoặc đánh giá lần hai trả `409`.

## 5. Migration, backfill và dữ liệu Swagger DEV

Kiểm tra/deploy migration:

```powershell
npx prisma migrate status
npx prisma migrate deploy
```

Dry-run backfill dữ liệu `LEADER_MEETING` cũ:

```powershell
npm run backfill:leader-meetings -- --leader-map=docs/leader-meeting-backfill-map.example.json
```

Apply chỉ sau khi dry-run có `issueCount: 0`, đồng thời xác nhận đúng target:

```powershell
npm run backfill:leader-meetings -- --apply --confirm-target=<database/schema> --leader-map=<mapping.json>
```

Seed Swagger chỉ chạy trên DB/schema có chữ `DEV`:

```powershell
npm run seed:leader-meeting-swagger-demo
```

Fixture chính:

- Tài khoản: `swagger_leader_meeting / Swagger@Leader2026`.
- Ba lãnh đạo, sáu lịch, chín slot, tám đơn độc lập theo trạng thái, một tài liệu PDF và một đánh giá.
- Seed chỉ `upsert` ID fixture; không xóa dữ liệu phát sinh ngoài fixture.
- Nếu đã thao tác mutation trên Swagger, chạy lại seed sẽ đặt lại field trạng thái của tám đơn fixture, nhưng không xóa bản ghi mới do người test tự tạo.

## 6. Kiểm tra local

```powershell
npm run build
npm test
npm start
```

Swagger: `http://localhost:8880/api-docs`.

Nếu cổng `8880` đang chạy một tiến trình cũ, phải restart BE sau khi pull code/migrate/seed; nếu không, Swagger hoặc API đang chạy sẽ chưa nhận source và Prisma client mới.
