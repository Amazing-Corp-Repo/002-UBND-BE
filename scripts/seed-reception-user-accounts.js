import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { hash } from "../src/utils/bcrypt.util.js";
import { PERMISSION_DESC } from "../src/constants/permission.constant.js";

const apply = process.argv.includes("--apply");
const resetPasswords = process.argv.includes("--reset-passwords");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error("Thiếu DATABASE_URL");

const databaseUrl = new URL(connectionString);
const schema = databaseUrl.searchParams.get("schema") || "public";
const databaseName = databaseUrl.pathname.replace(/^\//, "");
if (!/dev/i.test(`${databaseName}/${schema}`)) {
  throw new Error("Từ chối seed: script chỉ được chạy trên database/schema DEV");
}

const options = schema ? `-c search_path="${schema}",public` : undefined;
const adapter = new PrismaPg(
  { connectionString, options },
  schema ? { schema } : undefined
);
const prisma = new PrismaClient({ adapter });

const officerAccounts = [
  ["canbo1", "Nguyễn Văn An", "canbo1@tangnhonphu.local", "0901000001"],
  ["canbo2", "Trần Thị Bình", "canbo2@tangnhonphu.local", "0901000002"],
  ["canbo3", "Lê Văn Cường", "canbo3@tangnhonphu.local", "0901000003"],
  ["canbo4", "Phạm Thị Dung", "canbo4@tangnhonphu.local", "0901000004"],
  ["canbo5", "Hoàng Văn Em", "canbo5@tangnhonphu.local", "0901000005"],
  ["canbo6", "Võ Thị Giang", "canbo6@tangnhonphu.local", "0901000006"],
  ["canbo7", "Đặng Văn Hùng", "canbo7@tangnhonphu.local", "0901000007"],
  ["canbo8", "Bùi Thị Lan", "canbo8@tangnhonphu.local", "0901000008"],
].map(([username, fullName, email, phone]) => ({
  username,
  fullName,
  email,
  phone,
  accountType: "OFFICER",
}));

const leaderAccounts = Array.from({ length: 5 }, (_, index) => {
  const number = index + 1;
  return {
    username: `lanhdao${number}`,
    fullName: `Lãnh đạo ${String(number).padStart(2, "0")}`,
    email: `lanhdao${number}@tangnhonphu.local`,
    phone: `090200000${number}`,
    accountType: "LEADER",
  };
});

const accounts = [...officerAccounts, ...leaderAccounts];
const passwords = {
  OFFICER: "Canbo@2026",
  LEADER: "Lanhdao@2026",
};

const officerPermissionCodes = [
  "LTD_GET_ALL",
  "RR_GET_ALL",
  "RR_GET_DETAIL",
  "RR_APPROVE",
  "RR_COMPLETE",
  "RR_REJECT",
];

const leaderPermissionCodes = [
  "LTD_CREATE",
  "LTD_UPDATE",
  "LTD_DELETE",
  "LTD_UPDATE_STATUS",
  "LTD_GET_TEMPLATE",
  "LTD_GET_ALL",
  "RR_GET_ALL",
  "RR_GET_DETAIL",
  "RRT_GET_ALL",
  "RRT_GET_DETAIL",
  "RRT_GET_STATS",
  "LMS_GET_ALL",
  "LMS_GET_DETAIL",
  "LMS_CREATE",
  "LMS_UPDATE",
  "LMS_UPDATE_STATUS",
  "LMS_DELETE",
  "LMR_GET_ALL",
  "LMR_GET_DETAIL",
  "LMR_APPROVE",
  "LMR_REJECT",
  "LMR_PROCESS",
  "LMR_COMPLETE",
  "LMR_CANCEL",
  "LMRT_GET_ALL",
  "LMRT_GET_DETAIL",
  "LMRT_GET_STATS",
];

async function findRole(candidateNames) {
  return prisma.roles.findFirst({
    where: {
      name: { in: candidateNames },
      is_active: true,
      is_delete: false,
    },
    orderBy: { name: "asc" },
  });
}

async function loadContext() {
  const [officerRole, leaderRole, existingAccounts] = await Promise.all([
    findRole(["CHUYEN_VIEN", "CAN_BO", "OFFICER"]),
    findRole(["LANH_DAO", "LEADER"]),
    prisma.nguoi_dung.findMany({
      where: { ten_dang_nhap: { in: accounts.map((account) => account.username) } },
      select: {
        id: true,
        ten_dang_nhap: true,
        ho_va_ten: true,
        email: true,
        so_dien_thoai: true,
        is_active: true,
        is_delete: true,
        user_roles: { select: { roles: { select: { name: true } } } },
      },
      orderBy: { ten_dang_nhap: "asc" },
    }),
  ]);

  if (!officerRole) throw new Error("Không tìm thấy role CHUYEN_VIEN/CAN_BO/OFFICER đang hoạt động");
  if (!leaderRole) throw new Error("Không tìm thấy role LANH_DAO/LEADER đang hoạt động");

  return { officerRole, leaderRole, existingAccounts };
}

async function ensureRolePermissions(tx, roleId, permissionCodes) {
  await tx.permissions.createMany({
    data: permissionCodes.map((code) => ({
      code,
      description: PERMISSION_DESC[code] || code,
    })),
    skipDuplicates: true,
  });
  await tx.role_permissions.createMany({
    data: permissionCodes.map((permission_code) => ({ role_id: roleId, permission_code })),
    skipDuplicates: true,
  });
}

async function seedAccount(tx, account, roleId, passwordHash) {
  const existing = await tx.nguoi_dung.findUnique({
    where: { ten_dang_nhap: account.username },
    select: { id: true, email: true, so_dien_thoai: true },
  });

  const commonData = {
    ho_va_ten: account.fullName,
    is_enable_two_factor: false,
    is_active: true,
    is_delete: false,
    fcm_token: [],
    thoi_gian_cap_nhat: new Date(),
  };

  const user = existing
    ? await tx.nguoi_dung.update({
        where: { id: existing.id },
        data: {
          ...commonData,
          email: existing.email || account.email,
          so_dien_thoai: existing.so_dien_thoai || account.phone,
          ...(resetPasswords ? { mat_khau: passwordHash } : {}),
        },
      })
    : await tx.nguoi_dung.create({
        data: {
          ten_dang_nhap: account.username,
          mat_khau: passwordHash,
          email: account.email,
          so_dien_thoai: account.phone,
          ...commonData,
        },
      });

  await tx.user_roles.upsert({
    where: { user_id_role_id: { user_id: user.id, role_id: roleId } },
    update: {},
    create: { user_id: user.id, role_id: roleId },
  });

  return { username: account.username, action: existing ? "UPDATED" : "CREATED" };
}

async function main() {
  const context = await loadContext();
  const audit = {
    mode: apply ? "APPLY" : "DRY_RUN",
    database: databaseName,
    schema,
    roles: {
      officer: context.officerRole.name,
      leader: context.leaderRole.name,
    },
    requested: { officers: officerAccounts.length, leaders: leaderAccounts.length },
    existing: context.existingAccounts,
  };

  if (!apply) {
    console.log(JSON.stringify(audit, null, 2));
    return;
  }

  const officerPasswordHash = await hash(passwords.OFFICER);
  const leaderPasswordHash = await hash(passwords.LEADER);
  const results = await prisma.$transaction(async (tx) => {
    await ensureRolePermissions(tx, context.officerRole.id, officerPermissionCodes);
    await ensureRolePermissions(tx, context.leaderRole.id, leaderPermissionCodes);

    const seeded = [];
    for (const account of accounts) {
      seeded.push(await seedAccount(
        tx,
        account,
        account.accountType === "OFFICER" ? context.officerRole.id : context.leaderRole.id,
        account.accountType === "OFFICER" ? officerPasswordHash : leaderPasswordHash
      ));
    }
    return seeded;
  }, { maxWait: 10_000, timeout: 120_000 });

  const verification = await prisma.nguoi_dung.findMany({
    where: { ten_dang_nhap: { in: accounts.map((account) => account.username) } },
    select: {
      ten_dang_nhap: true,
      ho_va_ten: true,
      email: true,
      so_dien_thoai: true,
      is_active: true,
      is_delete: true,
      user_roles: {
        select: {
          roles: {
            select: {
              name: true,
              role_permissions: { select: { permission_code: true } },
            },
          },
        },
      },
    },
    orderBy: { ten_dang_nhap: "asc" },
  });

  console.log(JSON.stringify({ ...audit, resetPasswords, results, verification }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
