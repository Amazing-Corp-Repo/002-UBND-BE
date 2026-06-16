// Prisma 7 config. ENV không còn được auto-load (khác v6) → nạp .env thủ công.
// Trong Docker/CI, biến môi trường được inject qua container nên dotenv chỉ là no-op an toàn.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // Prisma 7: connection URL phải nằm ở đây (không còn trong schema). Dùng cho migrate/db CLI.
  // CLI migrate chạy DDL (ALTER/CREATE) nên cần user OWNER bảng (ubnd_admin), khác với runtime
  // dùng user hạn chế (user_staging) qua DATABASE_URL. Ưu tiên MIGRATE_DATABASE_URL, fallback
  // DATABASE_URL nếu không set. Dùng process.env trực tiếp (KHÔNG dùng helper env() — nó ném lỗi
  // khi biến vắng mặt → fail `prisma generate` ở Docker build stage chưa có .env). Runtime kết nối
  // qua driver adapter trong src/config/database.config.js (luôn dùng DATABASE_URL).
  datasource: {
    url: process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL,
  },
});
