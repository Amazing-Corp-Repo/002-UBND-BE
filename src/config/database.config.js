import { PrismaPg } from '@prisma/adapter-pg';
// Prisma 7 sinh client dưới dạng TypeScript (.ts). App chạy qua Node native type-stripping
// (cờ --experimental-strip-types trong scripts) nên import thẳng file .ts.
import { PrismaClient } from '../generated/prisma/client.ts';

// Prisma 7: driver adapter là bắt buộc, không còn dùng `new PrismaClient()` với mỗi DATABASE_URL.
// Lưu ý: pg mặc định KHÔNG có connectionTimeout (v6 trước đây là 5s) — chỉnh ở đây nếu cần.
const connectionString = process.env.DATABASE_URL;

// QUAN TRỌNG: driver adapter của v7 KHÔNG tự áp tham số `?schema=` của connection string
// như query engine của v6. Phải đọc schema từ URL và truyền tường minh cho PrismaPg, nếu không
// adapter mặc định dùng `public` → query nhầm schema → lỗi "table does not exist".
const schemaMatch = connectionString?.match(/[?&]schema=([^&]+)/);
const schema = schemaMatch ? decodeURIComponent(schemaMatch[1]) : undefined;

const adapter = new PrismaPg({ connectionString }, schema ? { schema } : undefined);

const prisma = new PrismaClient({ adapter });

export default prisma;