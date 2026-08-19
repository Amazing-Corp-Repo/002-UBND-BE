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

const CAN_BO_ROLE_ID = '944f02bf-f49b-4049-8ed4-134cbacbefd6';
const USER_ID = '9a75d9ae-e52f-4a1b-8e49-f19d4b5168ea';

// Check if user already has this role
const existingRole = await prisma.user_roles.findUnique({
  where: {
    user_id_role_id: {
      user_id: USER_ID,
      role_id: CAN_BO_ROLE_ID
    }
  }
});

if (existingRole) {
  console.log('User already has CÁN_BỘ role');
} else {
  // Assign CÁN_BỘ role to user
  await prisma.user_roles.create({
    data: {
      user_id: USER_ID,
      role_id: CAN_BO_ROLE_ID,
    }
  });
  console.log('Assigned CÁN_BỘ role to user canbo');
}

// Verify
const userRoles = await prisma.user_roles.findMany({
  where: { user_id: USER_ID },
  include: {
    roles: { select: { id: true, name: true } }
  }
});
console.log('User roles:', JSON.stringify(userRoles, null, 2));
await prisma.$disconnect();