# 👥 Hướng dẫn cài đặt cho member team (dự án UBND-BE)

> File `.env` bạn nhận được từ thành viên nhóm chứa đầy đủ thông tin connect DB dev chung (Render)
> để chạy project. Các bước dưới đây giúp bạn lên app nhanh.

---

## 1) Nhận file `.env`

- Lấy file `.env` từ member nhóm (qua chat/email/mail — **không commit lên git**).
- Đặt vào **thư mục gốc project**, đường dẫn:
  ```
  D:\FPT\project\SOS-TĂNG NHƠN PHÚ\src\002-UBND-BE\.env
  ```
- Nếu thư mục đã có sẵn `.env`, ghi đè bằng file nhận được.

> 🔒 File chứa password DB + JWT secret — **chỉ gửi cho người trong nhóm**, không đăng công khai.

## 2) Đảm bảo pull code MỚI NHẤT

Trước khi chạy, nhớ pull về các file fallback môi trường:
```
git pull
```
(Cụ thể: `src/realtime/firebase/index.js`, `src/config/rabbitmq.config.js` — bản đã chỉnh để app boot được khi chưa có Firebase/RabbitMQ.)

## 3) Cài đặt & chạy

```
npm install
npx prisma generate
npm run dev
```

## 4) Kết quả kỳ vọng

Thấy các dòng:
```
[RabbitMQ] Chưa có RABBITMQ_URL — bỏ qua hàng đợi ...
Server is running on port: 8880
Admin account đã tạo: admin / 392d46940ba375af
```

Truy cập:
- **Swagger API**: `http://localhost:8880/api-docs` → tài khoản `swagger` / `swagger`
- **Xem DB / dữ liệu Task 2** (đã seed sẵn trên DB chung): `npx prisma studio` → `http://localhost:5555`

> ⚠️ Các warning `[Firebase]` / `[RabbitMQ]` / SSL là **bình thường** — do chưa có credentials của các dịch vụ đó, không phải lỗi. Tính năng push/video/export sẽ tạm tắt; mọi CRUD + bảng Task 2 chạy bình thường.

## 5) Docker/dev theo chuẩn BE (nhắc nhanh)

- Nhánh làm việc: `staging`
- Migration mới: `prisma migrate dev --name <ten>` ở DB cục bộ, giữ schema-agnostic, rồi `migrate deploy` lên staging/prod. **Không** migrate dev/reset lên server.
- Backup (`pg_dump`) trước khi deploy prod.