// Prisma 7 config. ENV không còn được auto-load (khác v6) → nạp .env thủ công.
// Trong Docker/CI, biến môi trường được inject qua container nên dotenv chỉ là no-op an toàn.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // Prisma 7: connection URL phải nằm ở đây (không còn trong schema). Dùng cho migrate/db CLI.
  // Dùng process.env trực tiếp (KHÔNG dùng helper env() vì nó ném lỗi khi biến vắng mặt —
  // sẽ làm `prisma generate` fail ở Docker build stage nơi chưa có .env). Runtime kết nối
  // qua driver adapter trong src/config/database.config.js.
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
