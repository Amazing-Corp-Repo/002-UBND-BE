# Master flow test API: thứ tự chạy và dữ liệu vào/ra

Tài liệu này là **thứ tự chạy** chứ không phải danh sách endpoint độc lập. Mỗi biến ở cột `Đầu ra dùng tiếp` phải được ghi lại và dùng ở bước sau. Chạy trên DEV, chỉ xóa dữ liệu có tiền tố test như `SWG-TST-<ngày>-...`.

## Quy ước dữ liệu

| Biến | Lấy ở đâu | Dùng tiếp ở đâu |
|---|---|---|
| `adminToken` | Login tài khoản admin có sẵn | Khởi tạo quyền, role, user và dữ liệu nền |
| `officerToken`, `leaderToken`, `citizenToken` | Login các user tạo ở Flow 1 | Kiểm tra RBAC và nghiệp vụ tương ứng |
| `roleId`, `userId` | Tạo role/user | Gán quyền, cập nhật/xóa user |
| `linhVucId`, `thuTucId`, `mauDonId` | Tạo dữ liệu hành chính | Test quan hệ thủ tục–mẫu đơn |
| `categoryId`, `newsId`, `fileId` | Tạo danh mục/tin/tệp | Test tin tức, download/delete |
| `phanAnhId`, `maPhanAnh`, `extensionId`, `ratingId` | Tạo phản ánh | Xử lý, gia hạn, đánh giá, báo cáo/xuất |
| `shiftId`, `counterId`, `assignmentId`, `receptionId`, `receptionCode` | Dữ liệu tiếp dân DEV | Phân công, duyệt/hoàn thành, đánh giá |
| `meetingScheduleId`, `meetingRegistrationId`, `attachmentId`, `meetingRatingId` | Lịch/đơn gặp lãnh đạo | Chuyển trạng thái, tải tệp, đánh giá |
| `documentId`, `mediaId`, `docTypeId`, `subCategoryId` | Tạo tài liệu | Duyệt, tải, xóa mềm/khôi phục/xóa vĩnh viễn |

Mỗi API ghi dữ liệu phải có tối thiểu ba case: thành công, input không hợp lệ và token thiếu quyền. API chuyển trạng thái dùng **bản ghi riêng cho từng nhánh**, không tái sử dụng một ID đã đổi trạng thái.

## Flow 0 — Mở phiên và token gốc

1. `POST /api/auths/login` bằng admin có sẵn → lưu `adminToken`, `refreshToken`.
2. `GET /api/users/my-profile` với `adminToken` → xác nhận token/permission thực tế.
3. `PUT /api/auths/refresh-token` → lưu access token mới, gọi lại `GET /api/users/my-profile`.
4. Không logout token admin đang dùng. `POST /api/auths/logout` chỉ chạy cuối flow với một user test riêng.

## Flow 1 — Quyền, role và bốn tài khoản test

1. Admin gọi `GET /api/permission/cate` → `GET /api/permission`; chọn permission codes cần cho officer, leader, citizen và role test tối thiểu.
2. `POST /api/role` → lưu `roleId`; `GET /api/role/{roleId}` → `GET /api/role` → `GET /api/role/pagination` để kiểm tra role vừa tạo.
3. `POST /api/users/create-account` bốn lần (officer, leader, citizen, user thiếu quyền) → lưu từng `userId`.
4. Login từng tài khoản bằng `POST /api/auths/login` → lưu bốn token; mỗi token gọi `GET /api/users/my-profile`.
5. Với user test: `PUT /api/users` → `PUT /api/users/fcm-token` → `PUT /api/users/update-first-login` (chỉ khi dữ liệu setup phù hợp) → login lại nếu đổi mật khẩu.
6. Admin chạy `GET /api/users`, `GET /api/users/search`, `GET /api/users/statistics`, `GET /api/users/{id}`, `GET /api/users/khu-pho`, `GET /api/users/data/{key}`, `PUT /api/users/update-by-admin`, `PUT /api/users/update-status/{userId}`.
7. Chỉ sau khi hoàn tất toàn bộ flow phụ thuộc mới: `DELETE /api/users/{userId}` và `DELETE /api/role/{roleId}`. Trước cleanup, test `PUT /api/role/{roleId}` và `PUT /api/role/update-status/{roleId}`; user được đổi role phải login lại.
8. Chạy riêng, không làm hỏng tài khoản đang dùng: `PUT /api/auths/change-password`, `POST /api/auths/enable-or-disable-2fa`, `POST /api/auths/verify-2fa`, `POST /api/auths/verify-enable-or-disable-2fa`, `POST /api/auths/send-otp`, `PUT /api/auths/reset-password`, `POST /api/auths/login-with-captcha`, `POST /api/auths/logout-for-mobile`, `POST /api/auths/logout`.

## Flow 2 — Dữ liệu hành chính cha → con

1. `POST /api/uy-ban` → lấy `uyBanId`; `GET /api/uy-ban` → `PUT /api/uy-ban/{id}`.
2. `POST /api/linh-vuc` → `linhVucId`; `GET /api/linh-vuc`, `GET /api/linh-vuc/pagination`, `GET /api/linh-vuc/{id}`.
3. `POST /api/thu-tuc` dùng `linhVucId` → `thuTucId`; sau đó `GET /api/thu-tuc`, `/all`, `/search`, `/{id}`, `/{id}/thanh-phan`.
4. `POST /api/mau-don` dùng `thuTucId` → `mauDonId`; sau đó `GET /api/mau-don`, `/paging`, `/{id}` và `GET /api/thu-tuc/{id}/mau-don` phải thấy mẫu đơn.
5. Cập nhật theo thứ tự con trước: `PUT /api/mau-don/{id}` → `PUT /api/mau-don/update-status/{id}` → `PUT /api/thu-tuc/{id}` → `PUT /api/thu-tuc/update-status/{id}` → `GET /api/linh-vuc/count-thu-tuc` → `PUT /api/linh-vuc/{id}` → `PUT /api/linh-vuc/update-status/{id}`.
6. Chỉ cleanup khi không còn tham chiếu: `DELETE /api/mau-don/{id}` → `DELETE /api/thu-tuc/{id}` → `DELETE /api/linh-vuc/{id}`.
7. Chạy độc lập: `POST /api/co-so-dich-vu-cong` → `GET`/`GET pagination`/`GET {id}` → `PUT {id}` → `PUT update-status/{id}` → `DELETE {id}`.

## Flow 3 — Danh mục tin tức → upload → tin tức

1. `POST /api/danh-muc-tin-tuc` → `categoryId`; `GET`, `GET pagination`, `GET count-tin-tuc`, `GET /{id}`.
2. `POST /api/tin-tuc/upload` → lưu thông tin file nếu response trả về.
3. `POST /api/tin-tuc` dùng `categoryId`/file → `newsId`; `GET /api/tin-tuc`, `GET /{id}`, `GET /view/{id}`, `GET /statistics`.
4. `PUT /api/tin-tuc/{id}` → `PUT /api/tin-tuc/update-status/{id}` → gọi `GET /api/danh-muc-tin-tuc/count-tin-tuc` để xác nhận quan hệ.
5. `PUT /api/danh-muc-tin-tuc/{id}` → `PUT update-status/{id}` → cleanup `DELETE /api/tin-tuc/{id}` → `DELETE /api/danh-muc-tin-tuc/{id}`.

## Flow 4 — Lịch tiếp dân, lĩnh vực phản ánh và import

1. `GET /api/lich-tiep-dan/template` → download template; test `POST /api/lich-tiep-dan/import` với file hợp lệ, sau đó một file sai.
2. `POST /api/lich-tiep-dan` → `scheduleLegacyId`; `GET`, `GET pagination`, `GET count`, `GET /{id}` → `PUT /{id}` → `PUT update-status/{id}` → cuối cùng `DELETE /{id}`.
3. `POST /api/linh-vuc-phan-anh` → `phanAnhFieldId`; `GET`, `GET /{id}`, `GET /search` → `PUT /{id}` → `PUT update-status/{id}`. Không xóa đến khi Flow 5 kết thúc.
4. `POST /api/address-vote/import` với file hợp lệ và file lỗi; giữ evidence response cho từng case.

## Flow 5 — Phản ánh: tạo → phân công → trạng thái → gia hạn → đánh giá

1. Chuẩn bị lookup: `GET /api/phan-anh/muc-do-trang-thai-linh-vuc`, `/muc-do`, `/trang-thai`.
2. Tạo hai phản ánh tách biệt: `POST /api/phan-anh/public/create` (công dân không token) và `POST /api/phan-anh` (citizenToken) → lưu `phanAnhId`, `maPhanAnh` cho từng bản ghi.
3. Kiểm tra đầu ra: `GET /api/phan-anh`, `GET /api/phan-anh/user/me`, `GET /api/phan-anh/{maPhanAnh}/for-mobile`, `GET /api/phan-anh/{idPhanAnh}`, `GET /api/phan-anh/search-by-tieu-de`.
4. Officer: `GET /api/phan-anh/{idPhanAnh}/nguoi-xu-ly` → `PUT /api/phan-anh/assign/{idPhanAnh}` → `PUT update-linh-vuc/{idPhanAnh}` → `PUT update-muc-do/{idPhanAnh}` → `PUT update-status/{idPhanAnh}`. Sau mỗi PUT: `GET /{idPhanAnh}/lich-su-trang-thai`.
5. Khi đủ điều kiện, `POST /api/phan-anh/extension/request` → `GET /extension`, `GET /extension/{id}`, `GET /extension/export-excel`. Dùng hai request: `PUT /extension/{id}/approve` và `PUT /extension/{id}/reject`.
6. Sau trạng thái đã giải quyết: `GET /api/phan-anh-ratings/configuration` → `GET /api/phan-anh-ratings/by-code/{complaintCode}` → `POST /api/phan-anh-ratings` → GET lại by-code. Lần POST thứ hai cùng phản ánh phải bị chặn. Người có quyền gọi `GET` list, `GET /{id}`, `GET /statistics`.
7. Video (nếu contract có file): `POST /api/video/upload` → `GET /api/video/{idVideo}`; chạy file hợp lệ và sai MIME/size.
8. Báo cáo/xuất sau khi có dữ liệu: `GET /api/phan-anh/tong-quan` → tất cả `GET /api/report/phan-anh`, `/thu-tuc`, `/tin-tuc`, `/phan-anh/theo-thang`, `/phan-anh/chi-tiet` → các endpoint export trong Report → `POST /api/phan-anh/export-excel`.
9. ZIP phản ánh: `POST /api/export/phan-anh` → `GET /api/export/phan-anh` → `GET /{fileName}/download` → `DELETE /{fileName}/delete`.
10. Khi không còn dùng: `DELETE /api/linh-vuc-phan-anh/{id}` chỉ với field test.

## Flow 6 — Tiếp dân: lịch/quầy/phân công → đăng ký → hoàn thành → iPad

1. `GET /api/reception-schedules` → chọn `shiftId`; `GET /api/reception-counters`, `GET /{counterId}` → `PATCH /api/reception-counters/{id}`.
2. `PUT /api/reception-shifts/{shiftId}/counter-assignments` → `GET /api/reception-counter-assignments` → `GET /{assignmentId}` → `PATCH /{assignmentId}`. Chỉ sau các test phụ thuộc chạy `DELETE /{assignmentId}`.
3. `GET /api/reception-registrations` → `GET /{id}`. Dùng ba registration khác nhau: PENDING-A cho `PATCH /approve`, PENDING-B cho `PATCH /reject`, và bản ghi được duyệt/xử lý cho `PATCH /complete`.
4. Sau complete, `GET /api/reception-ratings/configuration` → `POST /api/reception-ratings` với registration COMPLETED → `GET /api/reception-ratings/{id}` → `GET` danh sách và `/statistics` bằng leaderToken.
5. Luồng tương thích cũ chạy riêng: `GET /api/reception-registrations/rating-lookup/{receptionCode}` chỉ với mã COMPLETED, chưa đánh giá, đúng quầy; không dùng nó để kết luận luồng iPad hiện hành.

## Flow 7 — Gặp lãnh đạo: lịch → đơn → máy trạng thái → đánh giá

1. Leader: `POST /api/leader-meeting-schedules/management` → `meetingScheduleId` → `GET /management`, `GET /management/{id}` → `PUT /management/{id}` → `PUT /management/{id}/status` → mobile `GET /api/leader-meeting-schedules`. Lịch độc lập không có đơn: `DELETE /management/{id}`.
2. Citizen: chọn schedule/slot, gọi `POST /api/leader-meeting-registrations/ocr/cccd` (nếu có file CCCD) → `POST /api/leader-meeting-registrations` → `POST /lookup` → `GET /{id}` → `GET /{id}/attachments/{attachmentId}`.
3. Dùng **năm registration tách biệt**: `PENDING → PATCH approve`; `PENDING → PATCH reject`; `APPROVED → PATCH process → PATCH complete`; `APPROVED → PATCH cancel`; `COMPLETED` dành cho đánh giá/chi tiết. Không gọi complete từ APPROVED.
4. `GET /api/leader-meeting-ratings/configuration` → `POST /api/leader-meeting-ratings` cho registration COMPLETED chưa rating → `GET` list, `GET /{id}`, `GET /statistics`. POST lần hai phải bị chặn.

## Flow 8 — Thư viện văn hóa: dữ liệu phụ → tài liệu → duyệt → vòng đời xóa

1. `GET /api/tai-lieu-van-hoa/sub-categories` → `POST` → `subCategoryId` → `PUT /{id}`. Chỉ `DELETE` sau document cleanup.
2. `POST /api/tai-lieu-van-hoa` → `documentId`/`mediaId`; `GET /paging`, `GET /{id}` → `PUT /{id}` → `PUT update-status/{id}`.
3. Dùng document khác nhau cho `PUT approve/{id}`, `PUT reject/{id}`, `PUT unapprove/{id}`; sau mỗi action GET detail.
4. Sau tài liệu hợp lệ: `POST /ai-learn/{id}`; `GET /statistics`; `GET /export`; `GET /{id}/download`; `DELETE /{id}/media/{mediaId}` nếu đó là media test.
5. `DELETE /{id}` → `GET /deleted` → `PUT /restore/{id}` → lại `DELETE /{id}` → `DELETE /force/{id}` → `DELETE /sub-categories/{id}`.

## Flow 9 — Thư viện pháp luật: loại văn bản → tài liệu → duyệt → vòng đời xóa

1. `GET /api/tai-lieu-phap-luat/doc-types` → `POST` → `docTypeId` → `PUT /{id}`; `GET /issuing-agencies` để chọn dữ liệu tạo document.
2. `POST /api/tai-lieu-phap-luat` → `documentId`; `GET /paging`, `GET /{id}` → `PUT /{id}` → `PUT update-status/{id}`.
3. Trên các document tách biệt: `POST /ai-learn/{id}`, `PUT approve/{id}`, `PUT reject/{id}`, `PUT unapprove/{id}`; xác nhận bằng GET detail.
4. `GET /statistics`, `/export`, `/{id}/download` → `DELETE /{id}` → `GET /deleted` → `PUT /restore/{id}` → `DELETE /{id}` → `DELETE /force/{id}` → `DELETE /doc-types/{id}`.

## Flow 10 — Tài liệu công khai, thông báo, audit và log

1. Sau Flow 8–9: `GET /api/tai-lieu-cong-khai/categories` → `GET /paging` → `GET /{id}` → `GET /{id}/download`. Kiểm tra public không token và private/unauthorized theo contract.
2. Sau các thao tác tạo/cập nhật: `GET /api/notifications` → `POST /mark-all-read`; với notification riêng: `POST /{id}/mark-read` → `DELETE /{id}`.
3. `GET /api/audit-logs` với time range đã chạy → `GET /api/audit-logs/{id}`. Đối chiếu create/update/status/approve/reject với actor và timestamp.
4. User có quyền: `GET /api/logs` → `GET /view/{fileName}` → `GET /download/{fileName}`. Token không quyền phải không đọc được log.

## Flow 11 — Bằng chứng và cleanup cuối

1. Với mỗi endpoint, lưu request (đã che mật khẩu/token/CCCD), response status/body, role, ID đầu vào và ID đầu ra.
2. Chạy token thiếu quyền cho tối thiểu một endpoint GET, POST/PUT/PATCH và DELETE của mỗi domain; ghi 401/403 thực tế.
3. Dọn theo quan hệ ngược: file export → rating/registration test → document/media → news → mẫu đơn → thủ tục → lĩnh vực → user → role. Không xóa seed hay dữ liệu nghiệp vụ thật.

## Phụ lục A — Ánh xạ đầy đủ API vào luồng

Mỗi API OpenAPI hiện tại xuất hiện đúng một lần dưới đây. Chạy nó tại Flow ghi ở cột đầu tiên, theo đúng dữ liệu đầu vào/đầu ra đã định nghĩa trong Flow đó.

| Flow | API | Mục đích |
|---|---|---|
| 0–1 | `POST /api/auths/login` | Đăng nhập hệ thống |
| 0–1 | `PUT /api/auths/refresh-token` | Refresh access token |
| 0–1 | `POST /api/auths/logout` | User logout |
| 0–1 | `POST /api/auths/logout-for-mobile` | User logout for mobile |
| 0–1 | `PUT /api/auths/change-password` | Change user password |
| 0–1 | `POST /api/auths/enable-or-disable-2fa` | Enable or disable two-factor authentication (2FA) |
| 0–1 | `POST /api/auths/verify-2fa` | Verify Two-Factor Authentication (2FA) |
| 0–1 | `POST /api/auths/send-otp` | Send OTP to email |
| 0–1 | `PUT /api/auths/reset-password` | Reset user password using OTP |
| 0–1 | `POST /api/auths/verify-enable-or-disable-2fa` | Verify enabling or disabling two-factor authentication (2FA) |
| 0–1 | `POST /api/auths/login-with-captcha` | User login with captcha |
| 1 | `GET /api/users/my-profile` | Lấy hồ sơ của tôi |
| 1 | `GET /api/users` | Lấy danh sách người dùng có phân trang |
| 1 | `PUT /api/users` | Cập nhật hồ sơ người dùng |
| 1 | `POST /api/users/create-account` | Tạo tài khoản người dùng mới (do admin thực hiện) |
| 1 | `GET /api/users/statistics` | Thống kê người dùng |
| 1 | `PUT /api/users/update-by-admin` | Cập nhật hồ sơ người dùng bởi admin |
| 1 | `DELETE /api/users/{userId}` | Xóa người dùng bởi admin |
| 1 | `PUT /api/users/update-status/{userId}` | Cập nhật trạng thái hoạt động của người dùng bởi admin |
| 1 | `PUT /api/users/fcm-token` | Cập nhật FCM token cho người dùng |
| 1 | `GET /api/users/{id}` | Lấy thông tin người dùng theo ID |
| 1 | `GET /api/users/search` | Tìm kiếm người dùng |
| 1 | `GET /api/users/khu-pho` | Lấy danh sách user có vai trò Khu Phố |
| 1 | `PUT /api/users/update-first-login` | Cập nhật mật khẩu lần đầu đăng nhập |
| 1 | `GET /api/users/data/{key}` | Lấy dữ liệu mẫu theo khóa |
| 2 | `POST /api/mau-don` | Create Mau Don |
| 2 | `GET /api/mau-don` | Get All Mau Don |
| 2 | `PUT /api/mau-don/{id}` | Update Mau Don |
| 2 | `DELETE /api/mau-don/{id}` | Delete Mau Don |
| 2 | `GET /api/mau-don/{id}` | Get Mau Don By ID |
| 2 | `PUT /api/mau-don/update-status/{id}` | Update Mau Don Status |
| 2 | `GET /api/mau-don/paging` | Get All Mau Don With Paging |
| 2 | `POST /api/uy-ban` | Tạo ủy ban mới |
| 2 | `GET /api/uy-ban` | Lấy ủy ban |
| 2 | `PUT /api/uy-ban/{id}` | Cập nhật ủy ban |
| 2 | `GET /api/thu-tuc` | Danh sách thủ tục với phân trang |
| 2 | `POST /api/thu-tuc` | Tạo mới thủ tục |
| 2 | `GET /api/thu-tuc/{id}/mau-don` | Lấy danh sách mẫu đơn theo ID thủ tục |
| 2 | `GET /api/thu-tuc/{id}` | Lấy thủ tục theo ID |
| 2 | `DELETE /api/thu-tuc/{id}` | Xóa vĩnh viễn thủ tục theo ID |
| 2 | `PUT /api/thu-tuc/{id}` | Cập nhật thủ tục theo ID |
| 2 | `GET /api/thu-tuc/all` | Lấy danh sách thủ tục cho mobile |
| 2 | `PUT /api/thu-tuc/update-status/{id}` | Cập nhật trạng thái hoạt động của thủ tục theo ID |
| 2 | `GET /api/thu-tuc/{id}/thanh-phan` | Lấy thành phần thủ tục theo ID thủ tục |
| 2 | `GET /api/thu-tuc/search` | Tìm kiếm thủ tục hành chính |
| 2 | `GET /api/co-so-dich-vu-cong` | Lấy danh sách Cơ sở dịch vụ công |
| 2 | `POST /api/co-so-dich-vu-cong` | Tạo mới một Cơ sở dịch vụ công |
| 2 | `GET /api/co-so-dich-vu-cong/pagination` | Lấy danh sách Cơ sở dịch vụ công |
| 2 | `GET /api/co-so-dich-vu-cong/{id}` | Lấy Cơ sở dịch vụ công theo ID |
| 2 | `PUT /api/co-so-dich-vu-cong/{id}` | Cập nhật thông tin Cơ sở dịch vụ công |
| 2 | `DELETE /api/co-so-dich-vu-cong/{id}` | Xóa vĩnh viễn Cơ sở dịch vụ công theo ID |
| 2 | `PUT /api/co-so-dich-vu-cong/update-status/{id}` | Cập nhật trạng thái hoạt động của Cơ sở dịch vụ công |
| 2 | `GET /api/linh-vuc` | Lấy danh sách lĩnh vực |
| 2 | `POST /api/linh-vuc` | Tạo mới lĩnh vực |
| 2 | `GET /api/linh-vuc/pagination` | Lấy danh sách lĩnh vực |
| 2 | `GET /api/linh-vuc/count-thu-tuc` | Thống kê tổng số thủ tục theo từng lĩnh vực |
| 2 | `PUT /api/linh-vuc/{id}` | Cập nhật lĩnh vực |
| 2 | `DELETE /api/linh-vuc/{id}` | Xóa lĩnh vực |
| 2 | `GET /api/linh-vuc/{id}` | Lấy thông tin lĩnh vực theo ID |
| 2 | `PUT /api/linh-vuc/update-status/{id}` | Cập nhật trạng thái hoạt động của lĩnh vực |
| 3 | `POST /api/tin-tuc/upload` | Upload tệp đính kèm cho tin tức |
| 3 | `PUT /api/tin-tuc/{id}` | Cập nhật tin tức |
| 3 | `GET /api/tin-tuc/{id}` | Lấy chi tiết tin tức |
| 3 | `DELETE /api/tin-tuc/{id}` | Xóa vĩnh viễn tin tức theo ID |
| 3 | `GET /api/tin-tuc` | Lấy danh sách tin tức |
| 3 | `POST /api/tin-tuc` | Tạo mới tin tức |
| 3 | `PUT /api/tin-tuc/update-status/{id}` | Cập nhật trạng thái hoạt động của tin tức |
| 3 | `GET /api/tin-tuc/view/{id}` | Lấy tin tức để xem |
| 3 | `GET /api/tin-tuc/statistics` | Thống kê tin tức |
| 3 | `POST /api/danh-muc-tin-tuc` | Tạo mới danh mục tin tức |
| 3 | `GET /api/danh-muc-tin-tuc` | Lấy danh sách danh mục tin tức |
| 3 | `GET /api/danh-muc-tin-tuc/pagination` | Lấy danh sách danh mục tin tức có phân trang |
| 3 | `GET /api/danh-muc-tin-tuc/count-tin-tuc` | Đếm số lượng tin tức theo danh mục |
| 3 | `PUT /api/danh-muc-tin-tuc/{id}` | Cập nhật danh mục tin tức |
| 3 | `DELETE /api/danh-muc-tin-tuc/{id}` | Xóa danh mục tin tức |
| 3 | `GET /api/danh-muc-tin-tuc/{id}` | Lấy thông tin chi tiết danh mục tin tức |
| 3 | `PUT /api/danh-muc-tin-tuc/update-status/{id}` | Cập nhật trạng thái hoạt động của danh mục tin tức |
| 4 | `POST /api/lich-tiep-dan/import` | Import lịch tiếp dân từ file Excel |
| 4 | `GET /api/lich-tiep-dan` | Lấy danh sách lịch tiếp dân với các bộ lọc |
| 4 | `POST /api/lich-tiep-dan` | Tạo mới lịch tiếp dân |
| 4 | `GET /api/lich-tiep-dan/pagination` | Lấy danh sách lịch tiếp dân với các bộ lọc |
| 4 | `GET /api/lich-tiep-dan/count` | Đếm tổng số lịch tiếp dân (có thể áp dụng bộ lọc) |
| 4 | `DELETE /api/lich-tiep-dan/{id}` | Xoá lịch tiếp dân theo ID |
| 4 | `GET /api/lich-tiep-dan/{id}` | Lấy lịch tiếp dân theo ID |
| 4 | `PUT /api/lich-tiep-dan/{id}` | Cập nhật lịch tiếp dân theo ID |
| 4 | `PUT /api/lich-tiep-dan/update-status/{id}` | Cập nhật trạng thái hoạt động của lịch tiếp dân |
| 4 | `GET /api/lich-tiep-dan/template` | Lấy template lịch tiếp dân |
| 4–5 | `POST /api/linh-vuc-phan-anh` | Tạo lĩnh vực phản ánh mới |
| 4–5 | `GET /api/linh-vuc-phan-anh` | Lấy danh sách lĩnh vực phản ánh |
| 4–5 | `PUT /api/linh-vuc-phan-anh/{id}` | Cập nhật lĩnh vực phản ánh |
| 4–5 | `GET /api/linh-vuc-phan-anh/{id}` | Lấy chi tiết lĩnh vực phản ánh theo ID |
| 4–5 | `DELETE /api/linh-vuc-phan-anh/{id}` | Xóa lĩnh vực phản ánh |
| 4–5 | `PUT /api/linh-vuc-phan-anh/update-status/{id}` | Cập nhật trạng thái hoạt động của lĩnh vực phản ánh |
| 4–5 | `GET /api/linh-vuc-phan-anh/search` | Tìm kiếm lĩnh vực phản ánh theo tên |
| 5 | `POST /api/phan-anh` | Tạo phản ánh mới (yêu cầu đăng nhập) |
| 5 | `GET /api/phan-anh` | Lấy danh sách phản ánh với phân trang và lọc sử dụng trên web |
| 5 | `GET /api/phan-anh/{maPhanAnh}/for-mobile` | Lấy thông tin phản ánh theo mã phản ánh cho mobile |
| 5 | `POST /api/phan-anh/export-excel` | Xuất Excel danh sách phản ánh theo phạm vi được cấp |
| 5 | `GET /api/phan-anh/{idPhanAnh}/lich-su-trang-thai` | Lấy lịch sử trạng thái của phản ánh |
| 5 | `GET /api/phan-anh/user/me` | Lấy danh sách phản ánh của người dùng hiện tại |
| 5 | `GET /api/phan-anh/muc-do` | Lấy mức độ phản ánh |
| 5 | `GET /api/phan-anh/trang-thai` | Lấy trạng thái phản ánh |
| 5 | `GET /api/phan-anh/{idPhanAnh}` | Lấy phản ánh theo ID sử dụng trên web |
| 5 | `PUT /api/phan-anh/update-status/{idPhanAnh}` | Cập nhật trạng thái phản ánh |
| 5 | `PUT /api/phan-anh/update-muc-do/{idPhanAnh}` | Đổi mức độ phản ánh |
| 5 | `PUT /api/phan-anh/update-linh-vuc/{idPhanAnh}` | Cập nhật lĩnh vực phản ánh |
| 5 | `GET /api/phan-anh/tong-quan` | Lấy thống kê tổng quan phản ánh |
| 5 | `POST /api/phan-anh/extension/request` | Gửi đề nghị gia hạn phản ánh |
| 5 | `GET /api/phan-anh/extension` | Lấy danh sách đề nghị gia hạn |
| 5 | `GET /api/phan-anh/extension/export-excel` | Xuất Excel quản lý gia hạn phản ánh |
| 5 | `GET /api/phan-anh/extension/{id}` | Lấy chi tiết đề nghị gia hạn |
| 5 | `PUT /api/phan-anh/extension/{id}/approve` | Phê duyệt đề nghị gia hạn |
| 5 | `PUT /api/phan-anh/extension/{id}/reject` | Từ chối đề nghị gia hạn |
| 5 | `GET /api/phan-anh/{idPhanAnh}/nguoi-xu-ly` | Lấy danh sách chuyên viên có thể xử lý phản ánh |
| 5 | `PUT /api/phan-anh/assign/{idPhanAnh}` | Phân công hoặc chuyển phản ánh |
| 5 | `GET /api/phan-anh/muc-do-trang-thai-linh-vuc` | Lấy mức độ và trạng thái phản ánh |
| 5 | `GET /api/phan-anh/search-by-tieu-de` | Tìm kiếm phản ánh theo tiêu đề |
| 5 | `POST /api/phan-anh/public/create` | Tạo phản ánh mới từ công dân (không cần đăng nhập) |
| 5 | `GET /api/phan-anh-ratings` | Lấy danh sách đánh giá phản ánh theo phạm vi lĩnh vực |
| 5 | `POST /api/phan-anh-ratings` | Người dân gửi đánh giá phản ánh |
| 5 | `GET /api/phan-anh-ratings/configuration` | Lấy cấu hình đánh giá phản ánh cho người dân |
| 5 | `GET /api/phan-anh-ratings/by-code/{complaintCode}` | Kiểm tra và lấy thông tin đánh giá của phản ánh theo mã |
| 5 | `GET /api/phan-anh-ratings/statistics` | Thống kê đánh giá phản ánh theo phạm vi lĩnh vực |
| 5 | `GET /api/phan-anh-ratings/{id}` | Lấy chi tiết đánh giá phản ánh |
| 5 | `POST /api/video/upload` | Tải video phản ánh |
| 5 | `GET /api/video/{idVideo}` | Lấy thông tin video đã tải |
| 5 | `GET /api/report/phan-anh` | Lấy báo cáo phản ánh |
| 5 | `GET /api/report/thu-tuc` | Lấy báo cáo thủ tục hành chính |
| 5 | `GET /api/report/tin-tuc` | Lấy báo cáo tin tức |
| 5 | `GET /api/report/phan-anh/export` | Xuất báo cáo phản ánh ra file Excel |
| 5 | `GET /api/report/thu-tuc/export` | Xuất báo cáo thủ tục hành chính ra file Excel |
| 5 | `GET /api/report/tin-tuc/export` | Xuất báo cáo tin tức ra file Excel |
| 5 | `GET /api/report/phan-anh/theo-thang` | Lấy báo cáo phản ánh theo tháng |
| 5 | `GET /api/report/phan-anh/chi-tiet` | Lấy chi tiết phản ánh |
| 5 | `GET /api/report/phan-anh/chi-tiet/export` | Xuất chi tiết phản ánh ra Excel |
| 5 | `GET /api/report/danh-gia/export` | Xuất danh sách đánh giá ra Excel |
| 1 | `GET /api/role` | Lấy tất cả role |
| 1 | `POST /api/role` | Tạo vai trò mới |
| 1 | `GET /api/role/pagination` | Lấy tất cả vai trò với phân trang |
| 1 | `GET /api/role/{roleId}` | Lấy chi tiết vai trò |
| 1 | `PUT /api/role/{roleId}` | Cập nhật vai trò |
| 1 | `DELETE /api/role/{roleId}` | Xóa vai trò |
| 1 | `PUT /api/role/update-status/{roleId}` | Cập nhật trạng thái vai trò |
| 1 | `GET /api/permission` | Lấy tất cả quyền |
| 1 | `GET /api/permission/cate` | Lấy danh mục quyền |
| 10 | `GET /api/notifications` | Lấy danh sách thông báo của người dùng |
| 10 | `POST /api/notifications/mark-all-read` | Đánh dấu tất cả thông báo đã đọc |
| 10 | `DELETE /api/notifications/{id}` | Xóa thông báo theo ID |
| 10 | `POST /api/notifications/{id}/mark-read` | Đánh dấu thông báo đã đọc theo ID |
| 10 | `GET /api/audit-logs` | Lấy danh sách nhật ký hệ thống |
| 10 | `GET /api/audit-logs/{id}` | Lấy chi tiết nhật ký hệ thống |
| 5 | `POST /api/export/phan-anh` | Tạo yêu cầu xuất ZIP phản ánh |
| 5 | `GET /api/export/phan-anh` | Lấy danh sách file ZIP phản ánh đã xuất |
| 5 | `GET /api/export/phan-anh/{fileName}/download` | Tải file ZIP phản ánh đã xuất |
| 5 | `DELETE /api/export/phan-anh/{fileName}/delete` | Xóa file ZIP phản ánh đã xuất |
| 4 | `POST /api/address-vote/import` | Import address vote file Excel |
| 6 | `GET /api/reception-registrations` | Lấy danh sách đăng ký tiếp dân dành cho cán bộ |
| 6 | `GET /api/reception-registrations/{id}` | Lấy chi tiết đăng ký tiếp dân dành cho cán bộ |
| 6 | `PATCH /api/reception-registrations/{id}/approve` | Phê duyệt đăng ký tiếp dân |
| 6 | `PATCH /api/reception-registrations/{id}/complete` | Xác nhận hoàn thành buổi tiếp dân |
| 6 | `PATCH /api/reception-registrations/{id}/reject` | Từ chối đăng ký tiếp dân đang chờ |
| 6 | `GET /api/reception-registrations/rating-lookup/{receptionCode}` | [Luồng cũ] Tra cứu đăng ký đã hoàn thành để đánh giá trên iPad |
| 6 | `GET /api/reception-schedules` | Lấy lịch tiếp dân đang hoạt động dành cho Mobile |
| 6 | `GET /api/reception-ratings` | Lấy danh sách đánh giá tiếp dân dành cho lãnh đạo |
| 6 | `POST /api/reception-ratings` | Gửi đánh giá tiếp dân nhập thủ công từ iPad |
| 6 | `GET /api/reception-ratings/configuration` | Lấy cấu hình đánh giá tiếp dân dành cho iPad |
| 6 | `GET /api/reception-ratings/{id}` | Lấy chi tiết đánh giá tiếp dân dành cho lãnh đạo |
| 6 | `GET /api/reception-ratings/statistics` | Lấy thống kê cơ bản về đánh giá tiếp dân |
| 6 | `GET /api/reception-counters` | Lấy danh sách quầy tiếp dân |
| 6 | `GET /api/reception-counters/{id}` | Lấy chi tiết quầy tiếp dân |
| 6 | `PATCH /api/reception-counters/{id}` | Cập nhật quầy tiếp dân |
| 6 | `GET /api/reception-counter-assignments` | Lấy danh sách phân công cán bộ - quầy |
| 6 | `GET /api/reception-counter-assignments/{id}` | Lấy chi tiết phân công cán bộ - quầy |
| 6 | `PATCH /api/reception-counter-assignments/{id}` | Cập nhật một phân công cán bộ - quầy |
| 6 | `DELETE /api/reception-counter-assignments/{id}` | Xóa mềm một phân công cán bộ - quầy |
| 6 | `PUT /api/reception-shifts/{shiftId}/counter-assignments` | Thiết lập phân công cán bộ - quầy cho một ca |
| 7 | `PUT /api/leader-meeting-schedules/management/{id}/status` | Bật hoặc tắt lịch gặp lãnh đạo |
| 7 | `GET /api/leader-meeting-schedules/management/{id}` | Lấy chi tiết lịch gặp lãnh đạo |
| 7 | `PUT /api/leader-meeting-schedules/management/{id}` | Cập nhật lịch gặp lãnh đạo chưa có đơn |
| 7 | `DELETE /api/leader-meeting-schedules/management/{id}` | Xóa mềm lịch gặp lãnh đạo chưa có đơn |
| 7 | `GET /api/leader-meeting-schedules/management` | Lấy danh sách lịch gặp lãnh đạo theo quyền |
| 7 | `POST /api/leader-meeting-schedules/management` | Lãnh đạo tự tạo lịch gặp công dân |
| 7 | `GET /api/leader-meeting-schedules` | Lấy lịch gặp lãnh đạo khả dụng cho Mobile |
| 7 | `POST /api/leader-meeting-registrations/ocr/cccd` | Đọc thông tin CCCD bằng OCR |
| 7 | `POST /api/leader-meeting-registrations/lookup` | Tra cứu đăng ký gặp lãnh đạo |
| 7 | `GET /api/leader-meeting-registrations` | Lấy danh sách đăng ký gặp lãnh đạo theo quyền |
| 7 | `POST /api/leader-meeting-registrations` | Gửi đăng ký gặp lãnh đạo từ Mobile |
| 7 | `GET /api/leader-meeting-registrations/{id}` | Xem chi tiết đăng ký gặp lãnh đạo |
| 7 | `PATCH /api/leader-meeting-registrations/{id}/approve` | Phê duyệt đăng ký gặp lãnh đạo |
| 7 | `PATCH /api/leader-meeting-registrations/{id}/reject` | Từ chối đăng ký gặp lãnh đạo |
| 7 | `PATCH /api/leader-meeting-registrations/{id}/process` | Bắt đầu xử lý đăng ký gặp lãnh đạo |
| 7 | `PATCH /api/leader-meeting-registrations/{id}/complete` | Hoàn thành đăng ký gặp lãnh đạo |
| 7 | `PATCH /api/leader-meeting-registrations/{id}/cancel` | Hủy đăng ký gặp lãnh đạo |
| 7 | `GET /api/leader-meeting-registrations/{id}/attachments/{attachmentId}` | Xem hoặc tải tệp của đăng ký gặp lãnh đạo |
| 7 | `GET /api/leader-meeting-ratings` | Lấy danh sách đánh giá gặp lãnh đạo theo quyền |
| 7 | `POST /api/leader-meeting-ratings` | Gửi đánh giá buổi gặp lãnh đạo từ iPad |
| 7 | `GET /api/leader-meeting-ratings/configuration` | Lấy cấu hình đánh giá gặp lãnh đạo trên iPad |
| 7 | `GET /api/leader-meeting-ratings/statistics` | Thống kê đánh giá gặp lãnh đạo theo quyền |
| 7 | `GET /api/leader-meeting-ratings/{id}` | Xem chi tiết đánh giá gặp lãnh đạo |
| 8 | `GET /api/tai-lieu-van-hoa/paging` | Lấy danh sách tài liệu văn hóa (phân trang) |
| 8 | `GET /api/tai-lieu-van-hoa/sub-categories` | Lấy danh sách phân nhóm văn hóa - lịch sử |
| 8 | `POST /api/tai-lieu-van-hoa/sub-categories` | Thêm phân nhóm văn hóa - lịch sử |
| 8 | `PUT /api/tai-lieu-van-hoa/sub-categories/{id}` | Cập nhật phân nhóm văn hóa - lịch sử |
| 8 | `DELETE /api/tai-lieu-van-hoa/sub-categories/{id}` | Xóa phân nhóm văn hóa - lịch sử |
| 8 | `GET /api/tai-lieu-van-hoa/{id}` | Lấy chi tiết tài liệu văn hóa |
| 8 | `PUT /api/tai-lieu-van-hoa/{id}` | Cập nhật tài liệu văn hóa |
| 8 | `DELETE /api/tai-lieu-van-hoa/{id}` | Xóa tài liệu văn hóa |
| 8 | `POST /api/tai-lieu-van-hoa` | Tạo mới tài liệu văn hóa |
| 8 | `PUT /api/tai-lieu-van-hoa/update-status/{id}` | Cập nhật trạng thái tài liệu văn hóa |
| 8 | `POST /api/tai-lieu-van-hoa/ai-learn/{id}` | Đồng bộ AI cho tài liệu văn hóa |
| 8 | `PUT /api/tai-lieu-van-hoa/approve/{id}` | Phê duyệt tài liệu văn hóa |
| 8 | `PUT /api/tai-lieu-van-hoa/reject/{id}` | Từ chối tài liệu văn hóa |
| 8 | `PUT /api/tai-lieu-van-hoa/unapprove/{id}` | Hoàn tác phê duyệt tài liệu văn hóa |
| 8 | `GET /api/tai-lieu-van-hoa/statistics` | Thống kê tài liệu văn hóa |
| 8 | `GET /api/tai-lieu-van-hoa/deleted` | Lấy danh sách tài liệu văn hóa đã xóa |
| 8 | `GET /api/tai-lieu-van-hoa/export` | Xuất tài liệu văn hóa ra Excel |
| 8 | `PUT /api/tai-lieu-van-hoa/restore/{id}` | Khôi phục tài liệu văn hóa |
| 8 | `DELETE /api/tai-lieu-van-hoa/force/{id}` | Xóa vĩnh viễn tài liệu văn hóa |
| 8 | `GET /api/tai-lieu-van-hoa/{id}/download` | Download tài liệu văn hóa |
| 8 | `DELETE /api/tai-lieu-van-hoa/{id}/media/{mediaId}` | Xóa media đính kèm tài liệu văn hóa |
| 9 | `GET /api/tai-lieu-phap-luat/paging` | Lấy danh sách tài liệu pháp luật (phân trang) |
| 9 | `GET /api/tai-lieu-phap-luat/{id}` | Lấy chi tiết tài liệu pháp luật |
| 9 | `PUT /api/tai-lieu-phap-luat/{id}` | Cập nhật tài liệu pháp luật |
| 9 | `DELETE /api/tai-lieu-phap-luat/{id}` | Xóa tài liệu pháp luật |
| 9 | `POST /api/tai-lieu-phap-luat` | Tạo mới tài liệu pháp luật |
| 9 | `PUT /api/tai-lieu-phap-luat/update-status/{id}` | Cập nhật trạng thái tài liệu pháp luật |
| 9 | `POST /api/tai-lieu-phap-luat/ai-learn/{id}` | Đồng bộ AI cho tài liệu pháp luật |
| 9 | `PUT /api/tai-lieu-phap-luat/approve/{id}` | Phê duyệt tài liệu pháp luật |
| 9 | `PUT /api/tai-lieu-phap-luat/reject/{id}` | Từ chối tài liệu pháp luật |
| 9 | `PUT /api/tai-lieu-phap-luat/unapprove/{id}` | Hoàn tác phê duyệt tài liệu pháp luật |
| 9 | `GET /api/tai-lieu-phap-luat/statistics` | Thống kê tài liệu pháp luật |
| 9 | `GET /api/tai-lieu-phap-luat/deleted` | Lấy danh sách tài liệu pháp luật đã xóa |
| 9 | `GET /api/tai-lieu-phap-luat/export` | Xuất tài liệu pháp luật ra Excel |
| 9 | `PUT /api/tai-lieu-phap-luat/restore/{id}` | Khôi phục tài liệu pháp luật |
| 9 | `DELETE /api/tai-lieu-phap-luat/force/{id}` | Xóa vĩnh viễn tài liệu pháp luật |
| 9 | `GET /api/tai-lieu-phap-luat/doc-types` | Lấy danh sách loại văn bản pháp luật |
| 9 | `POST /api/tai-lieu-phap-luat/doc-types` | Thêm loại văn bản pháp luật |
| 9 | `PUT /api/tai-lieu-phap-luat/doc-types/{id}` | Cập nhật loại văn bản pháp luật |
| 9 | `DELETE /api/tai-lieu-phap-luat/doc-types/{id}` | Xóa loại văn bản pháp luật |
| 9 | `GET /api/tai-lieu-phap-luat/issuing-agencies` | Lấy danh sách cơ quan ban hành |
| 9 | `GET /api/tai-lieu-phap-luat/{id}/download` | Download tài liệu pháp luật |
| 10 | `GET /api/tai-lieu-cong-khai/paging` | Lấy danh sách tài liệu công khai (phân trang) |
| 10 | `GET /api/tai-lieu-cong-khai/{id}` | Lấy chi tiết tài liệu công khai |
| 10 | `GET /api/tai-lieu-cong-khai/categories` | Lấy danh mục tài liệu công khai |
| 10 | `GET /api/tai-lieu-cong-khai/{id}/download` | Lấy đường dẫn tải tài liệu công khai |
| 10 | `GET /api/logs` | Lấy danh sách file log |
| 10 | `GET /api/logs/view/{fileName}` | Xem nội dung file log |
| 10 | `GET /api/logs/download/{fileName}` | Tải file log |
4. Logout user test bằng `POST /api/auths/logout`; không logout admin trước khi hoàn tất evidence.
