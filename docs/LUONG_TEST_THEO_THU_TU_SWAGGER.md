# Luồng test theo thứ tự Swagger

Tài liệu này dùng để chạy thủ công trên `/api-docs/`. Thực hiện từng nhóm theo đúng thứ tự hiển thị của Swagger (Auths đến Logs). Không dùng lại ID/mã đã bị xóa ở bước trước; lưu các biến lấy từ response: `accessToken`, `refreshToken`, `userId`, `roleId`, `id`, `maPhanAnh`, `receptionCode`, `registrationId`, `scheduleId`, `attachmentId`, `fileName`.

## 0. Chuẩn bị chung

1. Mở `/api-docs/`, chọn đúng server DEV và đăng nhập Basic Auth của Swagger nếu được hỏi.
2. Chạy `POST /api/auths/login` bằng tài khoản phù hợp quyền của luồng. Copy `accessToken` từ response.
3. Nhấn **Authorize**, dán `Bearer <accessToken>` (nếu Swagger khai báo bearer token). Mỗi khi đổi vai trò, đăng nhập lại rồi cập nhật token.
4. Với request có body, ưu tiên **Example Value** đã có sẵn; chỉ thay các ID/mã bằng giá trị vừa tạo hoặc dữ liệu demo DEV. Ghi lại HTTP status, response body và thời điểm test.
5. Kỳ vọng chung: thành công là 2xx; thiếu/chưa đăng nhập là 401; thiếu quyền là 403; body/path sai là 400/422; ID không có là 404; sai trạng thái hoặc trùng dữ liệu thường là 409. Đối chiếu thông điệp thực tế trong response.

## 1. Nền tảng và phân quyền

| Thứ tự | Nhóm Swagger | Chạy lần lượt | Kết quả cần giữ lại |
|---|---|---|---|
| 1 | Auths | `login` → `my-profile` → `refresh-token` → gọi lại `my-profile` bằng token mới → `logout` | Token hoạt động, hồ sơ đúng tài khoản; token cũ/mới xử lý đúng sau logout. Test riêng `change-password`, 2FA, OTP/reset và captcha bằng tài khoản/dữ liệu an toàn. |
| 2 | Permission | `GET /api/permission/cate` → `GET /api/permission` | Danh mục và mã quyền dùng để tạo role. |
| 3 | Role | `POST /api/role` → `GET /api/role/{roleId}` → `PUT /api/role/{roleId}` → `PUT update-status` → `GET pagination` → `DELETE /api/role/{roleId}` | Role có đúng `permissionCodes`; test tài khoản bị thiếu một quyền nhận 403. Người dùng vừa đổi role phải login lại để token nhận quyền mới. |
| 4 | Users | `POST create-account` (gán `roleId`) → login bằng user mới → `my-profile` → `PUT /api/users` → admin `GET /api/users`, `search`, `statistics`, `GET /{id}`, `update-by-admin`, `update-status`, `DELETE` | Xác nhận quyền thực thi theo `payload.permissions`, không theo tên role; không xóa tài khoản dùng cho các luồng sau. |
| 5 | Notifications/AuditLogs/Logs | Sau một thao tác ghi dữ liệu: `GET notifications` → mark-read/mark-all-read → `GET audit-logs` → `GET audit-logs/{id}`; cuối cùng test `GET /api/logs`, view/download nếu có quyền | Thông báo và audit (nếu nghiệp vụ tạo) có bản ghi tương ứng; log không lộ cho user không quyền. |

## 2. Dữ liệu nền và nội dung

Chạy theo thứ tự để tránh thiếu khóa tham chiếu:

1. **UyBan:** `POST /api/uy-ban` → `GET /api/uy-ban` → `PUT /api/uy-ban/{id}`.
2. **LinhVuc:** `POST /api/linh-vuc` → `GET pagination`/`GET {id}` → `PUT {id}` → `PUT update-status/{id}` → `GET count-thu-tuc` → `DELETE {id}` (chỉ bản ghi thử chưa được dùng).
3. **ThuTuc:** `POST /api/thu-tuc` (dùng `linhVucId` vừa tạo) → `GET {id}`, `GET {id}/thanh-phan`, `GET search`, `GET all` → `PUT {id}` → `PUT update-status/{id}` → `GET {id}/mau-don` → `DELETE {id}`.
4. **MauDon:** `POST /api/mau-don` (gắn thủ tục) → `GET`, `GET paging`, `GET {id}` → `PUT {id}` → `PUT update-status/{id}` → `DELETE {id}`.
5. **CoSoDichVuCong:** `POST` → `GET`, `GET pagination`, `GET {id}` → `PUT {id}` → `PUT update-status/{id}` → `DELETE {id}`.
6. **DanhMucTinTuc:** `POST` → `GET`, pagination, `GET {id}`, count → `PUT` → update-status. Sau đó **TinTuc:** upload tệp (nếu có) → `POST /api/tin-tuc` → `GET`, `GET {id}`, `GET view/{id}`, statistics → `PUT`, update-status → `DELETE` bản ghi thử.
7. **LichTiepDan:** lấy `GET template` → import file hợp lệ và một file sai → `POST` → `GET`, pagination, count, `GET {id}` → `PUT` → update-status → `DELETE` dữ liệu test không còn tham chiếu.
8. **LinhVucPhanAnh:** `POST` → list/detail/search → `PUT` → update-status → `DELETE` khi không còn dùng.

Mỗi CRUD phải có tối thiểu: case hợp lệ, body thiếu trường bắt buộc, ID không tồn tại và user thiếu quyền. Không thực hiện delete trên dữ liệu nghiệp vụ thật.

## 3. Luồng phản ánh và đánh giá phản ánh

1. Lấy danh mục qua `GET /api/phan-anh/muc-do-trang-thai-linh-vuc`, `GET /muc-do`, `GET /trang-thai`.
2. Tạo phản ánh: `POST /api/phan-anh/public/create` (công dân) hoặc `POST /api/phan-anh` (đã login). Lưu `idPhanAnh` và `maPhanAnh`.
3. Kiểm tra: `GET /api/phan-anh/{maPhanAnh}/for-mobile` → `GET /api/phan-anh/{idPhanAnh}` → `GET /api/phan-anh/user/me` → `GET /api/phan-anh` và `search-by-tieu-de`.
4. Cán bộ: `GET /{idPhanAnh}/nguoi-xu-ly` → `PUT /assign/{idPhanAnh}` → `PUT update-linh-vuc`/`update-muc-do` nếu được phép → `PUT update-status`. Sau mỗi cập nhật gọi `GET /{idPhanAnh}/lich-su-trang-thai` để đối chiếu lịch sử.
5. Gia hạn (nếu phản ánh đủ điều kiện): `POST /extension/request` → list/detail → leader `PUT approve` **hoặc** `reject` → list/export. Hai nhánh phải dùng hai đề nghị khác nhau.
6. Báo cáo/xuất: `GET tong-quan` → report list/detail/theo-thang → export report; `POST export-excel` hoặc `POST /api/export/phan-anh` → list file → download → delete file thử.
7. Đánh giá công dân: sau khi phản ánh ở trạng thái đã giải quyết, `GET /api/phan-anh-ratings/configuration` → `GET by-code/{complaintCode}` → `POST /api/phan-anh-ratings` → gọi lại `by-code` để xác nhận đã đánh giá. Test gửi lần hai phải bị chặn; admin/lãnh đạo kiểm tra list/detail/statistics theo phạm vi.
8. Video: nếu phản ánh có video, `POST /api/video/upload` → `GET /api/video/{idVideo}`; test MIME/kích thước không hợp lệ.

## 4. Luồng tiếp dân tại quầy và iPad

1. **Lịch/quầy/phân công:** `GET /api/reception-schedules` → `GET /api/reception-counters`/`{id}` → `GET /api/reception-counter-assignments` → `PUT /api/reception-shifts/{shiftId}/counter-assignments` → GET lại theo `shiftId` → PATCH một phân công hoặc quầy. Xác nhận ca có cán bộ/quầy đúng.
2. **Đăng ký:** `GET /api/reception-registrations` → `GET /{id}`. Dùng bản ghi `PENDING` khác nhau cho hai nhánh: `PATCH /{id}/approve` và `PATCH /{id}/reject`.
3. **Hoàn thành:** với bản ghi đã được duyệt và đang xử lý đúng điều kiện, `PATCH /{id}/complete`; GET lại, xác nhận trạng thái hoàn thành. Gọi complete với `PENDING`/`APPROVED` không đúng trạng thái phải thất bại.
4. **Đánh giá iPad (luồng hiện hành):** `GET /api/reception-ratings/configuration` → `POST /api/reception-ratings` (nhập thủ công đúng registration hoàn thành) → `GET /api/reception-ratings/{id}` → `GET` list/statistics bằng user có quyền. Gửi lại cùng registration phải bị chặn.
5. **Luồng cũ chỉ tương thích:** `GET /api/reception-registrations/rating-lookup/{receptionCode}` chỉ chạy với mã COMPLETED, quầy `QUAY_1`–`QUAY_8`, chưa đánh giá. Đây không phải luồng iPad mới.

Các ví dụ DEV cho tiếp dân nằm sẵn trong Swagger/seed; chỉ dùng khi môi trường DEV đã seed. Không dùng mã demo để kết luận môi trường khác hoạt động.

## 5. Luồng gặp lãnh đạo và đánh giá

1. **Lịch:** leader `POST /api/leader-meeting-schedules/management` → `GET management` → `GET management/{id}` → `PUT management/{id}` → `PUT management/{id}/status`; kiểm tra mobile bằng `GET /api/leader-meeting-schedules`. Dùng lịch khác, chưa có đơn để test `DELETE`.
2. **Đăng ký công dân:** `GET /api/leader-meeting-schedules` → tùy luồng thử `POST ocr/cccd` → `POST /api/leader-meeting-registrations`; lưu `registrationId`, mã và attachment. `POST lookup` và `GET /{id}` phải trả đúng đơn; dùng `GET attachments/{attachmentId}` nếu có tệp.
3. **Máy trạng thái:** dùng **năm đơn khác nhau**: `PENDING → approve`; `PENDING → reject`; `APPROVED → process → complete`; `APPROVED → cancel`; một đơn `COMPLETED` chỉ để xem chi tiết/đánh giá. Không kỳ vọng `complete` chạy trực tiếp từ `APPROVED`; nó yêu cầu `IN_PROGRESS` và kết quả xử lý hợp lệ.
4. **Đánh giá:** `GET /api/leader-meeting-ratings/configuration` → `POST /api/leader-meeting-ratings` cho đơn COMPLETED chưa đánh giá → list/detail/statistics. Lần gửi thứ hai cho cùng đơn phải bị chặn.
5. Kiểm tra phân quyền list: user không có quyền xem toàn bộ chỉ được thấy dữ liệu trong phạm vi; thử truy cập `registrationId` ngoài phạm vi phải bị chặn/ẩn theo contract.

## 6. Kho tài liệu

Chạy riêng từng loại theo cùng vòng đời, không trộn ID: **Tài liệu văn hóa**, **tài liệu pháp luật**, rồi **tài liệu công khai**.

1. Tạo danh mục/phân nhóm/loại văn bản khi API hỗ trợ → tạo tài liệu → list paging/detail.
2. Cập nhật → update-status → approve **hoặc** reject → với bản ghi đã duyệt test unapprove.
3. Test quyền tải bằng `GET {id}/download`; tài liệu hạn chế/nội bộ phải bị chặn với token không đủ quyền.
4. Kiểm tra statistics/export → delete mềm → `GET deleted` → restore; chỉ test `force` trên dữ liệu vừa tạo và sau khi không còn cần dùng.
5. Chỉ gọi `ai-learn` với tài liệu hợp lệ và có cấu hình AI DEV; lỗi cấu hình bên ngoài phải ghi nhận là lỗi tích hợp, không phải pass API.

## 7. Kết thúc kiểm thử

1. Chạy `GET /api/audit-logs` với khoảng thời gian vừa test để đối chiếu các thao tác nhạy cảm.
2. Xóa hoặc khôi phục **chỉ dữ liệu test do mình tạo** theo API; không xóa seed/dữ liệu thật.
3. Logout, ghi bảng kết quả gồm: endpoint, vai trò/token, dữ liệu vào (đã che thông tin nhạy cảm), status, request ID/thời gian, actual result, expected result, PASS/FAIL và lỗi/ảnh Swagger.
4. Swagger Execute chỉ chứng minh API của môi trường đang chọn; download file, OCR, gửi notification, AI, cron và tích hợp Mobile cần bằng chứng runtime riêng.

## 8. Checklist đầy đủ từng endpoint

Danh sách dưới đây được trích trực tiếp từ OpenAPI hiện tại và giữ nguyên thứ tự path trong Swagger. Mỗi dòng là một ca bắt buộc; áp dụng đồng thời các điều kiện/ID/trạng thái của luồng nghiệp vụ ở phần 1–7.

### Auths

- [ ] `POST /api/auths/login` — Đăng nhập hệ thống. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `PUT /api/auths/refresh-token` — Refresh access token. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `POST /api/auths/logout` — User logout. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `POST /api/auths/logout-for-mobile` — User logout for mobile. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `PUT /api/auths/change-password` — Change user password. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `POST /api/auths/enable-or-disable-2fa` — Enable or disable two-factor authentication (2FA). Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `POST /api/auths/verify-2fa` — Verify Two-Factor Authentication (2FA). Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `POST /api/auths/send-otp` — Send OTP to email. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `PUT /api/auths/reset-password` — Reset user password using OTP. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `POST /api/auths/verify-enable-or-disable-2fa` — Verify enabling or disabling two-factor authentication (2FA). Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `POST /api/auths/login-with-captcha` — User login with captcha. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

### Users

- [ ] `GET /api/users/my-profile` — Lấy hồ sơ của tôi. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/users` — Lấy danh sách người dùng có phân trang. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/users` — Cập nhật hồ sơ người dùng. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `POST /api/users/create-account` — Tạo tài khoản người dùng mới (do admin thực hiện). Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/users/statistics` — Thống kê người dùng. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/users/update-by-admin` — Cập nhật hồ sơ người dùng bởi admin. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `DELETE /api/users/{userId}` — Xóa người dùng bởi admin. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `PUT /api/users/update-status/{userId}` — Cập nhật trạng thái hoạt động của người dùng bởi admin. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `PUT /api/users/fcm-token` — Cập nhật FCM token cho người dùng. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `GET /api/users/{id}` — Lấy thông tin người dùng theo ID. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/users/search` — Tìm kiếm người dùng. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/users/khu-pho` — Lấy danh sách user có vai trò Khu Phố. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/users/update-first-login` — Cập nhật mật khẩu lần đầu đăng nhập. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `GET /api/users/data/{key}` — Lấy dữ liệu mẫu theo khóa. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### MauDon

- [ ] `POST /api/mau-don` — Create Mau Don. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/mau-don` — Get All Mau Don. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/mau-don/{id}` — Update Mau Don. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `DELETE /api/mau-don/{id}` — Delete Mau Don. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `GET /api/mau-don/{id}` — Get Mau Don By ID. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/mau-don/update-status/{id}` — Update Mau Don Status. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `GET /api/mau-don/paging` — Get All Mau Don With Paging. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### UyBan

- [ ] `POST /api/uy-ban` — Tạo ủy ban mới. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/uy-ban` — Lấy ủy ban. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/uy-ban/{id}` — Cập nhật ủy ban. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

### ThuTuc

- [ ] `GET /api/thu-tuc` — Danh sách thủ tục với phân trang. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `POST /api/thu-tuc` — Tạo mới thủ tục. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/thu-tuc/{id}/mau-don` — Lấy danh sách mẫu đơn theo ID thủ tục. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/thu-tuc/{id}` — Lấy thủ tục theo ID. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `DELETE /api/thu-tuc/{id}` — Xóa vĩnh viễn thủ tục theo ID. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `PUT /api/thu-tuc/{id}` — Cập nhật thủ tục theo ID. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `GET /api/thu-tuc/all` — Lấy danh sách thủ tục cho mobile. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/thu-tuc/update-status/{id}` — Cập nhật trạng thái hoạt động của thủ tục theo ID. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `GET /api/thu-tuc/{id}/thanh-phan` — Lấy thành phần thủ tục theo ID thủ tục. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/thu-tuc/search` — Tìm kiếm thủ tục hành chính. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### CoSoDichVuCong

- [ ] `GET /api/co-so-dich-vu-cong` — Lấy danh sách Cơ sở dịch vụ công. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `POST /api/co-so-dich-vu-cong` — Tạo mới một Cơ sở dịch vụ công. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/co-so-dich-vu-cong/pagination` — Lấy danh sách Cơ sở dịch vụ công. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/co-so-dich-vu-cong/{id}` — Lấy Cơ sở dịch vụ công theo ID. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/co-so-dich-vu-cong/{id}` — Cập nhật thông tin Cơ sở dịch vụ công. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `DELETE /api/co-so-dich-vu-cong/{id}` — Xóa vĩnh viễn Cơ sở dịch vụ công theo ID. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `PUT /api/co-so-dich-vu-cong/update-status/{id}` — Cập nhật trạng thái hoạt động của Cơ sở dịch vụ công. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

### LinhVuc

- [ ] `GET /api/linh-vuc` — Lấy danh sách lĩnh vực. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `POST /api/linh-vuc` — Tạo mới lĩnh vực. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/linh-vuc/pagination` — Lấy danh sách lĩnh vực. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/linh-vuc/count-thu-tuc` — Thống kê tổng số thủ tục theo từng lĩnh vực. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/linh-vuc/{id}` — Cập nhật lĩnh vực. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `DELETE /api/linh-vuc/{id}` — Xóa lĩnh vực. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `GET /api/linh-vuc/{id}` — Lấy thông tin lĩnh vực theo ID. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/linh-vuc/update-status/{id}` — Cập nhật trạng thái hoạt động của lĩnh vực. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

### TinTuc

- [ ] `POST /api/tin-tuc/upload` — Upload tệp đính kèm cho tin tức. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `PUT /api/tin-tuc/{id}` — Cập nhật tin tức. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `GET /api/tin-tuc/{id}` — Lấy chi tiết tin tức. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `DELETE /api/tin-tuc/{id}` — Xóa vĩnh viễn tin tức theo ID. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `GET /api/tin-tuc` — Lấy danh sách tin tức. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `POST /api/tin-tuc` — Tạo mới tin tức. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `PUT /api/tin-tuc/update-status/{id}` — Cập nhật trạng thái hoạt động của tin tức. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `GET /api/tin-tuc/view/{id}` — Lấy tin tức để xem. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/tin-tuc/statistics` — Thống kê tin tức. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### DanhMucTinTuc

- [ ] `POST /api/danh-muc-tin-tuc` — Tạo mới danh mục tin tức. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/danh-muc-tin-tuc` — Lấy danh sách danh mục tin tức. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/danh-muc-tin-tuc/pagination` — Lấy danh sách danh mục tin tức có phân trang. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/danh-muc-tin-tuc/count-tin-tuc` — Đếm số lượng tin tức theo danh mục. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/danh-muc-tin-tuc/{id}` — Cập nhật danh mục tin tức. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `DELETE /api/danh-muc-tin-tuc/{id}` — Xóa danh mục tin tức. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `GET /api/danh-muc-tin-tuc/{id}` — Lấy thông tin chi tiết danh mục tin tức. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/danh-muc-tin-tuc/update-status/{id}` — Cập nhật trạng thái hoạt động của danh mục tin tức. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

### LichTiepDan

- [ ] `POST /api/lich-tiep-dan/import` — Import lịch tiếp dân từ file Excel. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/lich-tiep-dan` — Lấy danh sách lịch tiếp dân với các bộ lọc. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `POST /api/lich-tiep-dan` — Tạo mới lịch tiếp dân. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/lich-tiep-dan/pagination` — Lấy danh sách lịch tiếp dân với các bộ lọc. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/lich-tiep-dan/count` — Đếm tổng số lịch tiếp dân (có thể áp dụng bộ lọc). Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `DELETE /api/lich-tiep-dan/{id}` — Xoá lịch tiếp dân theo ID. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `GET /api/lich-tiep-dan/{id}` — Lấy lịch tiếp dân theo ID. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/lich-tiep-dan/{id}` — Cập nhật lịch tiếp dân theo ID. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `PUT /api/lich-tiep-dan/update-status/{id}` — Cập nhật trạng thái hoạt động của lịch tiếp dân. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `GET /api/lich-tiep-dan/template` — Lấy template lịch tiếp dân. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### LinhVucPhanAnh

- [ ] `POST /api/linh-vuc-phan-anh` — Tạo lĩnh vực phản ánh mới. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/linh-vuc-phan-anh` — Lấy danh sách lĩnh vực phản ánh. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/linh-vuc-phan-anh/{id}` — Cập nhật lĩnh vực phản ánh. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `GET /api/linh-vuc-phan-anh/{id}` — Lấy chi tiết lĩnh vực phản ánh theo ID. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `DELETE /api/linh-vuc-phan-anh/{id}` — Xóa lĩnh vực phản ánh. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `PUT /api/linh-vuc-phan-anh/update-status/{id}` — Cập nhật trạng thái hoạt động của lĩnh vực phản ánh. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `GET /api/linh-vuc-phan-anh/search` — Tìm kiếm lĩnh vực phản ánh theo tên. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### PhanAnh

- [ ] `POST /api/phan-anh` — Tạo phản ánh mới (yêu cầu đăng nhập). Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/phan-anh` — Lấy danh sách phản ánh với phân trang và lọc sử dụng trên web. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/phan-anh/{maPhanAnh}/for-mobile` — Lấy thông tin phản ánh theo mã phản ánh cho mobile. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `POST /api/phan-anh/export-excel` — Xuất Excel danh sách phản ánh theo phạm vi được cấp. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/phan-anh/{idPhanAnh}/lich-su-trang-thai` — Lấy lịch sử trạng thái của phản ánh. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/phan-anh/user/me` — Lấy danh sách phản ánh của người dùng hiện tại. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/phan-anh/muc-do` — Lấy mức độ phản ánh. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/phan-anh/trang-thai` — Lấy trạng thái phản ánh. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/phan-anh/{idPhanAnh}` — Lấy phản ánh theo ID sử dụng trên web. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/phan-anh/update-status/{idPhanAnh}` — Cập nhật trạng thái phản ánh. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `PUT /api/phan-anh/update-muc-do/{idPhanAnh}` — Đổi mức độ phản ánh. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `PUT /api/phan-anh/update-linh-vuc/{idPhanAnh}` — Cập nhật lĩnh vực phản ánh. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `GET /api/phan-anh/tong-quan` — Lấy thống kê tổng quan phản ánh. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### PhanAnhExtension

- [ ] `POST /api/phan-anh/extension/request` — Gửi đề nghị gia hạn phản ánh. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/phan-anh/extension` — Lấy danh sách đề nghị gia hạn. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/phan-anh/extension/export-excel` — Xuất Excel quản lý gia hạn phản ánh. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/phan-anh/extension/{id}` — Lấy chi tiết đề nghị gia hạn. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/phan-anh/extension/{id}/approve` — Phê duyệt đề nghị gia hạn. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `PUT /api/phan-anh/extension/{id}/reject` — Từ chối đề nghị gia hạn. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

### PhanAnh

- [ ] `GET /api/phan-anh/{idPhanAnh}/nguoi-xu-ly` — Lấy danh sách chuyên viên có thể xử lý phản ánh. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/phan-anh/assign/{idPhanAnh}` — Phân công hoặc chuyển phản ánh. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `GET /api/phan-anh/muc-do-trang-thai-linh-vuc` — Lấy mức độ và trạng thái phản ánh. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/phan-anh/search-by-tieu-de` — Tìm kiếm phản ánh theo tiêu đề. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `POST /api/phan-anh/public/create` — Tạo phản ánh mới từ công dân (không cần đăng nhập). Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

### PhanAnhRating

- [ ] `GET /api/phan-anh-ratings` — Lấy danh sách đánh giá phản ánh theo phạm vi lĩnh vực. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `POST /api/phan-anh-ratings` — Người dân gửi đánh giá phản ánh. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/phan-anh-ratings/configuration` — Lấy cấu hình đánh giá phản ánh cho người dân. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/phan-anh-ratings/by-code/{complaintCode}` — Kiểm tra và lấy thông tin đánh giá của phản ánh theo mã. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/phan-anh-ratings/statistics` — Thống kê đánh giá phản ánh theo phạm vi lĩnh vực. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/phan-anh-ratings/{id}` — Lấy chi tiết đánh giá phản ánh. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### VideoUpload

- [ ] `POST /api/video/upload` — Tải video phản ánh. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/video/{idVideo}` — Lấy thông tin video đã tải. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### Report

- [ ] `GET /api/report/phan-anh` — Lấy báo cáo phản ánh. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/report/thu-tuc` — Lấy báo cáo thủ tục hành chính. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/report/tin-tuc` — Lấy báo cáo tin tức. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/report/phan-anh/export` — Xuất báo cáo phản ánh ra file Excel. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/report/thu-tuc/export` — Xuất báo cáo thủ tục hành chính ra file Excel. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/report/tin-tuc/export` — Xuất báo cáo tin tức ra file Excel. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/report/phan-anh/theo-thang` — Lấy báo cáo phản ánh theo tháng. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/report/phan-anh/chi-tiet` — Lấy chi tiết phản ánh. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/report/phan-anh/chi-tiet/export` — Xuất chi tiết phản ánh ra Excel. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/report/danh-gia/export` — Xuất danh sách đánh giá ra Excel. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### Role

- [ ] `GET /api/role` — Lấy tất cả role. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `POST /api/role` — Tạo vai trò mới. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/role/pagination` — Lấy tất cả vai trò với phân trang. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/role/{roleId}` — Lấy chi tiết vai trò. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/role/{roleId}` — Cập nhật vai trò. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `DELETE /api/role/{roleId}` — Xóa vai trò. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `PUT /api/role/update-status/{roleId}` — Cập nhật trạng thái vai trò. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

### Permission

- [ ] `GET /api/permission` — Lấy tất cả quyền. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/permission/cate` — Lấy danh mục quyền. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### Notifications

- [ ] `GET /api/notifications` — Lấy danh sách thông báo của người dùng. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `POST /api/notifications/mark-all-read` — Đánh dấu tất cả thông báo đã đọc. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `DELETE /api/notifications/{id}` — Xóa thông báo theo ID. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `POST /api/notifications/{id}/mark-read` — Đánh dấu thông báo đã đọc theo ID. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

### AuditLogs

- [ ] `GET /api/audit-logs` — Lấy danh sách nhật ký hệ thống. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/audit-logs/{id}` — Lấy chi tiết nhật ký hệ thống. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### Export

- [ ] `POST /api/export/phan-anh` — Tạo yêu cầu xuất ZIP phản ánh. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/export/phan-anh` — Lấy danh sách file ZIP phản ánh đã xuất. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/export/phan-anh/{fileName}/download` — Tải file ZIP phản ánh đã xuất. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `DELETE /api/export/phan-anh/{fileName}/delete` — Xóa file ZIP phản ánh đã xuất. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

### AddressVote

- [ ] `POST /api/address-vote/import` — Import address vote file Excel. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

### ReceptionRegistration

- [ ] `GET /api/reception-registrations` — Lấy danh sách đăng ký tiếp dân dành cho cán bộ. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/reception-registrations/{id}` — Lấy chi tiết đăng ký tiếp dân dành cho cán bộ. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PATCH /api/reception-registrations/{id}/approve` — Phê duyệt đăng ký tiếp dân. Dùng bản ghi test ở đúng trạng thái; gọi rồi GET/list xác nhận chuyển trạng thái. Thử sai trạng thái, ID sai và token thiếu quyền.

- [ ] `PATCH /api/reception-registrations/{id}/complete` — Xác nhận hoàn thành buổi tiếp dân. Dùng bản ghi test ở đúng trạng thái; gọi rồi GET/list xác nhận chuyển trạng thái. Thử sai trạng thái, ID sai và token thiếu quyền.

- [ ] `PATCH /api/reception-registrations/{id}/reject` — Từ chối đăng ký tiếp dân đang chờ. Dùng bản ghi test ở đúng trạng thái; gọi rồi GET/list xác nhận chuyển trạng thái. Thử sai trạng thái, ID sai và token thiếu quyền.

- [ ] `GET /api/reception-registrations/rating-lookup/{receptionCode}` — [Luồng cũ] Tra cứu đăng ký đã hoàn thành để đánh giá trên iPad. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### ReceptionSchedule

- [ ] `GET /api/reception-schedules` — Lấy lịch tiếp dân đang hoạt động dành cho Mobile. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### ReceptionRating

- [ ] `GET /api/reception-ratings` — Lấy danh sách đánh giá tiếp dân dành cho lãnh đạo. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `POST /api/reception-ratings` — Gửi đánh giá tiếp dân nhập thủ công từ iPad. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/reception-ratings/configuration` — Lấy cấu hình đánh giá tiếp dân dành cho iPad. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/reception-ratings/{id}` — Lấy chi tiết đánh giá tiếp dân dành cho lãnh đạo. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/reception-ratings/statistics` — Lấy thống kê cơ bản về đánh giá tiếp dân. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### ReceptionCounter

- [ ] `GET /api/reception-counters` — Lấy danh sách quầy tiếp dân. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/reception-counters/{id}` — Lấy chi tiết quầy tiếp dân. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PATCH /api/reception-counters/{id}` — Cập nhật quầy tiếp dân. Dùng bản ghi test ở đúng trạng thái; gọi rồi GET/list xác nhận chuyển trạng thái. Thử sai trạng thái, ID sai và token thiếu quyền.

### ReceptionCounterAssignment

- [ ] `GET /api/reception-counter-assignments` — Lấy danh sách phân công cán bộ - quầy. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/reception-counter-assignments/{id}` — Lấy chi tiết phân công cán bộ - quầy. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PATCH /api/reception-counter-assignments/{id}` — Cập nhật một phân công cán bộ - quầy. Dùng bản ghi test ở đúng trạng thái; gọi rồi GET/list xác nhận chuyển trạng thái. Thử sai trạng thái, ID sai và token thiếu quyền.

- [ ] `DELETE /api/reception-counter-assignments/{id}` — Xóa mềm một phân công cán bộ - quầy. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `PUT /api/reception-shifts/{shiftId}/counter-assignments` — Thiết lập phân công cán bộ - quầy cho một ca. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

### LeaderMeetingSchedule

- [ ] `PUT /api/leader-meeting-schedules/management/{id}/status` — Bật hoặc tắt lịch gặp lãnh đạo. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `GET /api/leader-meeting-schedules/management/{id}` — Lấy chi tiết lịch gặp lãnh đạo. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/leader-meeting-schedules/management/{id}` — Cập nhật lịch gặp lãnh đạo chưa có đơn. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `DELETE /api/leader-meeting-schedules/management/{id}` — Xóa mềm lịch gặp lãnh đạo chưa có đơn. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `GET /api/leader-meeting-schedules/management` — Lấy danh sách lịch gặp lãnh đạo theo quyền. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `POST /api/leader-meeting-schedules/management` — Lãnh đạo tự tạo lịch gặp công dân. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/leader-meeting-schedules` — Lấy lịch gặp lãnh đạo khả dụng cho Mobile. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### LeaderMeetingRegistration

- [ ] `POST /api/leader-meeting-registrations/ocr/cccd` — Đọc thông tin CCCD bằng OCR. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `POST /api/leader-meeting-registrations/lookup` — Tra cứu đăng ký gặp lãnh đạo. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/leader-meeting-registrations` — Lấy danh sách đăng ký gặp lãnh đạo theo quyền. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `POST /api/leader-meeting-registrations` — Gửi đăng ký gặp lãnh đạo từ Mobile. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/leader-meeting-registrations/{id}` — Xem chi tiết đăng ký gặp lãnh đạo. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PATCH /api/leader-meeting-registrations/{id}/approve` — Phê duyệt đăng ký gặp lãnh đạo. Dùng bản ghi test ở đúng trạng thái; gọi rồi GET/list xác nhận chuyển trạng thái. Thử sai trạng thái, ID sai và token thiếu quyền.

- [ ] `PATCH /api/leader-meeting-registrations/{id}/reject` — Từ chối đăng ký gặp lãnh đạo. Dùng bản ghi test ở đúng trạng thái; gọi rồi GET/list xác nhận chuyển trạng thái. Thử sai trạng thái, ID sai và token thiếu quyền.

- [ ] `PATCH /api/leader-meeting-registrations/{id}/process` — Bắt đầu xử lý đăng ký gặp lãnh đạo. Dùng bản ghi test ở đúng trạng thái; gọi rồi GET/list xác nhận chuyển trạng thái. Thử sai trạng thái, ID sai và token thiếu quyền.

- [ ] `PATCH /api/leader-meeting-registrations/{id}/complete` — Hoàn thành đăng ký gặp lãnh đạo. Dùng bản ghi test ở đúng trạng thái; gọi rồi GET/list xác nhận chuyển trạng thái. Thử sai trạng thái, ID sai và token thiếu quyền.

- [ ] `PATCH /api/leader-meeting-registrations/{id}/cancel` — Hủy đăng ký gặp lãnh đạo. Dùng bản ghi test ở đúng trạng thái; gọi rồi GET/list xác nhận chuyển trạng thái. Thử sai trạng thái, ID sai và token thiếu quyền.

- [ ] `GET /api/leader-meeting-registrations/{id}/attachments/{attachmentId}` — Xem hoặc tải tệp của đăng ký gặp lãnh đạo. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### LeaderMeetingRating

- [ ] `GET /api/leader-meeting-ratings` — Lấy danh sách đánh giá gặp lãnh đạo theo quyền. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `POST /api/leader-meeting-ratings` — Gửi đánh giá buổi gặp lãnh đạo từ iPad. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `GET /api/leader-meeting-ratings/configuration` — Lấy cấu hình đánh giá gặp lãnh đạo trên iPad. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/leader-meeting-ratings/statistics` — Thống kê đánh giá gặp lãnh đạo theo quyền. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/leader-meeting-ratings/{id}` — Xem chi tiết đánh giá gặp lãnh đạo. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### TaiLieuVanHoa

- [ ] `GET /api/tai-lieu-van-hoa/paging` — Lấy danh sách tài liệu văn hóa (phân trang). Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/tai-lieu-van-hoa/sub-categories` — Lấy danh sách phân nhóm văn hóa - lịch sử. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `POST /api/tai-lieu-van-hoa/sub-categories` — Thêm phân nhóm văn hóa - lịch sử. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `PUT /api/tai-lieu-van-hoa/sub-categories/{id}` — Cập nhật phân nhóm văn hóa - lịch sử. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `DELETE /api/tai-lieu-van-hoa/sub-categories/{id}` — Xóa phân nhóm văn hóa - lịch sử. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `GET /api/tai-lieu-van-hoa/{id}` — Lấy chi tiết tài liệu văn hóa. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/tai-lieu-van-hoa/{id}` — Cập nhật tài liệu văn hóa. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `DELETE /api/tai-lieu-van-hoa/{id}` — Xóa tài liệu văn hóa. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `POST /api/tai-lieu-van-hoa` — Tạo mới tài liệu văn hóa. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `PUT /api/tai-lieu-van-hoa/update-status/{id}` — Cập nhật trạng thái tài liệu văn hóa. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `POST /api/tai-lieu-van-hoa/ai-learn/{id}` — Đồng bộ AI cho tài liệu văn hóa. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `PUT /api/tai-lieu-van-hoa/approve/{id}` — Phê duyệt tài liệu văn hóa. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `PUT /api/tai-lieu-van-hoa/reject/{id}` — Từ chối tài liệu văn hóa. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `PUT /api/tai-lieu-van-hoa/unapprove/{id}` — Hoàn tác phê duyệt tài liệu văn hóa. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `GET /api/tai-lieu-van-hoa/statistics` — Thống kê tài liệu văn hóa. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/tai-lieu-van-hoa/deleted` — Lấy danh sách tài liệu văn hóa đã xóa. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/tai-lieu-van-hoa/export` — Xuất tài liệu văn hóa ra Excel. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/tai-lieu-van-hoa/restore/{id}` — Khôi phục tài liệu văn hóa. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `DELETE /api/tai-lieu-van-hoa/force/{id}` — Xóa vĩnh viễn tài liệu văn hóa. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `GET /api/tai-lieu-van-hoa/{id}/download` — Download tài liệu văn hóa. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `DELETE /api/tai-lieu-van-hoa/{id}/media/{mediaId}` — Xóa media đính kèm tài liệu văn hóa. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

### TaiLieuPhapLuat

- [ ] `GET /api/tai-lieu-phap-luat/paging` — Lấy danh sách tài liệu pháp luật (phân trang). Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/tai-lieu-phap-luat/{id}` — Lấy chi tiết tài liệu pháp luật. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/tai-lieu-phap-luat/{id}` — Cập nhật tài liệu pháp luật. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `DELETE /api/tai-lieu-phap-luat/{id}` — Xóa tài liệu pháp luật. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `POST /api/tai-lieu-phap-luat` — Tạo mới tài liệu pháp luật. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `PUT /api/tai-lieu-phap-luat/update-status/{id}` — Cập nhật trạng thái tài liệu pháp luật. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `POST /api/tai-lieu-phap-luat/ai-learn/{id}` — Đồng bộ AI cho tài liệu pháp luật. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `PUT /api/tai-lieu-phap-luat/approve/{id}` — Phê duyệt tài liệu pháp luật. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `PUT /api/tai-lieu-phap-luat/reject/{id}` — Từ chối tài liệu pháp luật. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `PUT /api/tai-lieu-phap-luat/unapprove/{id}` — Hoàn tác phê duyệt tài liệu pháp luật. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `GET /api/tai-lieu-phap-luat/statistics` — Thống kê tài liệu pháp luật. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/tai-lieu-phap-luat/deleted` — Lấy danh sách tài liệu pháp luật đã xóa. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/tai-lieu-phap-luat/export` — Xuất tài liệu pháp luật ra Excel. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `PUT /api/tai-lieu-phap-luat/restore/{id}` — Khôi phục tài liệu pháp luật. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `DELETE /api/tai-lieu-phap-luat/force/{id}` — Xóa vĩnh viễn tài liệu pháp luật. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `GET /api/tai-lieu-phap-luat/doc-types` — Lấy danh sách loại văn bản pháp luật. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `POST /api/tai-lieu-phap-luat/doc-types` — Thêm loại văn bản pháp luật. Gửi Example Value hợp lệ; lưu ID/mã trả về và GET/list để xác nhận. Thử body thiếu/sai và gửi lặp khi có ràng buộc.

- [ ] `PUT /api/tai-lieu-phap-luat/doc-types/{id}` — Cập nhật loại văn bản pháp luật. Dùng bản ghi test đang tồn tại; cập nhật rồi GET/list xác nhận. Thử body sai, ID không tồn tại và token thiếu quyền.

- [ ] `DELETE /api/tai-lieu-phap-luat/doc-types/{id}` — Xóa loại văn bản pháp luật. Chỉ dùng bản ghi test không còn phụ thuộc; xóa rồi GET/list xác nhận. Thử ID sai và token thiếu quyền.

- [ ] `GET /api/tai-lieu-phap-luat/issuing-agencies` — Lấy danh sách cơ quan ban hành. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/tai-lieu-phap-luat/{id}/download` — Download tài liệu pháp luật. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### TaiLieuCongKhai

- [ ] `GET /api/tai-lieu-cong-khai/paging` — Lấy danh sách tài liệu công khai (phân trang). Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/tai-lieu-cong-khai/{id}` — Lấy chi tiết tài liệu công khai. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/tai-lieu-cong-khai/categories` — Lấy danh mục tài liệu công khai. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/tai-lieu-cong-khai/{id}/download` — Lấy đường dẫn tải tài liệu công khai. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

### Logs

- [ ] `GET /api/logs` — Lấy danh sách file log. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/logs/view/{fileName}` — Xem nội dung file log. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.

- [ ] `GET /api/logs/download/{fileName}` — Tải file log. Gọi với dữ liệu hợp lệ; đối chiếu dữ liệu/schema. Thử token thiếu quyền và tham số/ID không hợp lệ.
