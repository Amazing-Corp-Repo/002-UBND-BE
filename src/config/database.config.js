import { PrismaPg } from '@prisma/adapter-pg';
// Prisma 7 sinh client dưới dạng TypeScript (.ts). App chạy qua Node native type-stripping
// (cờ --experimental-strip-types trong scripts) nên import thẳng file .ts.
import { PrismaClient } from '../generated/prisma/client.ts';

// Prisma 7: driver adapter là bắt buộc, không còn dùng `new PrismaClient()` với mỗi DATABASE_URL.
// Lưu ý: pg mặc định KHÔNG có connectionTimeout (v6 trước đây là 5s) — chỉnh ở đây nếu cần.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({ adapter });

export default prisma;