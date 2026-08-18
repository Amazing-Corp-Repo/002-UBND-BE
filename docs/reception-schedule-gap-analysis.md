# Đề xuất bổ sung Backend/API lịch tiếp dân

> Trạng thái: tài liệu phân tích và đề xuất, chưa triển khai code hoặc database.

## 1. Bổ sung khung giờ làm việc và sức chứa theo 8 quầy

### 1.1. Thời gian làm việc mặc định và quyền điều chỉnh

Thời gian tiếp dân mặc định của mỗi ngày gồm hai buổi:

```text
Buổi sáng: 07:30 - 11:30
Buổi chiều: 13:30 - 16:30
```

Mỗi ca kéo dài một tiếng. Một ngày có 7 ca:

```text
07:30 - 08:30
08:30 - 09:30
09:30 - 10:30
10:30 - 11:30
13:30 - 14:30
14:30 - 15:30
15:30 - 16:30
```

Khoảng nghỉ trưa `11:30 - 13:30` không được sinh thành khung giờ đăng ký.

Lãnh đạo có quyền điều chỉnh thời gian tiếp dân theo từng ngày. Backend cần hỗ trợ:

- Nếu không có cấu hình riêng, ngày tiếp dân sử dụng thời gian mặc định nêu trên.
- Lãnh đạo được thay đổi giờ bắt đầu và giờ kết thúc của buổi sáng hoặc buổi chiều.
- Sau khi thay đổi, backend tự sinh lại các ca một tiếng theo khoảng thời gian mới.
- Hai khoảng thời gian không được chồng nhau và giờ bắt đầu phải nhỏ hơn giờ kết thúc.
- Chỉ người có quyền quản lý lịch mới được điều chỉnh.
- Mọi thay đổi phải ghi audit người sửa, thời điểm sửa, giá trị cũ và giá trị mới.
- Nếu lịch đã có ít nhất một đăng ký giữ chỗ thì không được thay đổi ngày hoặc thời gian của lịch.

### 1.2. Mô hình sức chứa đề xuất

Hệ thống có 8 quầy. Mỗi quầy trong mỗi ca mặc định tiếp 2 người.

```text
Sức chứa mặc định của một quầy trong một ca: 2 người
Số quầy: 8
Sức chứa mặc định của toàn bộ một ca: 2 × 8 = 16 người
Số ca trong một ngày: 7
Sức chứa mặc định tối đa của một ngày: 16 × 7 = 112 người
```

Không nên chỉ lưu một giá trị tổng là `16`. Backend nên lưu sức chứa theo từng `ngày + khung giờ + quầy`, sau đó tính tổng sức chứa của ca bằng tổng sức chứa của 8 quầy. Cách này cho phép một quầy thay đổi sức chứa mà không ảnh hưởng cấu hình các quầy khác.

Quy tắc sức chứa cho một quầy trong một ca:

```text
Tối thiểu: 1 người
Mặc định: 2 người
Tối đa: không giới hạn theo nghiệp vụ
```

Khi một lịch được tạo, backend tự sinh các slot đăng ký cho từng quầy đang hoạt động với sức chứa mặc định 2 người/quầy/ca. Sau đó cán bộ có quyền tăng hoặc giảm sức chứa theo thực tế. Giá trị cập nhật phải là số nguyên dương; backend không áp dụng giới hạn tối đa theo nghiệp vụ.

`16 người/ca` là sức chứa mặc định của 8 quầy, không phải sức chứa tối thiểu. Nếu cả 8 quầy đều được giảm xuống 1 người thì sức chứa của toàn bộ ca là 8 người.

Một quầy tạm ngừng hoạt động nên được quản lý bằng trạng thái bật/tắt riêng, không dùng sức chứa bằng 0.

### 1.3. Quy tắc giữ chỗ đã chốt

- Ngay khi `POST /api/reception-registrations` tạo đăng ký thành công, đăng ký chiếm một chỗ trong ca.
- Đăng ký `PENDING` được tính là đã giữ chỗ.
- Đăng ký `APPROVED` được tính là đã giữ chỗ.
- Đăng ký đã tạo thành công không trả lại chỗ, kể cả sau đó bị từ chối, vô hiệu hóa hoặc xóa mềm.
- Khi tổng số đăng ký đã giữ chỗ bằng tổng sức chứa của 8 quầy trong ca, backend từ chối đăng ký mới.
- API vẫn trả khung giờ đã đầy kèm trạng thái `FULL`.

Do đăng ký `PENDING` chưa được gán quầy, backend kiểm soát giữ chỗ theo tổng sức chứa của cả 8 quầy. Khi đơn được phê duyệt và gán quầy, backend phải kiểm tra riêng sức chứa của quầy được chọn.

### 1.4. Quy tắc cập nhật sức chứa

- Cán bộ có thể cấu hình sức chứa khi tạo lịch.
- Nếu không truyền cấu hình, backend tự tạo 7 ca cho 8 quầy với sức chứa mặc định 2 người/quầy/ca.
- Có API riêng để cán bộ cập nhật sức chứa của một quầy trong một ca.
- Không được giảm tổng sức chứa của ca xuống thấp hơn tổng số đăng ký đã giữ chỗ.
- Không được giảm sức chứa của một quầy xuống thấp hơn số đăng ký `APPROVED` đã được gán vào quầy đó.
- Khi lịch đã có ít nhất một đăng ký giữ chỗ, không cho sửa ngày hoặc thời gian làm việc của lịch.
- Mọi thay đổi sức chứa phải có phân quyền, validation và audit.

API cập nhật sức chứa có thể thiết kế theo hướng:

```http
PATCH /api/reception-schedules/{scheduleId}/slots/{slotId}/counters/{counterCode}/capacity
```

Body dự kiến:

```json
{
  "capacity": 3
}
```

### 1.5. Response API lịch dự kiến

API public trả tổng sức chứa của ca, không bắt buộc phía gửi đăng ký phải chọn quầy:

```json
{
  "timeSlot": "08:30 - 09:30",
  "totalCapacity": 16,
  "registeredCount": 15,
  "remainingSlots": 1,
  "status": "AVAILABLE"
}
```

Khi ca đã đầy:

```json
{
  "timeSlot": "08:30 - 09:30",
  "totalCapacity": 16,
  "registeredCount": 16,
  "remainingSlots": 0,
  "status": "FULL"
}
```

API quản lý có thể trả thêm cấu hình chi tiết của từng quầy:

```json
{
  "timeSlot": "08:30 - 09:30",
  "totalCapacity": 16,
  "registeredCount": 15,
  "remainingSlots": 1,
  "status": "AVAILABLE",
  "counters": [
    {
      "counterCode": "QUAY_1",
      "capacity": 2,
      "approvedCount": 2,
      "remainingCapacity": 0,
      "status": "FULL"
    }
  ]
}
```

Khi đăng ký vào ca đã đầy:

```http
409 Conflict
```

```json
{
  "success": false,
  "code": "RECEPTION_SLOT_FULL",
  "message": "Khung giờ tiếp dân đã đủ số lượng đăng ký"
}
```

Khi cán bộ phê duyệt và chọn một quầy đã đầy:

```http
409 Conflict
```

```json
{
  "success": false,
  "code": "RECEPTION_COUNTER_SLOT_FULL",
  "message": "Quầy tiếp nhận đã đủ số lượng trong khung giờ này"
}
```

### 1.6. Kết quả kiểm tra API phê duyệt và từ chối hiện tại

Hiện backend chỉ có hai trạng thái đăng ký:

```text
PENDING
APPROVED
```

API hiện có:

```http
PATCH /api/reception-registrations/{id}/approve
```

API này thực hiện đồng thời các việc:

- Chỉ xử lý đăng ký đang ở trạng thái `PENDING`.
- Chuyển đăng ký sang `APPROVED`.
- Gán đăng ký vào một trong 8 quầy từ `QUAY_1` đến `QUAY_8`.
- Ghi nhận người phê duyệt.
- Ghi nhận chức vụ người phê duyệt.
- Ghi nhận thời điểm phê duyệt.

Vì vậy, phê duyệt hiện tại mang nghĩa cán bộ chấp thuận yêu cầu gặp và phân quầy tiếp nhận. Đây không phải trạng thái xác nhận đã hoàn thành buổi tiếp dân.

Sau khi buổi tiếp dân thực sự kết thúc, cần bổ sung một thao tác riêng để chuyển đơn từ `APPROVED` sang `COMPLETED`:

```http
PATCH /api/reception-registrations/{id}/complete
```

Quy tắc đề xuất:

- Chỉ đơn `APPROVED` mới được chuyển sang `COMPLETED`.
- Đơn phải được gán một quầy từ `QUAY_1` đến `QUAY_8`.
- Chỉ cán bộ có quyền hoàn thành buổi tiếp dân được gọi API.
- Backend ghi người xác nhận hoàn thành và thời điểm hoàn thành.
- Thao tác phải có audit.
- Đơn `COMPLETED` không được phê duyệt hoặc hoàn thành lại.
- Đơn `COMPLETED` vẫn chiếm chỗ theo quy tắc không trả chỗ đã chốt.
- API tra cứu để đánh giá chỉ cho phép đơn `COMPLETED`, thay vì cho phép ngay từ trạng thái `APPROVED` như hiện tại.

Luồng trạng thái đề xuất:

```text
PENDING
   ↓ phê duyệt và gán quầy
APPROVED
   ↓ xác nhận đã tiếp dân xong
COMPLETED
   ↓
Đủ điều kiện đánh giá
```

Nếu bổ sung từ chối:

```text
PENDING → REJECTED
```

Hiện chưa có:

- Trạng thái `REJECTED`.
- API từ chối đăng ký.
- Lý do từ chối.
- Quyền riêng cho thao tác từ chối.
- Trạng thái `COMPLETED` và API xác nhận đã tiếp dân xong.

Đã chốt cán bộ được phép từ chối đơn `PENDING`. Backend cần bổ sung API:

```http
PATCH /api/reception-registrations/{id}/reject
```

Body dự kiến:

```json
{
  "reason": "Nội dung không thuộc thẩm quyền tiếp nhận"
}
```

Quy tắc dự kiến:

- Chỉ đơn `PENDING` được từ chối.
- Lý do từ chối là bắt buộc.
- Ghi người từ chối và thời điểm từ chối.
- Có permission riêng, ví dụ `RR_REJECT`.
- Có audit.
- Đơn chuyển sang `REJECTED` nhưng theo quy tắc đã chốt vẫn không trả lại chỗ.

### 1.7. Backend cần bổ sung

- Cấu trúc lưu 7 ca làm việc theo ngày.
- Cấu hình sức chứa theo từng ca và từng quầy.
- Giá trị mặc định 2 người/quầy/ca.
- Trạng thái hoạt động riêng của từng quầy.
- API cập nhật sức chứa.
- Phân quyền và audit cập nhật sức chứa.
- API lấy lịch trả tổng sức chứa, số đã giữ chỗ, số còn lại và trạng thái ca.
- API quản lý trả chi tiết sức chứa của từng quầy.
- API đăng ký kiểm tra tổng sức chứa của ca.
- API phê duyệt kiểm tra sức chứa của quầy được chọn.
- API hoàn thành chuyển đơn từ `APPROVED` sang `COMPLETED`.
- Permission, audit và test cho thao tác hoàn thành.
- API tra cứu đánh giá chỉ chấp nhận đơn `COMPLETED`.
- Transaction hoặc cơ chế khóa để nhiều request đồng thời không làm vượt sức chứa.
- API từ chối đơn `PENDING`, permission, validation, audit và test tương ứng.

### 1.8. Các nội dung đã chốt thêm và điểm còn cần xác nhận

Đã chốt:

- Khi tạo lịch, mỗi quầy đang hoạt động tự có các slot đăng ký với sức chứa mặc định 2 người/quầy/ca.
- Cán bộ được tăng hoặc giảm sức chứa; giá trị phải là số nguyên dương.
- Không giới hạn sức chứa tối đa theo nghiệp vụ.
- Đơn chỉ được đánh giá sau khi đã chuyển sang `COMPLETED`.
- Cán bộ được phép từ chối đơn `PENDING`; đơn chuyển sang `REJECTED` và bắt buộc có lý do từ chối.
- Do chỗ không được trả lại, backend bắt buộc phải có biện pháp chống gửi đơn giả làm đầy lịch.

Các biện pháp chống lạm dụng cần thiết kế trong API gồm:

- Rate limit cho API đăng ký.
- Chống trùng theo số điện thoại và xem xét thêm CCCD.
- Giới hạn số đơn một số điện thoại hoặc CCCD được gửi trong một ngày.
- Có thể bổ sung xác minh số điện thoại nếu nghiệp vụ yêu cầu mức bảo vệ cao hơn.
- Ghi log các lần đăng ký thất bại hoặc có dấu hiệu gửi hàng loạt.

Điểm còn cần xác nhận:

- Tên permission cho thao tác hoàn thành và nhóm cán bộ nào được cấp quyền này.
- Ngưỡng rate limit và số đơn tối đa trong ngày theo số điện thoại hoặc CCCD.

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
