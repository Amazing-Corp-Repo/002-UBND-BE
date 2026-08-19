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

const user = await prisma.nguoi_dung.findFirst({
  where: { ten_dang_nhap: 'canbo' },
  include: {
    user_roles: {
      include: {
        roles: {
          select: { id: true, name: true }
        }
      }
    }
  }
});
console.log('User:', JSON.stringify(user, null, 2));
await prisma.$disconnect();