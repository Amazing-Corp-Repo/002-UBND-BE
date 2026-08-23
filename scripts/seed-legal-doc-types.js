import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const schemaMatch = connectionString?.match(/[?&]schema=([^&]+)/);
const schema = schemaMatch ? decodeURIComponent(schemaMatch[1]) : undefined;

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool, { schema });
const prisma = new PrismaClient({ adapter });

const LEGAL_TYPES = [
  { id: '00000000-0000-4000-8000-000000000511', ten: 'Quyết định', mo_ta: 'Quyết định quy phạm pháp luật và cá biệt', icon: 'FileText', tone: 'blue', thu_tu: 10 },
  { id: '00000000-0000-4000-8000-000000000512', ten: 'Nghị định', mo_ta: 'Nghị định của Chính phủ', icon: 'FileText', tone: 'green', thu_tu: 11 },
  { id: '00000000-0000-4000-8000-000000000513', ten: 'Thông tư', mo_ta: 'Thông tư của các Bộ, ngành', icon: 'FileText', tone: 'indigo', thu_tu: 12 },
  { id: '00000000-0000-4000-8000-000000000514', ten: 'Nghị quyết', mo_ta: 'Nghị quyết của Quốc hội, HĐND', icon: 'FileText', tone: 'red', thu_tu: 13 },
  { id: '00000000-0000-4000-8000-000000000515', ten: 'Luật', mo_ta: 'Luật và Bộ luật', icon: 'Book', tone: 'amber', thu_tu: 14 },
  { id: '00000000-0000-4000-8000-000000000516', ten: 'Chỉ thị', mo_ta: 'Chỉ thị điều hành', icon: 'AlertCircle', tone: 'orange', thu_tu: 15 },
  { id: '00000000-0000-4000-8000-000000000517', ten: 'Quy chế / Quy định', mo_ta: 'Quy chế và quy định áp dụng', icon: 'FileCode', tone: 'teal', thu_tu: 16 },
  { id: '00000000-0000-4000-8000-000000000518', ten: 'Kế hoạch', mo_ta: 'Kế hoạch triển khai, thực hiện', icon: 'Calendar', tone: 'purple', thu_tu: 17 },
  { id: '00000000-0000-4000-8000-000000000519', ten: 'Báo cáo', mo_ta: 'Báo cáo định kỳ và chuyên đề', icon: 'BarChart', tone: 'cyan', thu_tu: 18 },
  { id: '00000000-0000-4000-8000-000000000520', ten: 'Công văn', mo_ta: 'Công văn hành chính và hướng dẫn', icon: 'Mail', tone: 'slate', thu_tu: 19 },
  { id: '00000000-0000-4000-8000-000000000521', ten: 'Hướng dẫn', mo_ta: 'Văn bản hướng dẫn chuyên môn', icon: 'HelpCircle', tone: 'sky', thu_tu: 20 },
  { id: '00000000-0000-4000-8000-000000000522', ten: 'Thông báo', mo_ta: 'Thông báo triển khai các quy định', icon: 'Bell', tone: 'rose', thu_tu: 21 },
];

for (const item of LEGAL_TYPES) {
  await prisma.thu_vien_danh_muc.upsert({
    where: { id: item.id },
    update: { ten: item.ten, mo_ta: item.mo_ta, icon: item.icon, tone: item.tone, thu_tu: item.thu_tu },
    create: item,
  });
}

console.log('Seeded legal doc types successfully!');

await prisma.$disconnect();
await pool.end();
