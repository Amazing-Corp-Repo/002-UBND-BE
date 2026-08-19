# Tổng hợp trạng thái và contract API tiếp dân

> Ngày rà soát: 19/08/2026
> Phạm vi: lịch tiếp dân, đăng ký tiếp dân tại quầy và đánh giá hài lòng.
> Tài liệu được phân theo từng API. Đây là tài liệu rà soát, không thay đổi code hoặc database.

## 1. Quy ước chung

### 1.1. Trạng thái trong tài liệu

| Trạng thái | Ý nghĩa |
| --- | --- |
| **Đã hoàn thành** | Route, controller, service/repository, validate và Swagger cần thiết đã có; API mới có test tương ứng. |
| **API quản lý tiếng Anh** | Bản sao tiếng Anh dùng để nhận nghiệp vụ mới, tách khỏi endpoint `/api/lich-tiep-dan` cũ. |
| **API cũ, còn thiếu** | Endpoint đang chạy nhưng các yêu cầu bảo vệ dữ liệu, phân quyền hoặc Swagger của đề xuất mới chưa hoàn thiện. |
| **Chưa làm** | Chưa có endpoint hoặc chưa có contract được chốt để triển khai. |

### 1.2. Response wrapper chung

Response thành công:

```json
{
  "success": true,
  "data": {},
  "message": "Thông báo bằng tiếng Việt",
  "pagination": null
}
```

Response lỗi:

```json
{
  "success": false,
  "message": "Nội dung lỗi",
  "errors": null
}
```

Các mã HTTP chính:

| HTTP | Ý nghĩa |
| --- | --- |
| `200` | Xử lý thành công. |
| `400` | Request, query, UUID, thời gian hoặc dữ liệu nghiệp vụ không hợp lệ. |
| `401` | Thiếu token hoặc token không hợp lệ. |
| `403` | Tài khoản không có permission cần thiết. |
| `404` | Không tìm thấy lịch, ca, đăng ký hoặc đánh giá. |
| `409` | Xung đột nghiệp vụ: trùng đơn, hết chỗ, sai trạng thái, đã đánh giá hoặc dữ liệu đã được người khác xử lý. |
| `503` | Có quá nhiều đăng ký đồng thời và transaction không thể hoàn tất sau số lần thử lại. |

### 1.3. Role và permission

Backend **không kiểm tra cứng tên role** trong từng API. Backend kiểm tra permission chứa trong JWT. Vì vậy cột “Role áp dụng” bên dưới thể hiện nhóm người dùng nghiệp vụ dự kiến; quyền thực tế vẫn phụ thuộc vào permission được gán cho role trên từng môi trường.

Các role nghiệp vụ đang dùng gồm:

- `ADMIN`: quản trị viên; có thể được cấp toàn bộ permission.
- `CHUYEN_VIEN`: cán bộ/chuyên viên tiếp nhận và xử lý đăng ký.
- `LANH_DAO`: lãnh đạo duyệt, quản lý lịch và xem đánh giá/thống kê.
- `Public/Mobile/iPad`: không cần Bearer Token, chỉ được gọi API public.

Riêng migration hiện có đã gán `RR_COMPLETE` và `RR_REJECT` cho `CHUYEN_VIEN` và `LANH_DAO`. Các permission khác vẫn phải được kiểm tra/gán đúng trên môi trường triển khai.

## 2. Tổng quan API theo trạng thái

| Nhóm | Số lượng | Trạng thái |
| --- | ---: | --- |
| API tiếng Anh mới | 15 | Đã hoàn thành |
| API quản lý lịch tiếng Anh | 10 | Đã sao chép route; 3 API có nghiệp vụ slot mới, 7 API chờ bổ sung |
| API lịch lặp định kỳ | Chưa chốt | Chưa làm |

Tổng số API cần theo dõi trong tài liệu là **25 API tiếng Anh**: 15 API của luồng Mobile/đăng ký/đánh giá và 10 API quản lý lịch tiếng Anh.

---

## 3. API lịch khả dụng và sức chứa

### API 01 — `GET /api/reception-schedules` — Lấy lịch tiếp dân khả dụng cho Mobile

- **Trạng thái:** Đã hoàn thành.
- **Đã làm/hiện có:** Route public, validate ngày đúng `YYYY-MM-DD` và ngày có thật, kiểm tra khoảng ngày, lọc lịch/ca đã qua, tính tổng sức chứa, số chỗ giữ, số chỗ còn lại và trạng thái `AVAILABLE`/`FULL`; đã có Swagger và test.
- **Chưa làm:** Chưa có phân trang vì API hiện lấy lịch trong một khoảng ngày; chưa có bộ lọc theo cán bộ/quầy.
- **Cần bổ sung:** Không bắt buộc cho luồng Mobile đã chốt. Chỉ bổ sung phân trang hoặc bộ lọc khi số lượng lịch thực tế đủ lớn và có yêu cầu cụ thể.
- **Dùng để làm gì:** Mobile lấy lịch tiếp dân đang hoạt động và tình trạng chỗ của từng ca để người dân chọn lịch.
- **Role áp dụng:** Public/Mobile, không cần token.
- **Trường hợp áp dụng:** Khi mở màn hình đăng ký hoặc đổi khoảng ngày cần xem lịch.
- **Query đầu vào:**
  - `fromDate` — không bắt buộc, ngày bắt đầu dạng ISO/`YYYY-MM-DD`.
  - `toDate` — không bắt buộc, ngày kết thúc dạng ISO/`YYYY-MM-DD`.
  - Nếu không truyền, backend lấy từ ngày hiện tại đến 90 ngày tiếp theo.
- **Đầu ra `data[]`:**
  - `id`, `officerName`, `location`, `receptionDate`, `timeRange`, `note`.
  - `availableSlots`: toàn bộ ca chưa qua, gồm cả ca đã đầy để client biết trạng thái.
  - `openSlots`: chỉ các ca còn chỗ.
  - `slots[]`: `slotId`, `startTime`, `endTime`, `timeSlot`, `totalCapacity`, `heldCount`, `remainingCapacity`, `status`, `isFull`.
- **Chức năng chi tiết:**
  - Chỉ lấy lịch đang hoạt động và chưa xóa mềm.
  - Không trả lịch đã qua; với ngày hiện tại, ca đã bắt đầu cũng bị loại.
  - Cộng sức chứa của 8 quầy thành tổng sức chứa ca.
  - Tất cả đăng ký đã được lưu đều giữ chỗ, không phụ thuộc `PENDING`, `APPROVED`, `COMPLETED`, `REJECTED` hay xóa mềm.
  - Ca đủ sức chứa vẫn xuất hiện trong `slots` với `FULL`, nhưng không có trong `openSlots`.
  - Lịch cũ chưa có bảng slot được fallback về 8 quầy × 2 người/quầy.
- **Lỗi chính:** `400` nếu `fromDate > toDate` hoặc query ngày không hợp lệ.

### API 02 — `PATCH /api/reception-schedules/{scheduleId}/slots/{slotId}/capacity` — Cập nhật sức chứa của một quầy trong ca

- **Trạng thái:** Đã hoàn thành.
- **Đã làm/hiện có:** Validate UUID/sức chứa, permission `LTD_UPDATE`, kiểm tra số đơn đã giữ/gán quầy, transaction chống cập nhật đồng thời, audit, Swagger và test.
- **Chưa làm:** Chưa có lịch sử riêng cho từng lần thay đổi sức chứa ngoài audit chung; chưa hỗ trợ cập nhật hàng loạt 8 quầy trong một request.
- **Cần bổ sung:** Không bắt buộc cho yêu cầu hiện tại. Có thể bổ sung API cập nhật hàng loạt nếu màn hình quản lý cần chỉnh nhiều quầy cùng lúc.
- **Dùng để làm gì:** Điều chỉnh sức chứa của một quầy cụ thể trong một ca cụ thể.
- **Role áp dụng:** `CHUYEN_VIEN`, `LANH_DAO` hoặc `ADMIN` có permission `LTD_UPDATE`.
- **Trường hợp áp dụng:** Khi cần tăng/giảm số người một quầy có thể tiếp trong ca; mặc định khi tạo lịch là 2 người/quầy/ca.
- **Path đầu vào:**
  - `scheduleId` — UUID lịch tiếp dân.
  - `slotId` — UUID bản ghi cấu hình quầy trong ca.
- **Body đầu vào:**

```json
{
  "capacity": 3
}
```

- **Validation:** `capacity` là số nguyên, tối thiểu 1, không giới hạn tối đa.
- **Đầu ra `data`:** `id`, `scheduleId`, `timeSlot`, `counterCode`, `capacity`, `assignedCount`, `slotHeldCount`, `slotTotalCapacity`.
- **Chức năng chi tiết:**
  - Không được giảm thấp hơn số đơn đã gán trực tiếp vào quầy.
  - Không được làm tổng sức chứa của cả ca thấp hơn tổng số đơn đã giữ chỗ, kể cả đơn chưa gán quầy.
  - Dùng transaction và thử lại khi có xung đột cập nhật đồng thời.
  - Ghi audit thay đổi bảng `khung_gio_tiep_dan`.
- **Lỗi chính:** `401`, `403`, `404`; `409` nếu sức chứa mới làm thiếu chỗ.

---

## 4. API đăng ký tiếp dân

### API 03 — `POST /api/reception-registrations` — Người dân đăng ký lịch tiếp dân

- **Trạng thái:** Đã hoàn thành.
- **Đã làm/hiện có:** Validate dữ liệu người dân, sinh mã ngắn, kiểm tra lịch/ca/sức chứa, chống trùng theo điện thoại và CCCD, giới hạn 2 đơn/ngày, rate limit, transaction đồng thời, audit, Swagger và test. Response đã có contract tiếng Anh; các field SĐT/CCCD tiếng Anh được che một phần. Field database cũ vẫn được giữ để Mobile hiện tại không hỏng và được đánh dấu `deprecated` trên Swagger.
- **Chưa làm:** Chưa xóa các alias tiếng Việt/snake_case cũ vì Mobile vẫn có thể đang sử dụng. Không có hủy đơn theo quyết định nghiệp vụ.
- **Cần bổ sung:** Sau khi toàn bộ client chuyển sang contract tiếng Anh, có thể xóa alias cũ trong một phiên bản API lớn tiếp theo; không xóa trong phiên bản hiện tại.
- **Dùng để làm gì:** Mobile gửi đơn đăng ký lịch tiếp dân tại quầy.
- **Role áp dụng:** Public/Mobile, không cần token.
- **Trường hợp áp dụng:** Người dân chọn ngày/ca và nhập thông tin đăng ký.
- **Body đầu vào:**

```json
{
  "idLichTiepDan": "uuid-lich",
  "slotId": "uuid-slot-dai-dien",
  "slot": "07:30 - 08:30",
  "chuDe": "Hướng dẫn thủ tục",
  "lyDo": "Tôi cần được hướng dẫn về thủ tục hành chính",
  "hoTen": "Nguyễn Văn An",
  "sdt": "0912345678",
  "cccd": "042204001234",
  "diaChi": "Phường Thành Sen, tỉnh Hà Tĩnh"
}
```

- **Validation:**
  - `idLichTiepDan`: UUID bắt buộc.
  - Phải có ít nhất `slotId` hoặc `slot`; client mới nên gửi `slotId`.
  - Nếu gửi cả hai thì chúng phải cùng chỉ một ca.
  - `chuDe`: bắt buộc, tối đa 255 ký tự.
  - `lyDo`: 10–500 ký tự.
  - `hoTen`: tối đa 150 ký tự, chỉ chữ, khoảng trắng và ký tự tên hợp lệ.
  - `sdt`: số điện thoại Việt Nam 10 chữ số với đầu số hợp lệ.
  - `cccd`: đúng 12 chữ số.
  - `diaChi`: bắt buộc, tối đa 500 ký tự.
- **Đầu ra `data`:** contract chính dùng `id`, `receptionCode`, `receptionType`, `scheduleId`, `slotId`, `receptionDate`, `timeSlot`, `topic`, `description`, `fullName`, `phoneNumber`, `citizenId`, `address`, `department`, `leaderName`, `leaderTitle`, `status`, `rejectionReason`, `rejectedAt`, `createdAt`, `updatedAt`. `phoneNumber` và `citizenId` được che một phần. Các alias cũ như `ma_tiep_dan`, `id_lich_tiep_dan`, `slot`, `chu_de`, `ho_ten`, `sdt`, `cccd`, `trang_thai` vẫn được trả tạm thời để tương thích và đã đánh dấu `deprecated` trên Swagger.
- **Chức năng chi tiết:**
  - Backend sinh mã ngắn dạng 1 chữ cái + 5 chữ số, ví dụ `A00123`.
  - Tự đặt `loai = COUNTER_RECEPTION`, `trang_thai = PENDING`, ngày lấy từ lịch.
  - Từ chối lịch không tồn tại, lịch ngừng hoạt động, ngày/ca đã qua hoặc ca không thuộc lịch.
  - Từ chối khi ca đã đủ tổng sức chứa của 8 quầy.
  - Một số điện thoại hoặc một CCCD không được đăng ký trùng cùng lịch và ca.
  - Một số điện thoại tối đa 2 đơn/ngày; một CCCD tối đa 2 đơn/ngày.
  - Rate limit: 30 request/10 phút/IP.
  - Transaction `Serializable`, unique index và retry bảo vệ khi nhiều thiết bị cùng đăng ký chỗ cuối.
  - Ghi audit nhưng che `sdt` và `cccd`.
  - Không có API hủy đơn Mobile; mọi đơn đã tạo không trả chỗ.
- **Lỗi chính:** `400`, `404`, `409`; `503` khi tranh chấp đồng thời kéo dài.
- **Lưu ý contract:** Client mới chỉ nên đọc các field tiếng Anh. Alias tiếng Việt/snake_case là lớp tương thích tạm thời và chỉ được loại bỏ ở phiên bản API lớn tiếp theo.

### API 04 — `POST /api/reception-registrations/lookup` — Người dân tra cứu đơn đã đăng ký

- **Trạng thái:** Đã hoàn thành.
- **Đã làm/hiện có:** Tra cứu XOR bằng mã hoặc số điện thoại, chuẩn hóa mã viết hoa, che điện thoại/CCCD, trả trạng thái duyệt/từ chối, rate limit riêng 60 lượt/10 phút/IP; đã có Swagger và test `429`.
- **Chưa làm:** Chưa có CAPTCHA hoặc xác minh OTP khi tra bằng số điện thoại.
- **Cần bổ sung:** Chỉ bổ sung CAPTCHA/OTP nếu BA chốt yêu cầu xác thực mạnh hơn khi triển khai Internet công khai; không cần API hủy đơn.
- **Dùng để làm gì:** Người dân tra cứu đơn đã đăng ký bằng mã tiếp dân hoặc số điện thoại.
- **Role áp dụng:** Public/Mobile, không cần token.
- **Trường hợp áp dụng:** Xem lại lịch hẹn, trạng thái duyệt, quầy được phân hoặc lý do bị từ chối.
- **Body đầu vào:** Chỉ được gửi đúng một trong hai dạng:

```json
{ "receptionCode": "A00123" }
```

```json
{ "phoneNumber": "0912345678" }
```

- **Đầu ra `data[]`:** `id`, `receptionCode`, `receptionType`, `receptionDate`, `timeSlot`, `topic`, `description`, `fullName`, `phoneNumber`, `citizenId`, `address`, `department`, `leaderName`, `leaderTitle`, `status`, `rejectionReason`, `rejectedAt`, `createdAt`, `updatedAt`.
- **Chức năng chi tiết:**
  - Tra theo mã trả đơn tương ứng; tra theo điện thoại có thể trả nhiều đơn.
  - `phoneNumber` và `citizenId` được che, chỉ giữ 4 số cuối.
  - Không cho gửi đồng thời cả mã và số điện thoại.
  - Giới hạn 60 lượt tra cứu trong 10 phút cho mỗi IP để hạn chế dò mã/SĐT.
- **Lỗi chính:** `400` nếu payload sai; `404` nếu không có đăng ký; `429` nếu vượt rate limit.

### API 05 — `GET /api/reception-registrations` — Cán bộ lấy danh sách đăng ký tiếp dân

- **Trạng thái:** Đã hoàn thành.
- **Đã làm/hiện có:** Authenticate, permission `RR_GET_ALL`, phân trang, tìm kiếm/lọc ngày-trạng thái-quầy-đánh giá, Swagger và test. `receptionDate` chỉ nhận ngày thực có định dạng `YYYY-MM-DD`; `approvalStatus` chỉ nhận bốn trạng thái nghiệp vụ hợp lệ.
- **Chưa làm:** Chưa giới hạn dữ liệu theo quầy/cơ quan của chính cán bộ; người có permission hiện có thể xem toàn bộ danh sách phù hợp bộ lọc.
- **Cần bổ sung:** Chỉ cần bổ sung data-scope theo đơn vị/quầy nếu BA xác nhận cán bộ không được xem toàn bộ; permission chức năng hiện đã đủ.
- **Dùng để làm gì:** Màn hình cán bộ lấy danh sách đơn tiếp dân có phân trang và bộ lọc.
- **Role áp dụng:** cán bộ/lãnh đạo/quản trị có permission `RR_GET_ALL`.
- **Trường hợp áp dụng:** Bảng quản lý đơn tại 8 quầy.
- **Query đầu vào:** `page` (mặc định 1), `size` (mặc định 10, tối đa 100), `search`, `receptionDate` (`YYYY-MM-DD`), `approvalStatus` (`PENDING`/`APPROVED`/`COMPLETED`/`REJECTED`), `ratingStatus` (`RATED`/`NOT_RATED`), `department` (`QUAY_1`–`QUAY_8`).
- **Đầu ra `data[]`:** `id`, `receptionCode`, `applicantName`, `phoneNumber`, `receptionDate`, `timeSlot`, `topic`, `workingContent`, `department`, `approvalStatus`, `ratingStatus`, `approverName`, `approvedAt`, `completedAt`, `rejectionReason`, `rejectedAt`.
- **Đầu ra phân trang:** `pagination.currentPage`, `pageSize`, `totalPages`, `totalItems`.
- **Chức năng chi tiết:**
  - Hỗ trợ tìm kiếm và lọc để phục vụ bảng quản lý.
  - `ratingStatus` được suy ra từ việc đã có bản ghi đánh giá hay chưa; đây chỉ là trạng thái hiển thị, không phải nút thao tác.
- **Lỗi chính:** `400`, `401`, `403`.

### API 06 — `GET /api/reception-registrations/{id}` — Cán bộ xem chi tiết đăng ký tiếp dân

- **Trạng thái:** Đã hoàn thành.
- **Đã làm/hiện có:** Authenticate, permission `RR_GET_DETAIL`, validate UUID, trả lịch gốc, thông tin người dân, trạng thái, người duyệt, hoàn thành/từ chối và đánh giá. Swagger đã khai báo schema response chi tiết; test khóa các trường hợp `200`, `400`, `401`, `403`, `404`.
- **Chưa làm:** Chưa có data-scope theo quầy/đơn vị; response nội bộ trả điện thoại và CCCD đầy đủ.
- **Cần bổ sung:** Cần chốt quyền xem dữ liệu định danh theo đơn vị/quầy và quy tắc che dữ liệu nếu có yêu cầu bảo vệ thông tin cá nhân cao hơn.
- **Dùng để làm gì:** Xem toàn bộ thông tin người dân đã nhập khi cán bộ bấm vào mã tiếp dân.
- **Role áp dụng:** cán bộ/lãnh đạo/quản trị có permission `RR_GET_DETAIL`.
- **Trường hợp áp dụng:** Xác minh đúng yêu cầu trước khi phê duyệt, hoàn thành hoặc kiểm tra đánh giá.
- **Path đầu vào:** `id` — UUID đăng ký.
- **Đầu ra `data`:**
  - Thông tin chính: `id`, `receptionCode`, `receptionType`, `receptionDate`, `timeSlot`, `topic`, `workingContent`, `department`, `approvalStatus`.
  - `schedule`: lịch gốc, cán bộ, địa điểm, ngày, thời gian, ghi chú.
  - `applicant`: họ tên, điện thoại, CCCD, địa chỉ đầy đủ.
  - `approver`: tên, chức vụ, thời điểm duyệt.
  - `ratingStatus`, `completedAt`, `rejectionReason`, `rejectedAt`.
  - `rating`: điểm, gợi ý, nhận xét và thời điểm nếu đã đánh giá.
  - `createdAt`, `updatedAt`.
- **Chức năng chi tiết:** Đây là API nội bộ nên trả thông tin định danh đầy đủ; không dùng response này cho màn hình public.
- **Lỗi chính:** `400`, `401`, `403`, `404`.

### API 07 — `PATCH /api/reception-registrations/{id}/approve` — Phê duyệt đăng ký và phân quầy

- **Trạng thái:** Đã hoàn thành.
- **Đã làm/hiện có:** Permission `RR_APPROVE`, chỉ duyệt `PENDING`, gán `QUAY_1`–`QUAY_8`, kiểm tra sức chứa quầy trong transaction, lưu người/thời điểm duyệt, audit, Swagger và test. Transaction `Serializable` có retry; nếu tranh chấp đồng thời kéo dài thì trả `503` thay vì lộ lỗi Prisma thô.
- **Chưa làm:** Chưa có API đổi quầy sau khi đã `APPROVED`; chưa có luồng thu hồi phê duyệt.
- **Cần bổ sung:** Không bổ sung nếu quy trình không cho đổi sau duyệt. Nếu có ngoại lệ vận hành, phải chốt API chuyển quầy và cách kiểm tra sức chứa/audit trước khi code.
- **Dùng để làm gì:** Phê duyệt cho người dân được gặp và gán đơn vào một trong 8 quầy.
- **Role áp dụng:** cán bộ/lãnh đạo/quản trị có permission `RR_APPROVE`.
- **Trường hợp áp dụng:** Đơn đang `PENDING` và cán bộ xác nhận tiếp nhận tại quầy.
- **Path đầu vào:** `id` — UUID đăng ký.
- **Body đầu vào:** `{ "department": "QUAY_1" }`, chỉ nhận `QUAY_1` đến `QUAY_8`.
- **Đầu ra:** Cùng cấu trúc chi tiết của API 06 sau khi cập nhật.
- **Chức năng chi tiết:**
  - Chỉ `PENDING` được chuyển sang `APPROVED`.
  - Kiểm tra sức chứa của quầy trong đúng lịch và ca trước khi gán.
  - Lưu `bo_phan`, tên/chức vụ người duyệt, `thoi_gian_phe_duyet` và người cập nhật.
  - Transaction chống hai cán bộ cùng phân vào chỗ cuối của quầy.
  - Ghi audit và che trường nhạy cảm.
- **Lỗi chính:** `404`; `409` nếu sai trạng thái, quầy đầy hoặc người khác đã xử lý; `401`, `403`.

### API 08 — `PATCH /api/reception-registrations/{id}/complete` — Xác nhận hoàn thành buổi tiếp dân

- **Trạng thái:** Đã hoàn thành.
- **Đã làm/hiện có:** Permission `RR_COMPLETE`, chỉ chuyển `APPROVED → COMPLETED`, bắt buộc đã phân quầy, lưu người/thời điểm hoàn thành, chống xử lý lặp/đồng thời, audit và Swagger có schema response chi tiết. Test phủ `200`, `400`, `401`, `403`, `404`, `409`.
- **Chưa làm:** Chưa có API mở lại đơn đã `COMPLETED`.
- **Cần bổ sung:** Không cần mở lại theo luồng đã chốt; nếu cho phép sửa sai phải thiết kế permission riêng và audit bắt buộc.
- **Dùng để làm gì:** Xác nhận buổi tiếp dân đã thực sự kết thúc.
- **Role áp dụng:** `CHUYEN_VIEN`, `LANH_DAO` hoặc `ADMIN` có permission `RR_COMPLETE`.
- **Trường hợp áp dụng:** Sau khi cán bộ đã tiếp xong người dân; đây là điều kiện bắt buộc trước đánh giá.
- **Path đầu vào:** `id` — UUID đăng ký.
- **Body đầu vào:** Không có.
- **Đầu ra:** Cùng cấu trúc chi tiết của API 06, với `approvalStatus = COMPLETED` và `completedAt`.
- **Chức năng chi tiết:**
  - Chỉ `APPROVED` mới được chuyển sang `COMPLETED`.
  - Đơn phải đã được gán `QUAY_1`–`QUAY_8`.
  - Lưu thời điểm và UUID người hoàn thành; ghi audit.
  - Chống xử lý lặp/đồng thời.
- **Lỗi chính:** `404`; `409` nếu chưa duyệt, chưa phân quầy hoặc đã được xử lý; `401`, `403`.

### API 09 — `PATCH /api/reception-registrations/{id}/reject` — Từ chối đăng ký tiếp dân

- **Trạng thái:** Đã hoàn thành.
- **Đã làm/hiện có:** Permission `RR_REJECT`, chỉ từ chối `PENDING`, validate lý do, lưu người/thời điểm từ chối, không trả chỗ, chống xử lý lặp/đồng thời và audit. Swagger có schema response chi tiết; test phủ `200`, `400`, `401`, `403`, `404`, `409`.
- **Chưa làm:** Chưa có API khôi phục đơn `REJECTED` hoặc sửa lý do sau khi từ chối.
- **Cần bổ sung:** Không cần theo luồng hiện tại. Nếu BA cho phép phục hồi thì phải chốt rõ việc đơn vẫn giữ chỗ và quyền thao tác.
- **Dùng để làm gì:** Cán bộ từ chối một đơn đang chờ và ghi rõ lý do.
- **Role áp dụng:** `CHUYEN_VIEN`, `LANH_DAO` hoặc `ADMIN` có permission `RR_REJECT`.
- **Trường hợp áp dụng:** Đơn không đủ điều kiện tiếp nhận khi vẫn đang `PENDING`.
- **Path đầu vào:** `id` — UUID đăng ký.
- **Body đầu vào:** `{ "reason": "Lý do từ chối tối thiểu 5 ký tự" }`; giới hạn 5–500 ký tự.
- **Đầu ra:** Cùng cấu trúc chi tiết của API 06, với `approvalStatus = REJECTED`, `rejectionReason`, `rejectedAt`.
- **Chức năng chi tiết:**
  - Chỉ `PENDING` được từ chối.
  - Lưu lý do, thời điểm, UUID người từ chối và audit.
  - Đơn bị từ chối **không trả lại chỗ** theo yêu cầu đã chốt.
- **Lỗi chính:** `404`; `409` nếu không còn `PENDING` hoặc đã bị người khác xử lý; `401`, `403`.

### API 10 — `GET /api/reception-registrations/rating-lookup/{receptionCode}` — iPad tra mã trước khi đánh giá

- **Trạng thái:** Đã hoàn thành.
- **Đã làm/hiện có:** Validate mã, chỉ cho đơn `COMPLETED` đã gán quầy và chưa đánh giá, che dữ liệu nhạy cảm, rate limit riêng 60 lượt/10 phút/IP, Swagger có response schema và test `429`.
- **Chưa làm:** Chưa ràng buộc thiết bị iPad với đúng quầy bằng token/thiết bị.
- **Cần bổ sung:** Chỉ cần định danh iPad/quầy nếu sau này có yêu cầu ngăn iPad quầy khác tra hoặc đánh giá hộ.
- **Dùng để làm gì:** iPad tra mã tiếp dân và hiển thị yêu cầu gốc cho người dân xác nhận trước khi đánh giá.
- **Role áp dụng:** Public/iPad, không cần token.
- **Trường hợp áp dụng:** Cán bộ nhập thủ công mã tiếp dân trên iPad tại quầy tương ứng.
- **Path đầu vào:** `receptionCode` — 4–50 ký tự chữ/số/gạch ngang; backend chuẩn hóa viết hoa.
- **Đầu ra `data`:** `registrationId`, `receptionCode`, `receptionDate`, `timeSlot`, `topic`, `workingContent`, `applicant`, `department`, `approvalStatus`, `ratingStatus`.
- **Chức năng chi tiết:**
  - Chỉ trả dữ liệu khi đơn `COMPLETED`, đã phân quầy và chưa đánh giá.
  - Che số điện thoại và CCCD, chỉ giữ 4 số cuối.
  - Không truyền mã từ desktop sang iPad và không quản lý trạng thái “iPad đang hiển thị mã nào”.
- **Lỗi chính:** `404` nếu mã không tồn tại; `409` nếu chưa hoàn thành, chưa phân quầy hoặc đã đánh giá.

---

## 5. API đánh giá hài lòng

### API 11 — `GET /api/reception-ratings/configuration` — Lấy cấu hình thang điểm và gợi ý đánh giá

- **Trạng thái:** Đã hoàn thành.
- **Đã làm/hiện có:** Trả thang 1–5 sao, giới hạn 2.000 ký tự và gợi ý theo từng mức sao; Swagger khai báo đầy đủ schema/giá trị cấu hình và đã có test contract.
- **Chưa làm:** Chưa có bảng cấu hình, version cấu hình hoặc API quản trị nội dung gợi ý.
- **Cần bổ sung:** Không cần nếu nội dung gợi ý do đội BE phát hành cùng code. Nếu lãnh đạo phải tự chỉnh thì cần thiết kế CRUD cấu hình và permission riêng.
- **Dùng để làm gì:** iPad lấy thang điểm, giới hạn nhận xét và gợi ý theo số sao.
- **Role áp dụng:** Public/iPad, không cần token.
- **Trường hợp áp dụng:** Khi mở màn hình đánh giá hoặc trước khi render danh sách gợi ý.
- **Đầu vào:** Không có.
- **Đầu ra `data`:** `scale`, `comment.maxLength = 2000`, `suggestionsByScore` từ 1 đến 5 sao.
- **Chức năng chi tiết:** Cấu hình hiện nằm trong constant của backend, chưa có API quản trị và chưa có bảng cấu hình riêng trong database.

### API 12 — `POST /api/reception-ratings` — Người dân gửi đánh giá từ iPad

- **Trạng thái:** Đã hoàn thành.
- **Đã làm/hiện có:** Validate 1–5 sao/gợi ý/comment, chỉ nhận đơn `COMPLETED`, chống gửi trùng ở service và unique DB, rate limit riêng 20 yêu cầu/10 phút/IP, audit, Swagger có response schema và test `429`.
- **Chưa làm:** Chưa có CAPTCHA; chưa có cơ chế sửa hoặc xóa đánh giá sau khi gửi.
- **Cần bổ sung:** Chỉ bổ sung CAPTCHA nếu endpoint triển khai Internet công khai cần bảo vệ mạnh hơn. Không thêm sửa/xóa nếu nguyên tắc là đánh giá một lần; nếu có xử lý khiếu nại phải tách luồng quản trị và audit.
- **Dùng để làm gì:** Lưu đánh giá 1–5 sao, gợi ý được chọn và nhận xét tự do từ iPad.
- **Role áp dụng:** Public/iPad, không cần token.
- **Trường hợp áp dụng:** Sau khi API 10 xác nhận mã đủ điều kiện và người dân hoàn tất nhập đánh giá.
- **Body đầu vào:**

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

- **Validation:** `score` là số nguyên 1–5; tối đa 5 gợi ý không trùng, mỗi gợi ý tối đa 200 ký tự; `comment` tối đa 2.000 ký tự.
- **Đầu ra `data`:** `id`, `receptionCode`, `score`, `selectedSuggestions`, `comment`, `createdAt`.
- **Chức năng chi tiết:**
  - Chỉ đơn `COMPLETED`, đã phân quầy và chưa đánh giá mới được gửi.
  - Gợi ý phải nằm đúng danh sách của số sao đã chọn.
  - Mỗi đăng ký chỉ có một đánh giá; unique constraint database chống hai lần gửi đồng thời.
  - Lưu `score` vào `diem_tong`, gợi ý vào JSON `ly_do`, nhận xét vào `nhan_xet`; `tieu_chi` hiện là `null`.
  - Ghi audit.
- **Lỗi chính:** `400`, `404`, `409`.
- **Rate limit:** `429` khi một IP gửi quá 20 yêu cầu trong 10 phút.

### API 13 — `GET /api/reception-ratings` — Lãnh đạo lấy danh sách đánh giá

- **Trạng thái:** Đã hoàn thành.
- **Đã làm/hiện có:** Authenticate, `RRT_GET_ALL`, phân trang, tìm kiếm/lọc điểm-quầy-ngày; kiểm tra ngày lịch có thật theo đúng `YYYY-MM-DD`; Swagger có schema response và test đủ `200`, `400`, `401`, `403`.
- **Chưa làm:** Chưa có export Excel/PDF và chưa giới hạn data-scope theo cơ quan nếu hệ thống có nhiều đơn vị.
- **Cần bổ sung:** Chỉ thêm export hoặc data-scope khi có yêu cầu báo cáo/phân cấp cụ thể.
- **Dùng để làm gì:** Lãnh đạo lấy danh sách đánh giá có tìm kiếm, lọc và phân trang.
- **Role áp dụng:** lãnh đạo/quản trị hoặc tài khoản có permission `RRT_GET_ALL`.
- **Trường hợp áp dụng:** Màn hình quản lý đánh giá hài lòng.
- **Query đầu vào:** `page` (số nguyên từ 1), `size` (1–100), `search` (tối đa 100 ký tự), `score` (1–5), `department` (`QUAY_1`–`QUAY_8`), `fromDate` và `toDate` (ngày có thật theo `YYYY-MM-DD`).
- **Đầu ra `data[]`:** `id`, `receptionCode`, `applicantName`, `department`, `receptionDate`, `timeSlot`, `topic`, `score`, `selectedSuggestions`, `comment`, `ratedAt`; kèm `pagination`.
- **Chức năng chi tiết:** Lọc điểm 1–5, quầy `QUAY_1`–`QUAY_8`, khoảng ngày; từ ngày không được sau đến ngày.
- **Lỗi chính:** `400`, `401`, `403`.

### API 14 — `GET /api/reception-ratings/{id}` — Lãnh đạo xem chi tiết đánh giá

- **Trạng thái:** Đã hoàn thành.
- **Đã làm/hiện có:** Authenticate, `RRT_GET_DETAIL`, validate UUID, chỉ lấy đánh giá thuộc loại tiếp dân tại quầy, trả đánh giá và đăng ký/lịch gốc; Swagger có schema response và test đủ `200`, `400`, `401`, `403`, `404`.
- **Chưa làm:** Chưa có data-scope theo đơn vị; thông tin người dân được trả đầy đủ cho người có permission.
- **Cần bổ sung:** Chốt phạm vi xem dữ liệu cá nhân theo role/đơn vị; nếu cần thì che trường hoặc thêm permission dữ liệu nhạy cảm.
- **Dùng để làm gì:** Lãnh đạo xem một đánh giá cùng toàn bộ đơn tiếp dân gốc.
- **Role áp dụng:** lãnh đạo/quản trị hoặc tài khoản có permission `RRT_GET_DETAIL`.
- **Trường hợp áp dụng:** Khi bấm vào một dòng đánh giá cần kiểm tra chi tiết.
- **Path đầu vào:** `id` — UUID đánh giá.
- **Đầu ra `data`:** điểm, gợi ý, nhận xét, thời điểm đánh giá; `registration` gồm mã, lịch/ca, nội dung yêu cầu, thông tin người dân đầy đủ, quầy, trạng thái, người duyệt và lịch gốc.
- **Chức năng chi tiết:** Chỉ trả đánh giá gắn với đăng ký loại `COUNTER_RECEPTION`.
- **Lỗi chính:** `400`, `401`, `403`, `404`.

### API 15 — `GET /api/reception-ratings/statistics` — Lấy thống kê mức độ hài lòng

- **Trạng thái:** Đã hoàn thành.
- **Đã làm/hiện có:** Authenticate, `RRT_GET_STATS`, lọc quầy/khoảng ngày có thật theo `YYYY-MM-DD`, tổng lượt, trung bình, tỷ lệ hài lòng, phân bố đủ 5 mức sao và thống kê theo quầy; Swagger có schema response và test đủ `200`, `400`, `401`, `403`, kể cả dữ liệu rỗng.
- **Chưa làm:** Chưa có so sánh kỳ, xu hướng theo ngày/tháng hoặc export báo cáo.
- **Cần bổ sung:** Không bắt buộc cho thống kê cơ bản; bổ sung khi BA chốt mẫu dashboard/báo cáo nâng cao.
- **Dùng để làm gì:** Lãnh đạo xem thống kê cơ bản về mức độ hài lòng.
- **Role áp dụng:** lãnh đạo/quản trị hoặc tài khoản có permission `RRT_GET_STATS`.
- **Trường hợp áp dụng:** Dashboard/báo cáo đánh giá theo thời gian hoặc quầy.
- **Query đầu vào:** `department` (`QUAY_1`–`QUAY_8`), `fromDate` và `toDate` (ngày có thật theo `YYYY-MM-DD`).
- **Đầu ra `data`:**
  - `totalRatings`: tổng lượt.
  - `averageScore`: điểm trung bình làm tròn 2 chữ số.
  - `satisfactionRate`: tỷ lệ đánh giá 4–5 sao, đơn vị phần trăm.
  - `scoreDistribution[]`: đủ 5 mức sao với `score`, `count`.
  - `byDepartment[]`: `department`, `totalRatings`, `averageScore`.
- **Lỗi chính:** `400`, `401`, `403`.

---

## 6. API quản lý lịch tiếp dân bằng tiếng Anh

### API 16 — `POST /api/reception-schedules/management` — Tạo lịch tiếp dân thủ công

- **Trạng thái:** Đã tách sang API tiếng Anh; nghiệp vụ slot/sức chứa đã hoàn thành.
- **Đã làm/hiện có:** Authenticate, `LTD_CREATE`, validate ngày lịch có thật theo `YYYY-MM-DD`, hỗ trợ giờ mặc định hoặc một trong hai cách cấu hình giờ, tự sinh ca một tiếng và 8 quầy sức chứa mặc định 2, chống trùng lịch cùng cán bộ/ngày, audit; Swagger có schema response và test đủ `200`, `400`, `401`, `403`.
- **Chưa làm:** `tenCanBo` vẫn là chuỗi tự do, chưa gắn `userId`; chưa có kiểm tra xung đột cán bộ/quầy một cách chuẩn hóa; validation “không tạo lịch trong quá khứ” cần được xác nhận lại ở service/test đầy đủ.
- **Cần bổ sung:** Chuẩn hóa cán bộ/quầy và bổ sung kiểm tra lịch quá khứ/xung đột nếu BA xác nhận quy tắc. API `/api/lich-tiep-dan` cũ không bị sửa.
- **Dùng để làm gì:** Cán bộ/lãnh đạo tạo một ngày lịch tiếp dân và backend tự sinh ca một tiếng cho 8 quầy.
- **Role áp dụng:** tài khoản có permission `LTD_CREATE`.
- **Trường hợp áp dụng:** Thêm lịch thủ công thay vì import Excel.
- **Body đầu vào:** `diaDiem`, `tenCanBo`, `ngayTiepDan` (ngày có thật theo `YYYY-MM-DD`) bắt buộc; `ghiChu`; chỉ dùng một trong hai cách là cặp cũ `batDau`/`ketThuc` hoặc `workingPeriods` tối đa 2 khoảng.
- **Mẫu mới:**

```json
{
  "diaDiem": "Bộ phận tiếp công dân",
  "tenCanBo": "Nguyễn Văn An",
  "ngayTiepDan": "2026-08-25",
  "workingPeriods": [
    { "startTime": "07:30", "endTime": "11:30" },
    { "startTime": "13:30", "endTime": "16:30" }
  ],
  "ghiChu": "Tiếp công dân định kỳ"
}
```

- **Đầu ra:** Bản ghi lịch vừa tạo và cấu hình slot/quầy liên quan theo response service hiện hành.
- **Chức năng chi tiết:**
  - Nếu không gửi giờ, dùng mặc định `07:30–11:30` và `13:30–16:30`.
  - Tạo 7 ca một tiếng trong ngày.
  - Mỗi ca tạo 8 quầy `QUAY_1`–`QUAY_8`, mặc định 2 người/quầy, tổng 16 người/ca.
  - Lãnh đạo/cán bộ có quyền có thể truyền giờ khác.
  - Ghi audit thao tác tạo.
- **Lỗi chính:** `400`, `401`, `403`.

### API 17 — `PUT /api/reception-schedules/management/{id}` — Cập nhật thông tin và thời gian lịch tiếp dân

- **Trạng thái:** Đã tách sang API tiếng Anh; nghiệp vụ cập nhật an toàn đã hoàn thành.
- **Đã làm/hiện có:** Authenticate, `LTD_UPDATE`, validate UUID và ngày có thật theo `YYYY-MM-DD`, chỉ nhận một cách cấu hình giờ, cập nhật metadata/working periods, chặn đổi ngày/giờ khi có đăng ký giữ chỗ, giữ cấu hình sức chứa khi chỉ đổi metadata, rebuild slot khi được phép, chống trùng cán bộ/ngày, audit; Swagger có schema response và test đủ `200`, `400`, `401`, `403`, `404`.
- **Chưa làm:** Chưa có quy tắc chuyển lịch thay thế khi buộc phải đổi giờ; cán bộ vẫn là chuỗi; chưa chuẩn hóa toàn bộ lỗi thành `409` cho xung đột nghiệp vụ.
- **Cần bổ sung:** Chỉ cần thiết kế lịch thay thế nếu nghiệp vụ cho đổi lịch đã có người đăng ký; tiếp tục giữ quy tắc hiện tại nếu không cho đổi.
- **Dùng để làm gì:** Sửa thông tin hoặc thời gian của lịch tiếp dân.
- **Role áp dụng:** tài khoản có permission `LTD_UPDATE`.
- **Trường hợp áp dụng:** Điều chỉnh tên cán bộ, địa điểm, ghi chú hoặc khung giờ làm việc.
- **Path đầu vào:** `id` — ID lịch.
- **Body đầu vào:** giống API 16; các trường chính hiện được validator yêu cầu lại khi cập nhật.
- **Đầu ra:** Lịch sau cập nhật.
- **Chức năng chi tiết:**
  - Nếu đã có bất kỳ đăng ký giữ chỗ, không cho đổi ngày hoặc giờ.
  - Nếu chưa có đăng ký và thay đổi giờ, tạo lại các slot một tiếng cho 8 quầy.
  - Nếu chỉ đổi tên cán bộ, địa điểm hoặc ghi chú, giữ nguyên cấu hình sức chứa đã chỉnh.
  - Kiểm tra giờ bắt đầu trước giờ kết thúc, khoảng làm việc không chồng nhau và chia thành ca một tiếng.
  - Ghi audit.
- **Lỗi chính:** `400`, `401`, `403`, `404`; xung đột nghiệp vụ hiện được trả dạng `400` theo Swagger cũ.

### API 18 — `GET /api/reception-schedules/management/{id}` — Xem chi tiết lịch, ca và sức chứa từng quầy

- **Trạng thái:** Đã tách sang API tiếng Anh; response slot/sức chứa đã hoàn thành.
- **Đã làm/hiện có:** Validate UUID; trả chi tiết lịch, các ca, tổng sức chứa, số giữ chỗ/chưa gán quầy và chi tiết từng quầy; Swagger có schema response và ví dụ; test đủ `200`, `400`, `404`.
- **Chưa làm:** Route vẫn public, chưa có permission xem chi tiết quản lý; response vẫn pha trộn model cũ và field mở rộng.
- **Cần bổ sung:** Thêm authenticate/permission đọc chi tiết nếu endpoint chỉ dùng nội bộ; chuẩn hóa schema response mà vẫn bảo đảm client cũ không bị phá.
- **Dùng để làm gì:** Lấy chi tiết lịch cho màn hình quản lý, gồm sức chứa từng quầy.
- **Role áp dụng hiện tại:** Public, chưa có authenticate/permission.
- **Trường hợp áp dụng:** Xem chi tiết một lịch trong màn hình quản lý.
- **Path đầu vào:** `id` — ID lịch.
- **Đầu ra:** Bản ghi lịch cũ và `slots[]`; mỗi slot có `timeSlot`, `totalCapacity`, `heldCount`, `unassignedHeldCount`, `remainingCapacity`, `isFull`, `counters[]`. Mỗi quầy có `id`, `counterCode`, `capacity`, `heldCount`, `remainingCapacity`, `isFull`, `isActive`.
- **Chức năng chi tiết:** Mọi đơn đã lưu đều tính giữ chỗ, kể cả bị từ chối hoặc xóa mềm.

---

## 7. API quản lý tiếng Anh đã sao chép và còn cần bổ sung

### API 19 — `POST /api/reception-schedules/management/import` — Import lịch tiếp dân từ Excel

- **Trạng thái:** Đã hoàn thành theo mô hình slot mới.
- **Đã làm/hiện có:** Authenticate, `LTD_CREATE`, upload Excel `.xlsx/.xls` tối đa 10 MB, validate toàn bộ file trước khi ghi, mỗi dòng tạo ca một tiếng × 8 quầy × sức chứa mặc định 2, chống trùng trong file và DB, transaction toàn file, audit, Swagger và test `200`, `400`, `401`, `403`, `409`.
- **Chưa làm:** Chưa hỗ trợ nhiều khoảng làm việc trên cùng một dòng; mỗi dòng hiện biểu diễn một khoảng `Từ`–`Đến`.
- **Cần bổ sung:** Chỉ mở rộng template nếu BA yêu cầu nhiều khoảng làm việc trong một bản ghi import.
- **Dùng để làm gì:** Import lịch tiếp dân từ Excel.
- **Role áp dụng:** tài khoản có permission `LTD_CREATE`.
- **Đầu vào:** `multipart/form-data`, field `file`; nhận `.xlsx`/`.xls`, tối đa 10 MB.
- **Đầu ra:** `data.importedCount`, `data.totalCounterSlots`; message báo import thành công.
- **Chức năng hiện có:** upload, đọc/validate toàn file, từ chối file rỗng/sai/trùng, tạo lịch và slot trong một transaction, ghi audit.
- **Quy tắc rollback:** Nếu bất kỳ dòng nào sai hoặc thao tác DB thất bại, transaction rollback toàn file; không import một phần.

### API 20 — `GET /api/reception-schedules/management` — Lấy danh sách lịch theo bộ lọc

- **Trạng thái:** Đã hoàn thành API danh sách quản lý tiếng Anh.
- **Đã làm/hiện có:** Authenticate, permission `LTD_GET_ALL`, validate query, chỉ cho tối đa một bộ lọc thời gian, lọc đúng boolean `isActive`, bỏ lịch xóa mềm, sắp xếp theo ngày/giờ, Swagger response/lỗi và test `200`, `400`, `401`, `403`.
- **Chưa làm:** Response danh sách chưa tổng hợp sức chứa và số đơn giữ chỗ; thông tin này hiện có ở API chi tiết.
- **Cần bổ sung:** Chỉ mở rộng số liệu tổng hợp trong danh sách nếu màn hình quản lý thực sự cần để tránh query nặng.
- **Dùng để làm gì:** Lấy danh sách lịch theo bộ lọc.
- **Role áp dụng:** tài khoản cán bộ/lãnh đạo được cấp permission `LTD_GET_ALL`.
- **Query đầu vào:** `weekYear`, `monthYear`, `date`, `isActive`.
- **Đầu ra:** Danh sách bản ghi lịch theo model cũ.

### API 21 — `GET /api/reception-schedules/management/pagination` — Lấy danh sách lịch có phân trang

- **Trạng thái:** Đã hoàn thành API danh sách quản lý có phân trang.
- **Đã làm/hiện có:** Authenticate, permission `LTD_GET_ALL`, validate bộ lọc, mặc định `page=1`, `size=10`, giới hạn `size<=100`, lọc đúng boolean `isActive`, response `pagination`, Swagger và test `200`, `400`, `401`, `403`.
- **Chưa làm:** Response từng dòng chưa tổng hợp sức chứa và số đăng ký giữ chỗ.
- **Cần bổ sung:** Chỉ thêm số liệu tổng hợp nếu màn hình danh sách cần hiển thị trực tiếp.
- **Dùng để làm gì:** Lấy danh sách lịch có phân trang.
- **Role áp dụng:** tài khoản cán bộ/lãnh đạo được cấp permission `LTD_GET_ALL`.
- **Query đầu vào:** `weekYear`, `monthYear`, `date`, `isActive`, `page`, `size`.
- **Đầu ra:** `data[]` và `pagination` theo wrapper chung.

### API 22 — `GET /api/reception-schedules/management/count` — Đếm số lịch tiếp dân

- **Trạng thái:** Đã hoàn thành API đếm lịch quản lý tiếng Anh.
- **Đã làm/hiện có:** Authenticate, permission `LTD_GET_ALL`, validate tối đa một bộ lọc thời gian, đếm song song `total`, `active`, `inactive`, Swagger response/lỗi và test `200`, `400`, `401`, `403`.
- **Chưa làm:** Chưa nhóm số lượng theo ngày, ca hoặc cán bộ.
- **Cần bổ sung:** Dùng API thống kê riêng nếu sau này cần biểu đồ/phân nhóm thay vì mở rộng endpoint đếm cơ bản.
- **Dùng để làm gì:** Đếm lịch theo tuần, tháng hoặc ngày.
- **Role áp dụng:** tài khoản cán bộ/lãnh đạo được cấp permission `LTD_GET_ALL`.
- **Query đầu vào:** `weekYear`, `monthYear`, `date`.
- **Đầu ra:** `data.total`, `data.active`, `data.inactive`.

### API 23 — `DELETE /api/reception-schedules/management/{id}` — Xóa mềm lịch tiếp dân

- **Trạng thái:** Đã có bản sao tiếng Anh; chưa bổ sung quy tắc bảo vệ lịch đã có đăng ký.
- **Đã làm/hiện có:** Authenticate, `LTD_DELETE`, xóa mềm lịch và audit.
- **Chưa làm:** Chưa chặn xóa lịch có đăng ký giữ chỗ; Swagger chưa mô tả response/lỗi đầy đủ.
- **Cần bổ sung:** Kiểm tra số đăng ký trong transaction và từ chối xóa khi đã có người giữ chỗ, hoặc phải chốt quy trình lịch thay thế trước khi cho xóa.
- **Dùng để làm gì:** Xóa mềm lịch tiếp dân.
- **Role áp dụng:** tài khoản có permission `LTD_DELETE`.
- **Path đầu vào:** `id` — ID lịch.
- **Đầu ra:** `data = null`, message xóa thành công.
- **Chức năng hiện có:** xóa lịch và ghi audit.

### API 24 — `PUT /api/reception-schedules/management/{id}/status` — Bật hoặc tắt lịch tiếp dân

- **Trạng thái:** Đã có bản sao tiếng Anh; chưa bổ sung quy tắc cho lịch đã có đăng ký.
- **Đã làm/hiện có:** Authenticate, `LTD_UPDATE_STATUS`, validate `isActive`, cập nhật trạng thái và audit.
- **Chưa làm:** Chưa có quy tắc tắt lịch khi đã có đăng ký; chưa xử lý/giải thích ảnh hưởng tới các đơn giữ chỗ; Swagger response/lỗi còn trống.
- **Cần bổ sung:** Chốt và triển khai một quy tắc rõ ràng: cấm tắt khi có đăng ký, hoặc ngừng lịch kèm quy trình xử lý đăng ký; bổ sung test và Swagger.
- **Dùng để làm gì:** Bật/tắt trạng thái hoạt động của lịch.
- **Role áp dụng:** tài khoản có permission `LTD_UPDATE_STATUS`.
- **Path đầu vào:** `id` — ID lịch.
- **Body đầu vào:** `{ "isActive": true }`.
- **Đầu ra:** Bản ghi lịch sau cập nhật.
- **Chức năng hiện có:** cập nhật `is_active`, ghi người cập nhật và audit.

### API 25 — `GET /api/reception-schedules/management/template` — Lấy file Excel mẫu để import lịch

- **Trạng thái:** Đã có bản sao tiếng Anh; chức năng cơ bản đã có nhưng Swagger response chưa đầy đủ.
- **Đã làm/hiện có:** Authenticate, `LTD_GET_TEMPLATE`, trả đường dẫn tương đối tới file Excel mẫu.
- **Chưa làm:** Swagger response/lỗi còn trống; chưa xác nhận template phản ánh đầy đủ giờ làm việc/sức chứa theo mô hình mới.
- **Cần bổ sung:** Cập nhật hoặc xác nhận cột template, thêm test tải template và hoàn thiện Swagger.
- **Dùng để làm gì:** Lấy đường dẫn file Excel mẫu để import lịch.
- **Role áp dụng:** tài khoản có permission `LTD_GET_TEMPLATE`.
- **Đầu vào:** Không có.
- **Đầu ra:**

```json
{
  "success": true,
  "data": {
    "relative_url": "/duong-dan-template"
  },
  "message": "Lấy template lịch tiếp dân thành công",
  "pagination": null
}
```


---

## 8. API/chức năng chưa làm

Các mục dưới đây chưa có contract cuối cùng, vì vậy **không được xem là API đã chốt tên**.

### 8.1. API lịch lặp định kỳ

- **Trạng thái:** Chưa làm.
- **Nhu cầu:** Tạo lịch lặp theo tuần/tháng, ngày kết thúc, loại trừ ngày nghỉ/lễ; sửa một lần xuất hiện hoặc cả chuỗi; ngừng một ngày cụ thể.
- **Role dự kiến:** `LANH_DAO`, `ADMIN` hoặc cán bộ có permission quản lý chuỗi lịch mới.
- **Đầu vào dự kiến:** thông tin lịch gốc, quy tắc `WEEKLY`/`MONTHLY`, ngày bắt đầu/kết thúc, ngày trong tuần/ngày trong tháng, danh sách ngày loại trừ, khung giờ và cấu hình quầy.
- **Đầu ra dự kiến:** ID chuỗi lịch, quy tắc lặp và danh sách/số lượng lịch con được tạo.
- **Chưa chốt:** tên endpoint, permission mới, cách cập nhật một lịch hay toàn chuỗi, xử lý ngày lễ và giới hạn số lịch được sinh.
- **Giải pháp hiện tại:** tạo từng lịch thủ công bằng API 16 hoặc import Excel bằng API 19.

### 8.2. Không có API hủy đơn Mobile

- **Trạng thái:** Không triển khai theo yêu cầu đã chốt, không phải thiếu sót.
- **Lý do:** Đơn đã tạo luôn giữ chỗ; người dân không được tự hủy để trả chỗ.

### 8.3. Không có API “mời đánh giá” hoặc truyền mã từ desktop sang iPad

- **Trạng thái:** Không triển khai theo luồng đã chốt, không phải thiếu sót.
- **Lý do:** Cán bộ nhập mã tiếp dân trực tiếp trên iPad; màn hình desktop chỉ hiển thị `ratingStatus`.

### 8.4. Không có API quản lý iPad/quầy riêng

- **Trạng thái:** Chưa có và hiện chưa được yêu cầu.
- **Cách làm hiện tại:** iPad tương ứng với số quầy; quầy được xác định từ `department = QUAY_1` đến `QUAY_8` của đăng ký.

### 8.5. Chưa có API quản trị cấu hình gợi ý đánh giá

- **Trạng thái:** Chưa làm.
- **Cách làm hiện tại:** Thang điểm, giới hạn 2.000 ký tự và gợi ý theo sao nằm trong constant backend, API 11 chỉ đọc cấu hình.
- **Nếu cần về sau:** phải chốt bảng cấu hình, CRUD, version cấu hình và permission quản trị.

---

## 9. Các thay đổi không cần thêm endpoint nhưng vẫn còn thiếu

### 9.1. Chuẩn hóa quầy/bộ phận ở tầng database

- API mới đã validate `QUAY_1`–`QUAY_8`.
- Bảng slot đã dùng `ma_quay`; đăng ký dùng lại `bo_phan`.
- Còn thiếu DB `CHECK` để ngăn dữ liệu ngoài `QUAY_1`–`QUAY_8` khi ghi trực tiếp hoặc từ code cũ.
- Chưa có `counterName`/`departmentName` thân thiện như “Quầy 1” trong mọi response.
- `ten_can_bo` vẫn là chuỗi, chưa liên kết bắt buộc với `userId` và chưa hỗ trợ nhiều cán bộ trên cùng quầy/ca.

### 9.2. Bảo vệ API quản lý lịch đã có đăng ký

- API 17 đã chặn đổi ngày/giờ khi có đăng ký.
- API 23 chưa chặn xóa lịch đã có đăng ký.
- API 24 chưa chốt quy tắc tắt lịch đã có đăng ký.

### 9.3. Phân quyền API đọc lịch quản lý

- API 18, 20, 21 và 22 đang public.
- Cần chốt permission đọc danh sách, chi tiết và thống kê lịch trước khi thêm middleware.
- API public cho Mobile phải tiếp tục dùng riêng là API 01, chỉ trả dữ liệu cần thiết.

### 9.4. Swagger của API quản lý tiếng Anh

- 15 API mới và 10 API quản lý lịch tiếng Anh đều đã xuất hiện trên Swagger với mô tả tiếng Việt.
- 7 API quản lý tiếng Anh được sao chép từ contract cũ còn nhiều response chưa chi tiết.
- Khi tiếp tục phát triển, chỉ bổ sung request, response, permission, lỗi và ví dụ trên API 19–25; không sửa Swagger/contract của nhóm `/api/lich-tiep-dan` cũ.

## 10. Kết luận

- Luồng chính hiện đã đủ API cho: tạo lịch và sức chứa → Mobile đăng ký/tra cứu → cán bộ xem, duyệt, từ chối, hoàn thành → iPad tra mã/gửi đánh giá → lãnh đạo xem danh sách, chi tiết và thống kê.
- Có **15 API tiếng Anh của luồng Mobile/đăng ký/đánh giá** và **10 API quản lý lịch tiếng Anh**.
- Tài liệu chỉ theo dõi 25 API tiếng Anh. Các API `/api/lich-tiep-dan` cũ vẫn tồn tại trong code để tương thích nhưng không còn được liệt kê thành từng mục.
- Phần lớn việc còn lại là hoàn thiện API quản lý tiếng Anh, constraint database, phân quyền đọc và Swagger mà không ảnh hưởng API cũ.
- Nhóm API thực sự chưa có là lịch lặp định kỳ và các API quản trị tùy chọn; các contract này cần được chốt trước khi code.
