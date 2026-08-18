# Đề xuất bổ sung Backend/API lịch tiếp dân

> Trạng thái: tài liệu phân tích và đề xuất, chưa triển khai code hoặc database.

## 2. Xác nhận khung giờ đăng ký thuộc lịch

Backend hiện chỉ kiểm tra `slot` đúng định dạng `HH:mm - HH:mm`, nhưng chưa xác nhận khung giờ gửi lên có thuộc lịch đã chọn hay không.

Ví dụ lịch `07:30 - 11:30` có các khung giờ hợp lệ:

```text
07:30 - 08:30
08:30 - 09:30
09:30 - 10:30
10:30 - 11:30
```

Request không hợp lệ:

```json
{
  "idLichTiepDan": "uuid-cua-lich",
  "slot": "20:00 - 21:00"
}
```

Backend cần:

1. Tìm lịch bằng `idLichTiepDan`.
2. Kiểm tra lịch đang hoạt động và chưa bị xóa.
3. Sinh danh sách khung giờ hợp lệ từ lịch.
4. Kiểm tra `slot` có thuộc danh sách đó không.
5. Từ chối nếu khung giờ không hợp lệ.

Response dự kiến:

```http
400 Bad Request
```

```json
{
  "success": false,
  "code": "INVALID_RECEPTION_SLOT",
  "message": "Khung giờ đăng ký không thuộc lịch tiếp dân"
}
```

## 3. Chống đăng ký trùng và không để vượt sức chứa khi có request đồng thời

Hiện tại backend kiểm tra bản ghi tồn tại rồi mới tạo. Hai hoặc nhiều request đồng thời vẫn có thể cùng vượt qua bước kiểm tra, dẫn đến đăng ký trùng hoặc số người giữ chỗ vượt quá sức chứa.

### Ràng buộc chống trùng

Cần có ràng buộc DB cho đăng ký còn hiệu lực, tối thiểu theo:

```text
id_lich_tiep_dan + slot + sdt
```

Mục tiêu:

- Một số điện thoại không đăng ký hai lần cùng một lịch và khung giờ.
- Không phụ thuộc hoàn toàn vào bước kiểm tra trong service.
- Chuẩn hóa số điện thoại và khung giờ trước khi kiểm tra hoặc lưu.

Lỗi đăng ký trùng:

```http
409 Conflict
```

```json
{
  "success": false,
  "code": "DUPLICATE_RECEPTION_REGISTRATION",
  "message": "Số điện thoại đã đăng ký khung giờ này"
}
```

### Kiểm soát sức chứa đồng thời

Việc kiểm tra trùng, kiểm tra sức chứa và tạo đăng ký phải nằm trong cùng một transaction.

Luồng đề xuất:

```text
Bắt đầu transaction
        ↓
Khóa bản ghi khung giờ
        ↓
Kiểm tra đăng ký trùng còn hiệu lực
        ↓
Đếm PENDING + APPROVED đang giữ chỗ
        ↓
So sánh với sức chứa
        ↓
Tạo đăng ký nếu còn chỗ
        ↓
Commit transaction
```

Quy tắc:

- Backend khóa bản ghi cấu hình khung giờ hoặc sử dụng cơ chế cập nhật nguyên tử tương đương.
- Chỉ `PENDING` và `APPROVED` còn hiệu lực được tính là giữ chỗ.
- Nếu đã đủ sức chứa, backend không tạo đăng ký.
- Khi nhiều request tranh chỗ cuối cùng, chỉ request chiếm chỗ thành công trước được tạo.
- Các request còn lại nhận lỗi `RECEPTION_SLOT_FULL`.

### Các trường hợp cần test

- Cùng số điện thoại đăng ký lại cùng lịch và khung giờ.
- Cùng số điện thoại đăng ký hai khung giờ khác nhau.
- Hai số điện thoại cùng tranh chỗ cuối cùng.
- Nhiều request đồng thời khi sức chứa mặc định là 2.
- Một đơn `PENDING` và một đơn `APPROVED` phải tính đủ 2 chỗ.
- Đăng ký không còn hiệu lực có giải phóng chỗ đúng quy định hay không.
- DB xảy ra unique constraint phải được chuyển thành response `409`.

### Những điểm vẫn cần chốt

- Chống trùng chỉ theo số điện thoại hay thêm CCCD.
- Trạng thái nào ngoài `PENDING` và `APPROVED` sẽ giải phóng chỗ.
- Khi đăng ký bị vô hiệu hóa hoặc xóa mềm, người đó có được đăng ký lại cùng khung giờ không.

## 4. Kiểm soát lịch đã có người đăng ký

Cán bộ hiện có thể thay đổi ngày hoặc thời gian của lịch đã có người đăng ký. Điều này có thể làm lịch và đăng ký không thống nhất.

### Phương án 1: Không cho sửa ngày, giờ

Khi lịch đã có đăng ký giữ chỗ, không cho thay đổi ngày tiếp dân, giờ bắt đầu hoặc giờ kết thúc. Đây là phương án an toàn và đơn giản nhất.

### Phương án 2: Cho sửa và cập nhật đồng bộ

Nếu cán bộ sửa lịch, backend phải cập nhật các đăng ký liên quan, kiểm tra lại khung giờ, kiểm tra lại sức chứa và ghi audit thay đổi. Phương án này phức tạp và có nhiều rủi ro dữ liệu hơn.

### Phương án 3: Ngừng lịch cũ và tạo lịch thay thế

Lịch cũ chuyển sang không hoạt động, tạo lịch mới và các đăng ký cũ được xử lý theo quy trình riêng.

Phần này hiện chưa chốt phương án.

## 5. Bổ sung validation tạo và cập nhật lịch

Backend cần kiểm tra:

- Giờ bắt đầu phải nhỏ hơn giờ kết thúc.
- Không tạo lịch trong quá khứ.
- Ngày tiếp dân phải hợp lệ.
- Thời lượng tiếp dân phải hợp lệ.
- Không chồng giờ khi dùng chung cán bộ hoặc quầy.
- Sức chứa phải nằm trong giới hạn cho phép.
- Khi cập nhật phải kiểm tra lịch đã có đăng ký giữ chỗ hay chưa.

Request không hợp lệ:

```json
{
  "batDau": "17:00",
  "ketThuc": "08:00"
}
```

Response dự kiến:

```http
400 Bad Request
```

```json
{
  "success": false,
  "code": "INVALID_RECEPTION_TIME_RANGE",
  "message": "Giờ bắt đầu phải nhỏ hơn giờ kết thúc"
}
```

Ngoài Joi validation, các quy tắc liên quan đến DB phải được kiểm tra tại service trong transaction phù hợp.

## 6. Chuẩn hóa cán bộ, quầy và bộ phận

Các trường `ten_can_bo` và `dia_diem` đang được lưu dưới dạng chuỗi tự do, có thể tạo nhiều cách ghi cho cùng một quầy như `Quầy 1`, `quầy 1`, `QUAY_1` hoặc `Quầy số 1`.

Nếu hệ thống quản lý cố định 8 quầy, nên chuẩn hóa mã:

```text
QUAY_1
QUAY_2
QUAY_3
QUAY_4
QUAY_5
QUAY_6
QUAY_7
QUAY_8
```

API có thể trả:

```json
{
  "counterCode": "QUAY_1",
  "counterName": "Quầy 1"
}
```

Những điểm cần chốt:

- Lịch gắn với cán bộ hay quầy.
- Một quầy có được có nhiều cán bộ trong cùng thời gian không.
- Một cán bộ có được tiếp tại nhiều quầy không.
- Có liên kết cán bộ bằng `userId` hay chỉ lưu tên.
- Sức chứa thuộc từng khung giờ của lịch hay phụ thuộc thêm vào quầy.

## 7. Hỗ trợ lịch lặp định kỳ

Mỗi ngày tiếp dân hiện là một bản ghi riêng. Nếu cán bộ tiếp dân sáng thứ Hai hằng tuần thì hiện phải tạo từng lịch thủ công hoặc import Excel.

Backend chưa hỗ trợ:

- Lặp theo tuần.
- Lặp theo tháng.
- Chọn ngày kết thúc lặp.
- Loại trừ ngày nghỉ hoặc ngày lễ.
- Cập nhật một lịch hay toàn bộ chuỗi lịch.
- Ngừng một ngày cụ thể trong chuỗi lịch.

Phần này có thể thực hiện ở giai đoạn sau nếu import Excel đã đáp ứng nghiệp vụ hiện tại.

## 8. Bổ sung xác thực và phân quyền cho API quản lý lịch

Các API đọc dữ liệu quản lý hiện chưa yêu cầu đăng nhập:

```http
GET /api/lich-tiep-dan
GET /api/lich-tiep-dan/:id
GET /api/lich-tiep-dan/count
```

Nếu đây là API quản lý nội bộ thì cần xem xét bổ sung:

- Xác thực bằng Bearer Token.
- Quyền xem danh sách lịch.
- Quyền xem chi tiết lịch.
- Quyền tạo lịch.
- Quyền cập nhật lịch.
- Quyền cập nhật sức chứa.
- Quyền bật/tắt lịch.
- Quyền xóa lịch.
- Audit thao tác tạo lịch.
- Audit cập nhật lịch.
- Audit thay đổi sức chứa.
- Audit thay đổi trạng thái.

API public dùng để lấy lịch khả dụng vẫn được giữ riêng:

```http
GET /api/reception-schedules
```

API public chỉ nên trả dữ liệu cần thiết:

- ID lịch.
- Cán bộ tiếp.
- Ngày tiếp.
- Địa điểm hoặc quầy.
- Các khung giờ.
- Sức chứa.
- Số chỗ còn lại.
- Trạng thái khung giờ.
