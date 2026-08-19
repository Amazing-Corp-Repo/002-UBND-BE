# Tổng hợp API và thay đổi database — Lịch, đăng ký và đánh giá tiếp dân

## 1. Phạm vi thay đổi

- Thêm mới 15 API.
- Chỉnh sửa 3 API lịch tiếp dân cũ.
- Một số API mới tiếp tục được bổ sung kiểm soát sức chứa, trạng thái và response.
- Không xóa API cũ.
- Không xóa trường database cũ.

## 2. Các API mới đã thêm

### 2.1. `GET /api/reception-schedules`

Mục đích: Mobile lấy lịch tiếp dân đang hoạt động.

Query:

- `fromDate`
- `toDate`

Response ban đầu:

- `id`
- `officerName`
- `location`
- `receptionDate`
- `timeRange`
- `availableSlots`
- `note`

Response bổ sung sau khi triển khai sức chứa:

- `openSlots`: các ca chưa đầy.
- `slots[].timeSlot`
- `slots[].totalCapacity`
- `slots[].heldCount`
- `slots[].remainingCapacity`
- `slots[].isFull`

Quy tắc:

- Mặc định trả lịch từ ngày hiện tại đến 90 ngày tiếp theo.
- Chỉ lấy lịch đang hoạt động và chưa bị xóa.
- Mọi đơn đã lưu đều được tính là giữ chỗ, gồm `PENDING`, `APPROVED`, `COMPLETED`, `REJECTED` và bản ghi xóa mềm.
- Ca đầy trả `isFull: true` và không nằm trong `openSlots`.

### 2.2. `PATCH /api/reception-schedules/{scheduleId}/slots/{slotId}/capacity`

Mục đích: cán bộ chỉnh sức chứa của một quầy trong một ca.

Request:

```json
{
  "capacity": 3
}
```

Validation:

- Phải là số nguyên.
- Tối thiểu `1`.
- Không giới hạn tối đa.

Response:

- `id`
- `scheduleId`
- `timeSlot`
- `counterCode`
- `capacity`
- `assignedCount`
- `slotHeldCount`
- `slotTotalCapacity`

Quy tắc:

- Yêu cầu permission `LTD_UPDATE`.
- Không được giảm sức chứa thấp hơn số đơn đã gán cho quầy.
- Không được làm tổng sức chứa ca thấp hơn tổng số đơn đã giữ chỗ.
- Có audit.
- Sử dụng transaction để hạn chế sai dữ liệu khi cập nhật đồng thời.

### 2.3. `POST /api/reception-registrations`

Mục đích: Mobile gửi đăng ký tiếp dân.

Request:

```json
{
  "idLichTiepDan": "uuid",
  "slot": "07:30 - 08:30",
  "chuDe": "Hướng dẫn thủ tục",
  "lyDo": "Tôi cần được hướng dẫn về thủ tục hành chính",
  "hoTen": "Nguyễn Văn An",
  "sdt": "0912345678",
  "cccd": "042204001234",
  "diaChi": "Hà Tĩnh"
}
```

Backend tự bổ sung khi lưu:

- `loai = COUNTER_RECEPTION`
- `ma_tiep_dan`: mã ngắn tự sinh.
- `ngay`: lấy từ lịch được chọn.
- `trang_thai = PENDING`.

Response:

- `id`
- `receptionCode`
- `receptionType`
- `receptionDate`
- `timeSlot`
- `topic`
- `description`
- `fullName`
- `phoneNumber` đã che bớt.
- `citizenId` đã che bớt.
- `address`
- `department`
- `status`
- `createdAt`
- `updatedAt`

Quy tắc:

- Kiểm tra `slot` thực sự thuộc lịch.
- Không cho đăng ký lịch đã qua.
- Kiểm tra tổng sức chứa của 8 quầy.
- Một số điện thoại không được đăng ký trùng cùng lịch và ca.
- Một số điện thoại tối đa 2 đơn/ngày.
- Một CCCD tối đa 2 đơn/ngày.
- Rate limit 30 request/10 phút/IP.
- Dùng transaction mức `Serializable` để hạn chế hai request cùng chiếm chỗ vượt sức chứa.
- Mọi đơn đã lưu đều không trả chỗ.

### 2.4. `POST /api/reception-registrations/lookup`

Mục đích: người dân tra cứu đăng ký trên Mobile.

Chỉ được gửi một trong hai dạng:

```json
{
  "receptionCode": "A00123"
}
```

hoặc:

```json
{
  "phoneNumber": "0912345678"
}
```

Response:

- Thông tin đơn đăng ký.
- Số điện thoại và CCCD được che bớt.
- Trạng thái hiện tại.
- Quầy tiếp nhận nếu đã được gán.
- Lý do và thời điểm từ chối nếu đơn bị từ chối.

Không có API hủy đơn Mobile.

### 2.5. `GET /api/reception-registrations`

Mục đích: cán bộ lấy danh sách đơn tiếp dân.

Permission: `RR_GET_ALL`.

Query:

- `page`
- `size`
- `search`
- `receptionDate`
- `approvalStatus`
- `ratingStatus`
- `department`

Response mỗi đơn:

- `id`
- `receptionCode`
- `applicantName`
- `phoneNumber`
- `receptionDate`
- `timeSlot`
- `topic`
- `workingContent`
- `department`
- `approvalStatus`
- `ratingStatus`
- `approverName`
- `approvedAt`
- `completedAt`
- `rejectionReason`
- `rejectedAt`

Response có phân trang.

### 2.6. `GET /api/reception-registrations/{id}`

Mục đích: cán bộ bấm vào mã tiếp dân để xem chi tiết nội dung người dân đã đăng ký.

Permission: `RR_GET_DETAIL`.

Response:

- Thông tin lịch tiếp dân.
- Ngày và ca tiếp.
- Chủ đề.
- Nội dung làm việc.
- Họ tên, số điện thoại, CCCD và địa chỉ.
- Quầy tiếp nhận.
- Trạng thái xử lý.
- Người phê duyệt.
- Thời điểm phê duyệt.
- Thời điểm hoàn thành.
- Lý do từ chối.
- Thời điểm từ chối.
- Trạng thái đánh giá.
- Nội dung đánh giá nếu đã đánh giá.

### 2.7. `PATCH /api/reception-registrations/{id}/approve`

Mục đích: cán bộ phê duyệt gặp và phân quầy.

Request:

```json
{
  "department": "QUAY_1"
}
```

Permission: `RR_APPROVE`.

Khi duyệt, backend cập nhật:

- `bo_phan = QUAY_1` đến `QUAY_8`.
- `trang_thai = APPROVED`.
- `ten_lanh_dao`: lấy từ tài khoản đang đăng nhập.
- `chuc_vu_lanh_dao`: lấy từ role của người duyệt.
- `thoi_gian_phe_duyet`.
- `nguoi_cap_nhat`.
- `thoi_gian_cap_nhat`.

Quy tắc:

- Chỉ đơn `PENDING` được duyệt.
- Quầy phải từ `QUAY_1` đến `QUAY_8`.
- Kiểm tra sức chứa riêng của quầy trong đúng ca.
- Nếu quầy đầy trả `409`.
- Chống hai cán bộ cùng duyệt một đơn.
- Có audit.

### 2.8. `PATCH /api/reception-registrations/{id}/complete`

Mục đích: xác nhận buổi tiếp dân đã thực sự hoàn thành.

API không có request body.

Permission: `RR_COMPLETE`.

Khi thành công, backend cập nhật:

- `trang_thai = COMPLETED`.
- `thoi_gian_hoan_thanh`.
- `nguoi_hoan_thanh`.
- `nguoi_cap_nhat`.
- `thoi_gian_cap_nhat`.

Quy tắc:

- Chỉ đơn `APPROVED` được hoàn thành.
- Đơn phải được gán `QUAY_1` đến `QUAY_8`.
- Chống hoàn thành hai lần.
- Sau khi `COMPLETED`, người dân mới được đánh giá.
- Có audit.

### 2.9. `PATCH /api/reception-registrations/{id}/reject`

Mục đích: cán bộ từ chối đơn đang chờ.

Request:

```json
{
  "reason": "Nội dung đăng ký không thuộc phạm vi tiếp nhận"
}
```

Permission: `RR_REJECT`.

Validation:

- `reason` bắt buộc.
- Tối thiểu 5 ký tự.
- Tối đa 500 ký tự.

Khi thành công, backend cập nhật:

- `trang_thai = REJECTED`.
- `ly_do_tu_choi`.
- `thoi_gian_tu_choi`.
- `nguoi_tu_choi`.
- `nguoi_cap_nhat`.
- `thoi_gian_cap_nhat`.

Quy tắc:

- Chỉ đơn `PENDING` được từ chối.
- Đơn bị từ chối vẫn giữ chỗ.
- Chống hai cán bộ cùng xử lý.
- Có audit.

### 2.10. `GET /api/reception-registrations/rating-lookup/{receptionCode}`

Mục đích: iPad tra cứu mã trước khi người dân đánh giá.

Response:

- `registrationId`
- `receptionCode`
- `receptionDate`
- `timeSlot`
- `topic`
- `workingContent`
- Thông tin người dân đã che số điện thoại và CCCD.
- `department`
- `approvalStatus`
- `ratingStatus`

Quy tắc:

- Ban đầu cho phép đơn `APPROVED`; hiện tại bắt buộc đơn phải là `COMPLETED`.
- Phải được phân `QUAY_1` đến `QUAY_8`.
- Phải chưa được đánh giá.
- Đã đánh giá hoặc chưa hoàn thành trả `409`.

### 2.11. `GET /api/reception-ratings/configuration`

Mục đích: trả cấu hình đánh giá cho iPad.

Response:

- Thang điểm `1–5`.
- `comment.maxLength = 2000`.
- Danh sách gợi ý theo từng số sao.

Không lưu thêm bảng cấu hình trong database; cấu hình hiện nằm trong constant của backend.

### 2.12. `POST /api/reception-ratings`

Mục đích: iPad gửi đánh giá.

Request:

```json
{
  "receptionCode": "A00123",
  "score": 5,
  "selectedSuggestions": [
    "Cán bộ hướng dẫn tận tình",
    "Thời gian xử lý nhanh"
  ],
  "comment": "Tôi rất hài lòng với buổi tiếp dân."
}
```

Validation:

- `receptionCode` bắt buộc.
- `score` từ 1 đến 5.
- Tối đa 5 gợi ý.
- Gợi ý không được trùng.
- Gợi ý phải thuộc đúng số sao.
- `comment` tối đa 2.000 ký tự.

Cách lưu database:

- `id_dang_ky_tiep_dan`: lấy theo mã tiếp dân.
- `diem_tong = score`.
- `ly_do = selectedSuggestions`.
- `nhan_xet = comment`.
- `tieu_chi = null`.

Quy tắc:

- Chỉ đơn `COMPLETED` mới được đánh giá.
- Đơn phải được phân quầy.
- Một mã tiếp dân chỉ được đánh giá một lần.
- Có unique constraint database để chống gửi trùng đồng thời.
- Có audit.

### 2.13. `GET /api/reception-ratings`

Mục đích: lãnh đạo xem danh sách đánh giá.

Permission: `RRT_GET_ALL`.

Query:

- `page`
- `size`
- `search`
- `score`
- `department`
- `fromDate`
- `toDate`

Response:

- `id`
- `receptionCode`
- `applicantName`
- `department`
- `receptionDate`
- `timeSlot`
- `topic`
- `score`
- `selectedSuggestions`
- `comment`
- `ratedAt`
- Thông tin phân trang.

### 2.14. `GET /api/reception-ratings/{id}`

Mục đích: lãnh đạo xem chi tiết đánh giá.

Permission: `RRT_GET_DETAIL`.

Response:

- Điểm.
- Gợi ý đã chọn.
- Nhận xét.
- Thời điểm đánh giá.
- Đơn đăng ký gốc.
- Thông tin người dân.
- Nội dung yêu cầu.
- Quầy tiếp nhận.
- Người và thời điểm phê duyệt.
- Lịch tiếp dân liên quan.

Response hiện ưu tiên trường `thoi_gian_phe_duyet` thay vì suy luận hoàn toàn từ `thoi_gian_cap_nhat`.

### 2.15. `GET /api/reception-ratings/statistics`

Mục đích: lãnh đạo xem thống kê cơ bản.

Permission: `RRT_GET_STATS`.

Query:

- `department`
- `fromDate`
- `toDate`

Response:

- `totalRatings`
- `averageScore`
- `satisfactionRate`
- `scoreDistribution`: số lượng theo 1–5 sao.
- `byDepartment`: tổng lượt và điểm trung bình theo quầy.

Tỷ lệ hài lòng được tính từ đánh giá 4 và 5 sao.

## 3. Các API cũ đã chỉnh sửa

### 3.1. `POST /api/lich-tiep-dan`

Đây là API cũ và được mở rộng, không tạo API trùng.

Request cũ vẫn giữ:

- `diaDiem`
- `tenCanBo`
- `ngayTiepDan`
- `batDau`
- `ketThuc`
- `ghiChu`

Bổ sung request mới:

```json
{
  "workingPeriods": [
    {
      "startTime": "07:30",
      "endTime": "11:30"
    },
    {
      "startTime": "13:30",
      "endTime": "16:30"
    }
  ]
}
```

Nếu không truyền giờ, backend sử dụng mặc định:

- `07:30–11:30`.
- `13:30–16:30`.

Backend tự sinh:

- 7 ca một tiếng.
- Mỗi ca có 8 quầy.
- Mỗi quầy có sức chứa mặc định 2.
- Tổng mặc định 16 người/ca.

Response bổ sung `slots[]` và chi tiết `counters[]`.

### 3.2. `PUT /api/lich-tiep-dan/{id}`

Bổ sung khả năng cập nhật `workingPeriods`.

Quy tắc:

- Giờ bắt đầu phải nhỏ hơn giờ kết thúc.
- Mỗi khoảng làm việc phải chia hết thành các ca một tiếng.
- Các khoảng làm việc không được chồng nhau.
- Nếu lịch đã có bất kỳ đăng ký nào thì không được đổi ngày hoặc giờ.
- Nếu chưa có đăng ký và thay đổi giờ, backend tạo lại các slot của 8 quầy.
- Nếu chỉ đổi tên cán bộ, địa điểm hoặc ghi chú thì không xóa hay tạo lại cấu hình sức chứa hiện có.

### 3.3. `GET /api/lich-tiep-dan/{id}`

Response cũ được bổ sung:

```json
{
  "slots": [
    {
      "timeSlot": "07:30 - 08:30",
      "totalCapacity": 16,
      "heldCount": 3,
      "unassignedHeldCount": 1,
      "remainingCapacity": 13,
      "isFull": false,
      "counters": [
        {
          "id": "uuid-slot",
          "counterCode": "QUAY_1",
          "capacity": 2,
          "heldCount": 1,
          "remainingCapacity": 1,
          "isFull": false,
          "isActive": true
        }
      ]
    }
  ]
}
```

API quản lý trả chi tiết từng quầy; API Mobile chỉ cần trả tổng sức chứa của ca.

## 4. Thay đổi database

### 4.1. Tạo bảng mới `khung_gio_tiep_dan`

| Trường | Kiểu | Ý nghĩa |
| --- | --- | --- |
| `id` | UUID | Khóa chính |
| `id_lich_tiep_dan` | UUID | Liên kết lịch |
| `khung_gio` | VARCHAR(50) | Ví dụ `07:30 - 08:30` |
| `ma_quay` | VARCHAR(20) | `QUAY_1` đến `QUAY_8` |
| `suc_chua` | INTEGER | Mặc định 2, tối thiểu 1 |
| `is_active` | BOOLEAN | Trạng thái hoạt động |
| `is_delete` | BOOLEAN | Xóa mềm |
| `nguoi_tao` | UUID | Người tạo |
| `nguoi_cap_nhat` | UUID | Người cập nhật |
| `thoi_gian_tao` | TIMESTAMP | Thời điểm tạo |
| `thoi_gian_cap_nhat` | TIMESTAMP | Thời điểm cập nhật |

Ràng buộc:

- Unique theo `id_lich_tiep_dan + khung_gio + ma_quay`.
- `suc_chua >= 1`.
- `ma_quay` chỉ từ `QUAY_1` đến `QUAY_8`.
- Không được xóa lịch nếu cấu hình slot vẫn còn liên kết.

### 4.2. Chỉnh trường `ma_tiep_dan`

Bảng: `dang_ky_tiep_dan`.

Thay đổi:

- Trước đây có thể `NULL`.
- Hiện tại bắt buộc `NOT NULL`.
- Thêm unique index.
- Dữ liệu cũ chưa có mã được backfill dạng `LEG-xxxxxxxx`.

Mục đích:

- Mỗi đơn có đúng một mã.
- Không trùng mã.
- Tra cứu và đánh giá an toàn.

### 4.3. Thêm trường hoàn thành và phê duyệt

Bảng: `dang_ky_tiep_dan`.

| Trường mới | Ý nghĩa |
| --- | --- |
| `thoi_gian_phe_duyet` | Thời điểm đơn chuyển sang `APPROVED` |
| `thoi_gian_hoan_thanh` | Thời điểm đơn chuyển sang `COMPLETED` |
| `nguoi_hoan_thanh` | UUID người xác nhận hoàn thành |

Dữ liệu cũ ở trạng thái `APPROVED` hoặc `COMPLETED` được backfill `thoi_gian_phe_duyet` từ `thoi_gian_cap_nhat`.

### 4.4. Thêm trường từ chối

Bảng: `dang_ky_tiep_dan`.

| Trường mới | Ý nghĩa |
| --- | --- |
| `ly_do_tu_choi` | Nội dung lý do từ chối |
| `thoi_gian_tu_choi` | Thời điểm từ chối |
| `nguoi_tu_choi` | UUID người từ chối |

Có thêm index theo `thoi_gian_tu_choi`.

### 4.5. Chỉnh ràng buộc bảng `danh_gia_tiep_dan`

Không thêm cột mới nhưng bổ sung các ràng buộc:

- `diem_tong` chuyển thành bắt buộc `NOT NULL`.
- `diem_tong` chỉ được từ 1 đến 5.
- `nhan_xet` tối đa 2.000 ký tự ở cả API và database.
- Thêm index theo `diem_tong`.
- `id_dang_ky_tiep_dan` giữ unique: một đơn chỉ có một đánh giá.

Các trường được tái sử dụng:

- `diem_tong`: số sao.
- `ly_do`: danh sách gợi ý đã chọn dạng JSON.
- `nhan_xet`: nội dung nhập tự do.
- `tieu_chi`: hiện chưa sử dụng, lưu `null`.

### 4.6. Các trường cũ được tái sử dụng

Trong bảng `dang_ky_tiep_dan`:

- `bo_phan`: lưu `QUAY_1` đến `QUAY_8`.
- `trang_thai`: sử dụng thêm các giá trị `COMPLETED` và `REJECTED`.
- `ten_lanh_dao`: lưu tên người phê duyệt.
- `chuc_vu_lanh_dao`: lưu role/chức vụ người phê duyệt.
- `ngay`: lấy tự động từ lịch khi đăng ký.
- `slot`: lưu ca người dân chọn.

Lưu ý: `trang_thai` vẫn là chuỗi `VARCHAR`, chưa tạo PostgreSQL enum hoặc CHECK constraint cho bốn trạng thái.

## 5. Permission đã thêm

- `RR_GET_ALL`: xem danh sách đăng ký tiếp dân.
- `RR_GET_DETAIL`: xem chi tiết đăng ký tiếp dân.
- `RR_APPROVE`: phê duyệt và phân quầy.
- `RR_COMPLETE`: xác nhận hoàn thành buổi tiếp dân.
- `RR_REJECT`: từ chối đăng ký tiếp dân.
- `RRT_GET_ALL`: xem danh sách đánh giá.
- `RRT_GET_DETAIL`: xem chi tiết đánh giá.
- `RRT_GET_STATS`: xem thống kê đánh giá.

Các permission đã được khai báo trong code nhưng vẫn cần gán cho role cán bộ hoặc lãnh đạo tương ứng trên môi trường chạy thật.

## 6. Migration liên quan

- `prisma/migrations/20260817090000_unique_ma_tiep_dan/migration.sql`
- `prisma/migrations/20260817091000_reception_rating_constraints/migration.sql`
- `prisma/migrations/20260818193000_reception_schedule_slots/migration.sql`
- `prisma/migrations/20260818213000_reception_completion_fields/migration.sql`
- `prisma/migrations/20260818220000_reception_rejection_fields/migration.sql`

Các migration đã nằm trong source code nhưng chưa tự động chạy lên database dùng chung.

## 7. Swagger và test

- Tất cả API trên đã được đưa vào Swagger.
- Tên endpoint mới dùng tiếng Anh; mô tả Swagger dùng tiếng Việt.
- Swagger local: `http://localhost:8080/api-docs/`.
- Prisma schema đã hợp lệ.
- Toàn bộ test hiện tại đạt `84/84`.
