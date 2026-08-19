# Các chỉnh sửa để app chạy được khi chỉ có `.env` database

> Ngữ cảnh: được cấp `.env` chỉ có `DATABASE_URL` + `MIGRATE_DATABASE_URL` (cho Task 2 — DB dev chung Render).
> App vốn yêu cầu nhiều biến env khác ngay khi boot → đã chỉnh code để **app boot được, chạy bình thường**;
> các tính năng phụ thuộc credentials thiếu (Firebase/RabbitMQ) sẽ **tạm tắt**. Khi có đủ env → khôi phục theo mục 3.
>
> Các chỉnh sửa này **an toàn phiên bản**: khi có đủ env, app chạy đúng tính năng như thiết kế ban đầu.

---

## 1) Tóm tắt các phần đã chỉnh sửa

### 1.1 `src/realtime/firebase/index.js` — Firebase có điều kiện
**Trạng thái trước:** import cứng, tạo `serviceAccount` và gọi `admin.credentials.cert(...)` ngay ở top-level.
Thiếu `FIREBASE_PRIVATE_KEY` → `undefined.replace(...)` → **crash lúc boot**.

**Đã sửa thành:**
- Kiểm tra `hasFirebaseCreds = Boolean(FIREBASE_PRIVATE_KEY && FIREBASE_CLIENT_EMAIL && FIREBASE_PROJECT_ID)`.
- Có đủ creds → init/serviceAccount như cũ.
- Thiếu → xuất **Proxy** quanh `admin`, chặn `.messaging()` trả về no-op (`send()` log warning + trả `{messageId:'skipped-no-firebase'}`).

**Vì sao dùng `export default` 1 lần ở cuối, không đặt trong `if`:** ESM không cho `export default` bên trong khối lệnh.

**Vì sao dùng Proxy thay vì gán `admin.messaging = ...`:** `firebase-admin` định nghĩa `messaging` là **getter-only** (`TypeError: Cannot set property messaging`).

### 1.2 `src/config/rabbitmq.config.js` — RabbitMQ tuỳ chọn khi chưa có URL
**Trạng thái trước:** `connectRabbitMQ()` gọi `amqp.connect(RABBITMQ_URL)`; URL trống → retry 5 lần → `process.exit(1)` → **app thoát**.

**Đã sửa thành:** đầu hàm kiểm tra `if (!RABBITMQ_URL)`, không kết nối mà trả về **stub channel** gồm đủ các method dùng trong app:
`assertQueue, assertExchange, bindQueue, sendToQueue, publish, consume, prefetch, ack, nack, close` → app và workers boot được.

> Khi có `RABBITMQ_URL` thật → nhánh này không chạy, bot nối như thiết kế gốc (không cần đổi).

### 1.3 `.env` — Bổ sung biến còn thiếu (giữ nguyên 2 dòng database)
Giữ nguyên 2 dòng bạn được cấp:
```ini
DATABASE_URL=...
MIGRATE_DATABASE_URL=...
```
**Đã append thêm** các biến cần để boot, dùng giá trị DEV an toàn:
```ini
ADMIN_USERNAME=admin
ADMIN_PASSWORD=392d46940ba375af
ADMIN_EMAIL=admin@example.com
ACCESS_TOKEN_SECRET=d5bcf349efc6ddaffb70c8d5311926b53f103b0d4ac71cdd31540cbb6721aa4e
REFRESH_TOKEN_SECRET=8941f0c6ada53d63a52e9d3b33537e0c28bad3a6cc851f1de6bdf509d6d83ab2
ACCESS_TOKEN_EXPIRES_IN=25h
REFRESH_TOKEN_EXPIRES_IN=90d
APP_NAME=UBND DEV
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
OTP_EXPIRE_MINUTES=5
CORS_ORIGIN=
SWAGGER_USERNAME=swagger
SWAGGER_PASSWORD=swagger
MAIL_USER=
MAIL_PASS=
RABBITMQ_URL=
RABBITMQ_QUEUE_VIDEO_MERGE=videoMerge
RABBITMQ_QUEUE_VIDEO_HLS=videoHLS
RABBITMQ_QUEUE_EXPORT_PHAN_ANH=exportPhanAnh
RECAPTCHA_SECRET=
RECAPTCHA_VERIFY_URL=https://www.google.com/recaptcha/api/siteverify
REATE_LIMIT_FOR_UPLOAD_VIDEO_MAX=5
URL_PHAN_ANH_MANAGER=
URL_PHAN_ANH_USER=
URL_EXPORT_PHAN_ANH=
EXPO_NOTI_SERVICE_URL=
```
> ⚠️ 2 biến `ACCESS_TOKEN_SECRET`/`REFRESH_TOKEN_SECRET`/`ADMIN_PASSWORD` là **giá trị sinh ngẫu nhiên cho DEV, không an toàn cho prod/staging**. Khi team cấp `.env` đầy đủ → thay bằng giá trị thật.

---

## 2) Những file KHÔNG cần sửa (đúng chuẩn ban đầu)

- `prisma/schema.prisma` — **Task 2**: đã thêm 9 model mới (đánh giá + thư viện số). Đây là thay đổi chính chủ của task, giữ nguyên.
- `prisma/migrations/20260816171428_them_bang_danh_gia_va_thu_vien/` — migration additive (Task 2), giữ nguyên.
- `prisma/seed.js`, `prisma.config.ts` — seed DEV (Task 2), giữ nguyên.
- `database-schema-new-features.md` / `.dbml` — tài liệu Task 2, giữ nguyên.

---

## 3) Cách khôi phục khi có env đầy đủ

Khi team cấp file `.env` đầy đủ (đủ Firebase + RabbitMQ + MAIL + token thật):

### Bước 1 — Thay `.env`
Ghi đè `.env` bằng bản đầy đủ. Bản đầy đủ cần tương đương `.env.example` + **thêm** các biến Firebase (`FIREBASE_*`) + `RABBITMQ_URL` + `MAIL_USER/MAIL_PASS` + `RECAPTCHA_SECRET` + `FIREBASE_DATABASE_URL`.

Hai chỗ code chỉnh cho môi trường thiếu env sẽ **tự hết tác dụng** — không bắt buộc phải lùi code:

| Biến có trong env đầy đủ | Hệ quả |
|---|---|
| `FIREBASE_PRIVATE_KEY` + `CLIENT_EMAIL` + `PROJECT_ID` | `hasFirebaseCreds == true` → Firebase init thật, push hoạt động |
| `RABBITMQ_URL` | nhánh `if (!RABBITMQ_URL)` không chạy → kết nối RabbitMQ thật |

### Bước 2 — Kiểm tra app
```bash
npm run dev
```
Kỳ vọng: `RabbitMQ connected successfully!`, không còn warning `[Firebase]`/`[RabbitMQ] bỏ qua`, `Server is running on port: 8880`.

### Bước 3 — (tuỳ chọn) Lùi code cho gọn
Nếu muốn trả code về bản gốc (không còn lớp proxy/stub):
- `src/realtime/firebase/index.js` → khôi phục bản gốc (serviceAccount + `initializeApp` ở top-level, `export default admin`).
- `src/config/rabbitmq.config.js` → xoá khối `if (!RABBITMQ_URL) { ... }` (trả về chỉ phần connect + retry).
- Có thể giữ nguyên vì vô hại khi có đủ env, nhưng để gọn/bảo trì nên lùi.

---

## 4) Tính năng bị tạm tắt khi thiếu env (và cách bật)

| Tính năng | Trạng thái thiếu env | Cần biến để bật |
|---|---|---|
| Push FCM / notification | Tạm tắt (log warning) | bộ `FIREBASE_*` |
| Video upload → HLS (worker) | Không chạy (stub channel) | `RABBITMQ_URL` + queue |
| Export phản ánh → email (worker) | Không chạy (stub channel) | `RABBITMQ_URL` + `MAIL_USER/MAIL_PASS` |
| 2FA / reset password qua mail | Gửi mail lỗi nếu chưa có MAIL | `MAIL_USER/MAIL_PASS` + template |
| Login có recaptcha | Cần `RECAPTCHA_SECRET` | `RECAPTCHA_SECRET` |
| Đăng nhập 2FA (OTP) | Cần MAIL để gửi OTP | `MAIL_USER/MAIL_PASS` |

**Các phần KHÔNG bị ảnh hưởng (chạy bình thường):**
auth/JWT (dùng token secrets dev), CRUD phản ánh, thủ tục, tin tức, lịch tiếp dân, và **toàn bộ bảng Task 2** (đánh giá + thư viện số) — đã verify qua seed + query trực tiếp DB.

---

## 5) Kết luận
Toàn bộ chỉnh sửa phục vụ **chạy được app khi chỉ có `.env` database** (kịch bản bạn đang có). Không ảnh hưởng thiết kế DB Task 2. Khi có env đầy đủ, chỉ cần thay `.env` (và tuỳ chọn lùi 2 file code ở mục 3.3) là hệ thống chạy đúng tính năng đầy đủ như thiết kế ban đầu.