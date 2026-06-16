# CLAUDE.md — UBND-BE (API + Realtime + Workers)

> Context tổng fullstack ở `../CLAUDE.md`. File này đào sâu **BE** để biết chỗ tái sử dụng (response/error/pagination util, middleware, constants, layering, hệ thống bất đồng bộ). Nhánh làm việc: **`staging`** — riêng việc nâng cấp **Prisma 7** hiện nằm ở nhánh **`upgrade/prisma-7`** (chưa merge về `staging`); mục dưới đã mô tả theo Prisma 7.

## Stack & chạy
Node **≥22.6** (cần `--experimental-strip-types` để chạy client `.ts`; ESM, `"type":"module"`), **Express 5**, **Prisma 7** (generator `prisma-client` sinh TypeScript + **driver adapter `@prisma/adapter-pg` + `pg`**) + PostgreSQL ≥13, Socket.IO, **RabbitMQ** (amqplib), **FFmpeg** (`@ffmpeg-installer` + `fluent-ffmpeg`) cho HLS, Nodemailer + Handlebars, JWT + bcrypt, Joi (+ joi-to-swagger), Winston, firebase-admin.
```
npm install            # postinstall tự chạy prisma generate
npx prisma generate    # sinh client TS → src/generated/prisma
npm run dev            # node --watch --experimental-strip-types src/app.js
npm start              # node --experimental-strip-types src/app.js
# Swagger: :8880/api-docs (basic auth) · Prisma Studio: npx prisma studio (:5555)
```

### Prisma 7 — đặc thù (khác v6)
- **Generator** `prisma-client` (không phải `prisma-client-js`) → output **`src/generated/prisma`** dưới dạng **`.ts`**; app import thẳng `client.ts`, chạy nhờ Node native type-stripping (`--experimental-strip-types`).
- **Driver adapter bắt buộc**: `config/database.config.js` khởi tạo `new PrismaClient({ adapter: new PrismaPg(...) })` — không còn `new PrismaClient()` đọc thẳng `DATABASE_URL`. Adapter `pg` **KHÔNG tự áp `?schema=`** của connection string → phải parse `schema` từ URL và truyền tường minh cho `PrismaPg`, nếu không sẽ query nhầm schema `public`. (pg cũng không có `connectionTimeout` mặc định — v6 trước là 5s.)
- **Raw queries cần `search_path`**: `{ schema }` của adapter chỉ qualify query Prisma SINH RA; `$queryRaw`/`$queryRawUnsafe` với tên bảng **không qualify** sẽ lỗi `42P01 relation ... does not exist` khi schema != `public`. → `database.config.js` set `search_path` ngay lúc khởi tạo connection qua pg `options: '-c search_path="<schema>",public'` (race-free, áp cho mọi raw query). Khi viết raw SQL mới không cần qualify schema.
- **`prisma.config.ts`** (mới ở v7): nạp `.env` thủ công (`import 'dotenv/config'`), khai báo `schema` + `datasource.url = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL` cho **CLI migrate/db**. Tách `MIGRATE_DATABASE_URL` vì CLI chạy DDL nên cần user **OWNER bảng** (`ubnd_admin`), khác runtime dùng user hạn chế (`user_staging`/`DATABASE_URL`). Dùng `process.env` trực tiếp, KHÔNG dùng helper `env()` (ném lỗi khi biến vắng → fail `prisma generate` ở Docker build).
- **Schema**: `datasource db` trong `schema.prisma` chỉ còn `provider`, **không còn `url`** (URL chuyển sang `prisma.config.ts`).

### Migrations (đã baseline — QUAN TRỌNG)
Dự án trước đây dùng `db push` (không có lịch sử migration); prod/staging đã được **baseline** về một lịch sử sạch chung:
- `prisma/migrations/0_init/` — baseline **đủ 33 bảng** hiện trạng, **schema-agnostic** (tên bảng không qualify schema → schema do `?schema=` của connection chọn; có `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`). Đã `migrate resolve --applied` trên cả 2 môi trường (chỉ ghi metadata, không tạo lại bảng).
- `prisma/migrations/0001_sync_phan_anh_fk/` — đồng bộ FK `phan_anh.id_to` về schema.
- **Quy tắc vàng:** TUYỆT ĐỐI không `migrate dev`/`migrate reset` lên prod/staging (có thể drop & reset). Chỉ dùng `migrate deploy` (áp migration mới) trên server.
- **Thêm thay đổi schema:** sửa `schema.prisma` → `prisma migrate dev --name <ten>` ở **DB dev cục bộ** (tạo file migration) → khi sinh migration mới nhớ giữ **schema-agnostic** (gỡ `"<SCHEMA>".` qualifier + dòng `CREATE SCHEMA`) → `prisma migrate deploy` lên staging rồi prod.
- **Khác schema theo môi trường:** staging `ubnd_staging`/`UBND_DB_STG`, prod `ubnd_db`/`UBND_DB` (cùng host, user owner `ubnd_admin`). Set `MIGRATE_DATABASE_URL` đúng env trước khi chạy CLI. **Luôn backup (`pg_dump -n '"<SCHEMA>"'`) trước khi deploy lên prod.**

## Bootstrap — `src/app.js`
Thứ tự: CORS (`env.CORS_ORIGIN`, hỗ trợ `*`, `credentials:true`) → `express.json()` → static `src/public` → **rate limit** (`RATE_LIMIT_WINDOW_MS`/`MAX`, **skip** path chứa `/video/upload`) → mount `rootRouter` tại `PREFIX_API` (mặc định `/api`) → `CreateAccountSeed()` → **`errorHandler` (cuối cùng)** → Swagger `/api-docs` (basic auth). Khởi tạo `connectRabbitMQ()` + assert tất cả queue, import workers `video.worker.js` & `export-phan-anh.worker.js`, đăng ký cron. `GET /health` → `ok`. Port `env.PORT` (mặc định 8880). Socket.IO khởi tạo trong `src/realtime/socket/`.

## Phân lớp (chuẩn cho MỌI module mới)
`routes/*.route.js` → `controllers/*.controller.js` → `services/*.service.js` → `repositories/*.repository.js` → **Prisma singleton** (`config/database.config.js` — instance dùng driver adapter `@prisma/adapter-pg`, `import prisma from ...`; là chỗ duy nhất tạo `PrismaClient`).
- **Controller** mỏng: đọc `req.body`/`req.files`/`req.payload`, gọi service, trả `successResponse`.
- **Service** chứa business logic + validate nghiệp vụ (ném `BaseError`), gọi repository.
- **Repository** chỉ thao tác Prisma. `mapper/` chuyển snake_case ↔ camelCase. `validators/` = Joi object, `schemas/` = bản Joi→Swagger.

Route mẫu (đúng thứ tự middleware):
```js
router.post("/", authenticate, authorize([PERMISSION.PA_CREATE]),
  validate(CreatePhanAnhRequest),
  createUploader({ type: UPLOAD_TYPE.PHAN_ANH, fieldName: "file", maxCount: 5, maxSizeMB: 5,
                   allowed_types: ["image/jpeg","image/png"] }),
  audit_logs(AUDIT_LOGS.CREATE, PERMISSION_DESC.PA_CREATE),
  PhanAnhController.createPhanAnh);
```

## TÁI SỬ DỤNG — `src/utils/`
- **`response.util.js`**:
  - `successResponse(res, data={}, message="Success", pagination=null)` → `{ success:true, data, message, pagination }`.
  - `errorResponse(res, error, statusCode=500)` → `{ success:false, message, errors: error.details||null }`.
  - `createPagination(currentPage, pageSize, totalItems)` → `{ currentPage, pageSize, totalPages, totalItems }` (`totalPages=ceil(total/size)`).
- **`base-error.util.js`**: `class BaseError extends Error { constructor(statusCode=500, message, details=null) }`. **Đây là cách ném lỗi duy nhất** — không có catalog error-code dạng số. Message **tiếng Việt hướng người dùng**. `details` = `[{field, message}]` cho lỗi validate.
- **`string.util.js`**: `generateUniqueCode()` (sinh `ma_phan_anh`), `capitalizeWords()`.
- Khác: `bcrypt.util.js`, JWT util (`verifyAccessToken`, sign access/refresh).

**Pagination convention:** query `page` (default 1) + `size` (default 10), controller `parseInt`. Trả meta qua tham số thứ 4 của `successResponse`.

## Middlewares — `src/middlewares/`
| File | Export | Vai trò |
|---|---|---|
| `auth.middleware.js` | `authenticate` | Verify JWT Bearer + **kiểm tra IP** khớp lúc cấp; gắn `req.payload={userId,username,permissions,roles,cate,ip}`, `req.remoteAddress/localAddress/requestAt`. Lỗi → `BaseError(401)`. |
| | `authorize(codes[])` | HOF; mọi quyền trong `codes` phải có trong `req.payload.permissions` (`.every`), else `BaseError(403)`. |
| | `logAuthMiddleware` | Biến thể auth nhẹ (chỉ log/gắn thông tin, không chặn quyền) — dùng cho route như `address-vote/import`. |
| `validate.middleware.js` | `validate(joiSchema)` | `abortEarly:false`; lỗi → `BaseError(400,"Dữ liệu không hợp lệ", details)`; gán lại `req.body` đã validate. |
| `upload.middleware.js` | `createUploader(opts)` | Multer; lưu `src/public/uploads/{type}/{YYYY-MM-DD}/...`; chuẩn hóa tên file tiếng Việt + timestamp; gắn `f.relativeUrl`, `f.sizeMB`; cleanup folder khi lỗi. |
| `audit-logs.middleware.js` | `audit_logs(action, entity)` | Bọc `res.send`; ghi `audit_logs` đầy đủ (request/response body, IP, duration, status); **xóa file upload nếu response `success:false`**. |
| `client-info.middleware.js` | `clientInfo` | Chuẩn hóa IP (IPv6 localhost), parse UA → `req.device`, `req.clientIp/serverIp`. |
| `error-handle.middleware.js` | `errorHandler` | `errorResponse(res, err, err.statusCode||500)`. |

## Constants — `src/constants/` (nguồn chân lý)
- **`permission.constant.js`** — `PERMISSION` (codes `<MODULE>_<ACTION>`), `PERMISSION_DESC`, `PERMISSION_CATEGORIES`, `PERMISSION_TYPE`. Modules: `CSV, DMTT, LTD, LVPA, LVTTHC, MD, PA, RPT, TT, TTIN, UB, ND, ROLE, PERM, ADL`. Actions: `CREATE/UPDATE/DELETE/UPDATE_STATUS/GET_ALL/GET_DETAIL/GET_TEMPLATE/GET_EXCEL`. VD: `PA_CREATE, PA_UPDATE_STATUS, PA_GET_ALL, PA_GET_DETAIL, TTIN_CREATE, ND_UPDATE_STATUS, RPT_GET_EXCEL`. → Thêm endpoint cần quyền mới: thêm code ở đây **và** sync sang `permissions` table (route `POST /api/permission/sync`).
- **`phan-anh-status.constant.js`** — `DA_GUI='Đã gửi', DA_TIEP_NHAN='Đã tiếp nhận', DANG_XU_LY='Đang xử lý', DA_GIAI_QUYET='Đã giải quyết', DONG='Đóng'` (tiến tuyến tính).
- **`phan-anh-muc-do.constant.js`** — `THONG_THUONG='Thông thường', KHAN_CAP='Khẩn cấp'`.
- **`video-status.constant.js`** — `UPLOADING, READY, MERGING, DONE, FAILED, CLEANED_UP`.
- **`otp.constants.js`** — `ENABLE_2FA, DISABLE_2FA, RESET_PASSWORD, LOGIN_2FA`.
- **`upload.constant.js`** — `AVATAR, MAU_DON, PHAN_ANH, TIN_TUC, LICH_TIEP_DAN, ADDRESS_VOTE`.
- **`audit-logs-action.constant.js`** — `AUDIT_LOGS={CREATE,UPDATE,DELETE}` + `AUDIT_LOG_ACTIONS` (mô tả tiếng Việt).
- **`mail.constant.js`** — `RESET_PASSWORD, ACCOUNT_CREATED, ENABLE_OR_DISABLE_2FA, LOGIN_2FA, UPDATE_PROFILE, PHAN_ANH_STATUS_UPDATED, CREATE_PHAN_ANH, EXPORT_READY` (mỗi loại 1 template Handlebars trong `src/templates/`).
- **`tin-tuc.constant.js`** — `NHAP, XUAT_BAN`.

## Auth & RBAC — `src/services/`
`auth.service.js`, `refresh-token.service.js`, `otp.service.js`, `permission.service.js`, `role.service.js`.
- Login: bcrypt verify → nếu `is_enable_two_factor` gửi OTP, trả `requires_two_factor_auth:true` → `verify-2fa`. Else cấp token.
- **Access JWT** chứa userId+ip+roles+permissions; **Refresh** lưu hash trong `refresh_token` (rotation: cấp mới + revoke cũ; logout → `is_revoked=true`). IP-binding ở `authenticate`.
- Quyền: `user_roles → roles → role_permissions → permissions.code`, flatten vào JWT.

## Hệ thống bất đồng bộ
- **Realtime** `src/realtime/socket/`: path `/realtime-phan-anh`, auth token qua handshake (`socket.handshake.auth.token`), join room `user_{userId}`, emit `phan-anh.update-status` (payload `{ma_phan_anh,trang_thai,tieu_de,ghi_chu}`) khi đổi trạng thái phản ánh.
- **Workers** `src/workers/`: `video.worker.js` (queue `videoMerge`: ghép chunk→MP4; queue `videoHLS`: FFmpeg→HLS, segment 10s, baseline H.264; retry 3, set `final_hls_url`, status `DONE`). `export-phan-anh.worker.js` (gom ảnh + HLS→MP4 → ZIP `src/public/export/phan-anh/` → email link).
- **Cron** `src/cron/cleanup-chunks.cron.js`: `0 17 * * *` UTC — xóa chunk của video `DONE`, set `CLEANED_UP`.
- **Mail** `src/services/mail.service.js`: Gmail SMTP + Handlebars (`src/templates/`), `sendMail(to,type,data)` / `sendMailCC({to,cc,bcc,type,data})`.
- **Notification** `notification.service.js`: ghi `notifications` (`target_type='PHAN_ANH'`, `target_id=ma_phan_anh`) + push Expo/FCM theo `nguoi_dung.fcm_token`.

## Endpoint chính theo resource (mount trong `root.route.js`, dưới `PREFIX_API=/api`)
**Lưu ý prefix (đã xác minh trên `staging`):** số nhiều ở một số resource —
`/api/auths` (auth) · `/api/users` · `/api/video` (upload video) · `/api/logs` · `/api/notifications` · `/api/audit-logs`. Còn lại số ít/đúng tên: `/api/phan-anh, /api/thu-tuc, /api/tin-tuc, /api/danh-muc-tin-tuc, /api/linh-vuc-phan-anh, /api/linh-vuc, /api/mau-don, /api/co-so-dich-vu-cong, /api/lich-tiep-dan, /api/uy-ban, /api/role, /api/permission, /api/report, /api/export, /api/address-vote`.

Chi tiết: `auth.route.js` (login, login-with-captcha, refresh-token, change/reset-password, send-otp, verify-2fa, enable-or-disable-2fa, logout[-for-mobile]) · `phan-anh.route.js` (create, list, `:id`, `:maPhanAnh/for-mobile`, `user/me`, `muc-do`, `trang-thai`, `tong-quan`, `search-by-tieu-de`, `update-status/:id`) · `video-upload.route.js` (`upload`, `:idVideo`) · `tin-tuc.route.js` (+ `view/:id`) · `permission.route.js` (`/`, `/cate`, `POST /sync`) · `report.route.js` (+ `/export`) · **`address-vote.route.js`** (`POST /import` — nhập Excel danh sách địa chỉ/biểu quyết sáp nhập địa giới; dùng `logAuthMiddleware` + `createUploader({type: UPLOAD_TYPE.ADDRESS_VOTE, maxSizeMB:10, allowed_types: xlsx/xls})`, controller `uploadFileAddress`).

## ENV (`.env.example`)
`PORT, PREFIX_API, CORS_ORIGIN, DATABASE_URL, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN, ADMIN_USERNAME/PASSWORD/EMAIL, MAIL_USER, MAIL_PASS, OTP_EXPIRE_MINUTES, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, SWAGGER_USERNAME/PASSWORD, RABBITMQ_URL, RABBITMQ_QUEUE_VIDEO_MERGE/VIDEO_HLS/EXPORT_PHAN_ANH, FIREBASE_* (11), RECAPTCHA_SECRET/VERIFY_URL, EXPO_NOTI_SERVICE_URL, URL_PHAN_ANH_MANAGER/USER, URL_EXPORT_PHAN_ANH, REATE_LIMIT_FOR_UPLOAD_VIDEO_MAX`.

## Quy ước khi thêm code
1. Đi đủ chuỗi route→controller→service→repository; dùng `successResponse`/`BaseError`.
2. Bảo vệ route: `authenticate` + `authorize([PERMISSION.*])`; thêm code mới vào `permission.constant.js`.
3. Validate bằng Joi trong `validators/` + `validate(...)`; lỗi tiếng Việt.
4. Bảng mới: PK UUID, giữ bộ cột audit (`nguoi_tao/nguoi_cap_nhat/thoi_gian_tao/thoi_gian_cap_nhat`) + `is_active`/`is_delete` (xóa mềm). Cập nhật `prisma/schema.prisma` → `prisma migrate dev --name <ten>` (DB dev cục bộ, sinh file migration + `prisma generate`) → giữ migration **schema-agnostic** → `migrate deploy` lên staging/prod. **Không** chỉ `db push` lên server (sẽ tạo lại drift không-track như trước đây).
5. Tác vụ nặng (video/email/export) → đẩy RabbitMQ, không chặn request.
