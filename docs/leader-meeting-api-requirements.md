# Yêu cầu BE và API đăng ký gặp lãnh đạo

## 1. Phạm vi

Tài liệu này tổng hợp module **Đăng ký gặp lãnh đạo**, thuộc chức năng **Quản lý lịch tiếp công dân** của role lãnh đạo.

Tổng cộng cần xây dựng **22 API**.

### 1.1. Ranh giới với tiếp dân tại quầy

- Lãnh đạo **không tiếp dân tại quầy**.
- Buổi gặp diễn ra tại địa điểm/phòng làm việc được cấu hình trên lịch gặp lãnh đạo, ví dụ `Phòng tiếp công dân`.
- Module này không sử dụng danh mục quầy, cấu hình quầy hoặc phân công cán bộ–quầy.
- Không thêm hoặc ghi các field `id_quay`, `id_cau_hinh_quay`, `ma_quay`, `bo_phan` vào lịch hoặc đơn gặp lãnh đạo.
- Không áp dụng quy tắc tám quầy, sức chứa mặc định hai người/quầy hoặc xác thực cán bộ trực quầy của module tiếp dân tại quầy.
- Sức chứa của `khung_gio_gap_lanh_dao` là sức chứa riêng của một khung giờ gặp lãnh đạo, mặc định `1`, không liên quan đến sức chứa quầy.
- API, permission, repository, thống kê và Swagger của gặp lãnh đạo phải tách khỏi các API `reception-counters` và `reception-counter-assignments`.

## 2. Luồng nghiệp vụ đã chốt

```text
PENDING
├── APPROVED
│   ├── IN_PROGRESS
│   │   └── COMPLETED → được đánh giá trên iPad
│   └── CANCELED
└── REJECTED
```

Quy tắc:

- Lãnh đạo tự tạo lịch cho chính mình.
- Lịch gặp chỉ gắn với lãnh đạo, ngày, khung giờ và địa điểm; không gắn với quầy.
- Lãnh đạo chỉ xem đơn đăng ký gặp mình.
- `ADMIN/APPROVER` được xem toàn bộ.
- Chỉ đúng lãnh đạo của lịch hẹn được hủy đơn.
- `PENDING`, `APPROVED`, `IN_PROGRESS`, `COMPLETED` chặn đăng ký trùng.
- `REJECTED`, `CANCELED` cho phép đăng ký lại.
- Giới hạn một đơn trên một ngày hẹn theo từng SĐT hoặc CCCD.
- Đơn bị từ chối/hủy không hoàn lại chỗ cũ.
- Mỗi khung giờ có sức chứa mặc định `1`.
- `ngay_lam_don` do BE tự ghi theo ngày gửi đơn.
- CCCD bắt buộc đúng 12 số; ảnh CCCD không bắt buộc.
- Tối đa 3 tài liệu hỗ trợ.
- Chỉ đánh giá khi đơn ở trạng thái `COMPLETED`.
- Đánh giá được thực hiện trên iPad, không thực hiện trên Mobile người dân.

## 3. Danh sách 22 API

### 3.1. API công khai cho Mobile — 3 API

| STT | API | Chức năng |
|---:|---|---|
| 1 | `GET /api/leader-meeting-schedules` | Lấy ngày, lãnh đạo, khung giờ, sức chứa và trạng thái còn chỗ |
| 2 | `POST /api/leader-meeting-registrations` | Người dân gửi đơn và file đính kèm |
| 3 | `POST /api/leader-meeting-registrations/lookup` | Tra cứu đơn bằng mã đăng ký hoặc số điện thoại |

#### Gửi đơn đăng ký

`POST /api/leader-meeting-registrations` sử dụng `multipart/form-data`:

```text
slotId
fullName
phoneNumber
citizenId
citizenIdIssuedDate
citizenIdIssuedPlace
address
topic
reason
citizenIdFront
citizenIdBack
supportingDocuments[]
```

Client không được truyền:

```text
leaderId
applicationDate
status
registrationCode
```

Các giá trị này do BE xác định.

Response chính:

```json
{
  "id": "registration-uuid",
  "registrationCode": "LD000123",
  "status": "PENDING",
  "receptionDate": "2026-08-25",
  "timeSlot": "09:00 - 10:30",
  "leaderName": "Nguyễn Văn An"
}
```

#### Tra cứu đơn

Tra cứu theo mã:

```json
{
  "registrationCode": "LD000123"
}
```

Hoặc theo số điện thoại:

```json
{
  "phoneNumber": "0901234567"
}
```

API phải áp dụng rate limit, che dữ liệu nhạy cảm và không trả đường dẫn file lưu trữ thật.

### 3.2. API quản lý lịch của lãnh đạo — 6 API

| STT | API | Chức năng |
|---:|---|---|
| 4 | `GET /api/leader-meeting-schedules/management` | Lãnh đạo xem lịch của mình; admin/approver xem tất cả |
| 5 | `GET /api/leader-meeting-schedules/management/{id}` | Xem chi tiết lịch và các khung giờ |
| 6 | `POST /api/leader-meeting-schedules/management` | Lãnh đạo tạo lịch cho chính mình |
| 7 | `PUT /api/leader-meeting-schedules/management/{id}` | Sửa lịch khi chưa có đơn giữ chỗ |
| 8 | `PUT /api/leader-meeting-schedules/management/{id}/status` | Bật hoặc tắt lịch |
| 9 | `DELETE /api/leader-meeting-schedules/management/{id}` | Soft delete lịch chưa có đăng ký |

Request tạo lịch:

```json
{
  "receptionDate": "2026-08-25",
  "location": "Phòng tiếp công dân",
  "note": "Tiếp công dân định kỳ",
  "slots": [
    {
      "startTime": "09:00",
      "endTime": "10:30"
    }
  ]
}
```

Quy tắc:

- BE lấy `leaderId` từ access token, không tin `leaderId` từ request.
- Khung giờ có thể là khung 90 phút mặc định hoặc khoảng thời gian do lãnh đạo tự chọn.
- Không cho sửa, vô hiệu hóa hoặc xóa lịch nếu lịch đã có đơn giữ chỗ, trừ trường hợp nghiệp vụ được bổ sung riêng.

### 3.3. API quản lý đơn — 7 API

| STT | API | Chức năng |
|---:|---|---|
| 10 | `GET /api/leader-meeting-registrations` | Danh sách đơn theo quyền |
| 11 | `GET /api/leader-meeting-registrations/{id}` | Xem chi tiết hồ sơ, lịch và tài liệu |
| 12 | `PATCH /api/leader-meeting-registrations/{id}/approve` | Chuyển `PENDING → APPROVED` |
| 13 | `PATCH /api/leader-meeting-registrations/{id}/reject` | Chuyển `PENDING → REJECTED` |
| 14 | `PATCH /api/leader-meeting-registrations/{id}/process` | Chuyển `APPROVED → IN_PROGRESS` |
| 15 | `PATCH /api/leader-meeting-registrations/{id}/complete` | Chuyển `IN_PROGRESS → COMPLETED` |
| 16 | `PATCH /api/leader-meeting-registrations/{id}/cancel` | Chuyển `APPROVED → CANCELED` |

API danh sách hỗ trợ các bộ lọc:

```text
search
status
leaderId
fromDate
toDate
page
limit
```

Request từ chối:

```json
{
  "reason": "Nội dung không thuộc thẩm quyền giải quyết"
}
```

Request chuyển sang xử lý tiếp:

```json
{
  "note": "Buổi gặp đã diễn ra nhưng vụ việc cần tiếp tục xử lý"
}
```

Request hoàn thành:

```json
{
  "note": "Đã xử lý xong nội dung kiến nghị"
}
```

Request hủy:

```json
{
  "reason": "Lãnh đạo có lịch công tác đột xuất"
}
```

Chỉ đúng lãnh đạo của lịch hẹn được gọi API hủy.

### 3.4. API xem và tải file — 1 API

| STT | API | Chức năng |
|---:|---|---|
| 17 | `GET /api/leader-meeting-registrations/{id}/attachments/{attachmentId}` | Xem ảnh CCCD hoặc xem/tải tài liệu |

Quy tắc:

- `CCCD_FRONT`, `CCCD_BACK`: chỉ trả nội dung dạng `inline`, không cung cấp chức năng tải.
- `SUPPORTING_DOCUMENT`: cho phép truyền `?download=true`.
- Kiểm tra quyền trước khi trả file.
- Ghi audit khi xem hoặc tải.
- Không trả đường dẫn lưu trữ vật lý hoặc URL nội bộ ra client.
- Backend không thể ngăn tuyệt đối người đã xem ảnh tự lưu bằng công cụ trình duyệt; phạm vi kiểm soát là không cung cấp API/nút tải và luôn ghi audit.

### 3.5. API đánh giá trên iPad — 5 API

| STT | API | Chức năng |
|---:|---|---|
| 18 | `GET /api/leader-meeting-ratings/configuration` | Trả thang điểm và gợi ý đánh giá |
| 19 | `POST /api/leader-meeting-ratings` | Gửi đánh giá sau khi đơn hoàn thành |
| 20 | `GET /api/leader-meeting-ratings` | Danh sách đánh giá theo quyền |
| 21 | `GET /api/leader-meeting-ratings/statistics` | Thống kê theo lãnh đạo và thời gian |
| 22 | `GET /api/leader-meeting-ratings/{id}` | Xem chi tiết đánh giá |

Điều kiện gửi đánh giá:

- Đơn phải ở trạng thái `COMPLETED`.
- Mỗi đơn chỉ được đánh giá một lần.
- Điểm từ 1 đến 5.
- Nhận xét tối đa 2.000 ký tự.
- Chống gửi trùng bằng unique DB và transaction.
- API `configuration` và `statistics` phải được khai báo trước route `/{id}` để tránh xung đột route động.

## 4. Thay đổi DB cần thực hiện

### 4.1. Bảng `dang_ky_gap_lanh_dao`

Bổ sung các field phục vụ xử lý tiếp, hoàn thành và hủy:

```prisma
thoi_gian_bat_dau_xu_ly DateTime? @db.Timestamp(6)
nguoi_bat_dau_xu_ly     String?   @db.Uuid
ghi_chu_xu_ly           String?

thoi_gian_huy           DateTime? @db.Timestamp(6)
nguoi_huy               String?   @db.Uuid
ly_do_huy               String?

ghi_chu_hoan_thanh      String?
```

Cập nhật tập trạng thái hợp lệ:

```text
PENDING
APPROVED
IN_PROGRESS
COMPLETED
REJECTED
CANCELED
```

Bổ sung relation tới người bắt đầu xử lý và người hủy nếu cần hiển thị thông tin người thao tác.

### 4.2. Bảng `khung_gio_gap_lanh_dao`

- `suc_chua` phải là field bắt buộc, mặc định `1`.
- `suc_chua` là số người lãnh đạo có thể gặp trong khung giờ, không phải sức chứa của quầy.
- `gio_bat_dau`, `gio_ket_thuc` phải validate đúng `HH:mm`.
- Kiểm tra `gio_bat_dau < gio_ket_thuc`.
- Không cần API điều chỉnh sức chứa trong giai đoạn hiện tại vì FE không có chức năng này và nghiệp vụ đã chốt một lịch hẹn cho một người.

### 4.3. Bảng `dinh_kem_dang_ky_gap_lanh_dao`

- Một đơn tối đa một `CCCD_FRONT`.
- Một đơn tối đa một `CCCD_BACK`.
- Một đơn tối đa ba `SUPPORTING_DOCUMENT`.
- Kiểm tra MIME type, phần mở rộng và kích thước file.
- Ảnh CCCD không bắt buộc.

### 4.4. Chống trùng theo ngày hẹn

Trong transaction, BE phải:

1. Lấy ngày hẹn từ `slotId` và quan hệ lịch gặp lãnh đạo.
2. Kiểm tra đơn cùng ngày hẹn theo SĐT hoặc CCCD.
3. Chỉ các trạng thái sau chặn đăng ký:

```text
PENDING
APPROVED
IN_PROGRESS
COMPLETED
```

4. `REJECTED` và `CANCELED` không chặn đăng ký lại.
5. Trả `409 Conflict` khi đã có đơn hợp lệ trong ngày hẹn.
6. Chạy trong transaction mức cô lập phù hợp và retry serialization conflict để chống hai request đồng thời.

### 4.5. Quy tắc sức chứa

- `PENDING` giữ chỗ ngay khi tạo đơn thành công.
- Mọi đơn đã tạo, kể cả `REJECTED` hoặc `CANCELED`, vẫn được tính vào số chỗ đã sử dụng của khung giờ cũ.
- Từ chối hoặc hủy không hoàn lại chỗ.
- Người dân được đăng ký lại sau `REJECTED` hoặc `CANCELED`, nhưng phải chọn khung giờ khác còn chỗ.

### 4.6. Dữ liệu cũ

- Kiểm tra các bản ghi `LEADER_MEETING` còn nằm trong `dang_ky_tiep_dan`.
- Tạo migration/backfill sang `lich_gap_lanh_dao`, `khung_gio_gap_lanh_dao`, `dang_ky_gap_lanh_dao` và `danh_gia_gap_lanh_dao`.
- Backfill phải idempotent và có chế độ dry-run.
- Chỉ cleanup dữ liệu/cột cũ sau khi đối soát số lượng và quan hệ trả về 0 lỗi.

## 5. Permission đề xuất

```text
LMS_GET_ALL
LMS_GET_DETAIL
LMS_CREATE
LMS_UPDATE
LMS_UPDATE_STATUS
LMS_DELETE

LMR_GET_ALL
LMR_GET_DETAIL
LMR_APPROVE
LMR_REJECT
LMR_PROCESS
LMR_COMPLETE
LMR_CANCEL

LMRT_GET_ALL
LMRT_GET_DETAIL
LMRT_GET_STATS
```

Quy tắc phân quyền:

- `LEADER`: xem lịch và đơn của chính mình; tạo/sửa/xóa lịch của mình; xử lý đơn gặp mình.
- `ADMIN/APPROVER`: xem toàn bộ lịch, đơn và đánh giá.
- Chỉ đúng `LEADER` của lịch hẹn được gọi API hủy.
- Repository/service luôn xác định phạm vi dữ liệu từ access token, không tin `leaderId` do FE gửi.
- Các API công khai phải có rate limit và chống dò mã.

## 6. Cấu trúc code cần xây dựng

Theo cấu trúc dự án hiện tại:

```text
route
controller
service
repository
validator
middleware phân quyền
middleware rate limit
middleware upload
audit
Swagger
unit test
integration test
seed dữ liệu mẫu
hướng dẫn tích hợp FE/Mobile/iPad
```

Tên endpoint và field API dùng tiếng Anh. Summary và description hiển thị bên cạnh API trên Swagger viết bằng tiếng Việt.

## 7. Validate và bảo mật

- Họ tên bắt buộc và chuẩn hóa khoảng trắng.
- Số điện thoại đúng định dạng di động Việt Nam.
- CCCD bắt buộc đúng 12 chữ số.
- Lý do gặp phải có độ dài tối thiểu và tối đa hợp lý.
- Ngày làm đơn do BE tự ghi, client không được truyền.
- Khung giờ phải còn hiệu lực và chưa đầy.
- Không tin leader, trạng thái, người duyệt, người hủy hoặc thời điểm do client gửi.
- Che SĐT/CCCD trong audit và response công khai.
- Không ghi nội dung file hoặc token vào log.
- Kiểm tra signature/MIME thực tế của file, không chỉ dựa vào tên file.
- Từ chối file vượt giới hạn dung lượng hoặc số lượng.
- Ghi audit cho tạo lịch, sửa lịch, duyệt, từ chối, xử lý, hoàn thành, hủy, xem file và tải file.

## 8. Swagger

Swagger cần có:

- Mô tả tiếng Việt cho từng API.
- Security scheme và permission yêu cầu.
- Ví dụ request hợp lệ.
- Ví dụ response `200`, `201`, `400`, `401`, `403`, `404`, `409`, `429`.
- Ví dụ gửi trùng theo ngày hẹn.
- Ví dụ khung giờ đầy.
- Ví dụ sai luồng trạng thái.
- Ví dụ lãnh đạo khác cố hủy đơn.
- Ví dụ xem ảnh CCCD và tải tài liệu hỗ trợ.
- Dữ liệu DEV mẫu có ID/mã thật để có thể bấm Execute trực tiếp.

## 9. Test bắt buộc

### Lịch gặp lãnh đạo

- Tạo lịch hợp lệ.
- Sai định dạng hoặc khoảng thời gian.
- Lãnh đạo không được tạo lịch cho người khác.
- Không sửa/xóa lịch đã có đăng ký giữ chỗ.
- Không xem/sửa lịch của lãnh đạo khác.

### Đăng ký

- Gửi đơn hợp lệ.
- Thiếu trường bắt buộc.
- CCCD không đủ 12 số.
- Khung giờ không tồn tại, đã qua hoặc đã đầy.
- Trùng SĐT trong cùng ngày hẹn.
- Trùng CCCD trong cùng ngày hẹn.
- `REJECTED` được đăng ký lại.
- `CANCELED` được đăng ký lại.
- Từ chối/hủy không hoàn lại chỗ.
- Hai request đồng thời không vượt sức chứa hoặc tạo trùng.

### Trạng thái và quyền

- `PENDING → APPROVED` hợp lệ.
- `PENDING → REJECTED` hợp lệ.
- `APPROVED → IN_PROGRESS` hợp lệ.
- `IN_PROGRESS → COMPLETED` hợp lệ.
- `APPROVED → CANCELED` hợp lệ.
- Từ chối các chuyển trạng thái sai thứ tự.
- Người không đủ quyền nhận `403`.
- Lãnh đạo khác không được hủy đơn.
- `ADMIN/APPROVER` không được hủy thay lãnh đạo.

### File đính kèm

- Không có ảnh CCCD vẫn được đăng ký.
- Mỗi loại ảnh CCCD tối đa một file.
- Tối đa ba tài liệu hỗ trợ.
- Từ chối MIME, phần mở rộng hoặc kích thước không hợp lệ.
- Không cung cấp chế độ download cho ảnh CCCD.
- Cho phép tải tài liệu hỗ trợ khi đủ quyền.

### Đánh giá

- Không đánh giá trước `COMPLETED`.
- Đánh giá hợp lệ sau `COMPLETED`.
- Điểm ngoài khoảng 1–5 bị từ chối.
- Nhận xét quá 2.000 ký tự bị từ chối.
- Gửi trùng bị trả `409`.
- Người không đủ quyền không xem được danh sách/chi tiết/thống kê.

## 10. Dữ liệu mẫu

Cần seed tối thiểu:

- Ba tài khoản lãnh đạo.
- Lịch và khung giờ tương lai của từng lãnh đạo.
- Đơn ở các trạng thái `PENDING`, `APPROVED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`, `CANCELED`.
- Đơn có và không có ảnh CCCD.
- Đơn có tài liệu hỗ trợ.
- Đơn `COMPLETED` chưa đánh giá và đã đánh giá.
- Tài khoản Swagger có đủ permission để chạy demo quản lý.

## 11. Thứ tự triển khai đề xuất

1. Chỉnh Prisma schema và migration DB.
2. Viết backfill dữ liệu `LEADER_MEETING` cũ.
3. Tạo permission và seed role.
4. Làm API lấy lịch khả dụng.
5. Làm API gửi đăng ký và chống trùng/sức chứa.
6. Làm API tra cứu.
7. Làm API danh sách và chi tiết theo quyền.
8. Làm API duyệt, từ chối, chuyển xử lý, hoàn thành và hủy.
9. Làm API quản lý lịch của lãnh đạo.
10. Làm API file đính kèm.
11. Làm API đánh giá trên iPad và thống kê.
12. Bổ sung Swagger, seed demo và hướng dẫn tích hợp.
13. Chạy unit test, integration test, build, migration/backfill và smoke test DB thật.

## 12. Trạng thái tài liệu

- Nghiệp vụ đã được chốt theo trao đổi hiện tại.
- Tài liệu này chưa đồng nghĩa với việc API đã được code.
- Chưa thực hiện thay đổi DB, migration hoặc backfill cho các nội dung bổ sung trong tài liệu này.
