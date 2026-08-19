import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { hash } from "../src/utils/bcrypt.util.js";
import { RECEPTION_SWAGGER_DEMO as DEMO } from "../src/swagger/reception-swagger-demo.fixture.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Thiếu DATABASE_URL");
const databaseUrl = new URL(connectionString);
const schema = databaseUrl.searchParams.get("schema") || "";
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
const date = (value) => new Date(`${value}T00:00:00.000Z`);
const now = new Date("2099-08-19T01:00:00.000Z");
const permissions = [
  "LTD_CREATE", "LTD_UPDATE", "LTD_DELETE", "LTD_UPDATE_STATUS",
  "LTD_GET_TEMPLATE", "LTD_GET_ALL", "RR_GET_ALL", "RR_GET_DETAIL",
  "RR_APPROVE", "RR_COMPLETE", "RR_REJECT", "RRT_GET_ALL",
  "RRT_GET_DETAIL", "RRT_GET_STATS",
];

const schedules = [
  ["main", "Cán bộ Swagger chính", true, "Dữ liệu demo danh sách và đăng ký"],
  ["capacity", "Cán bộ Swagger sức chứa", true, "Dữ liệu demo cập nhật sức chứa"],
  ["update", "Cán bộ Swagger cập nhật", true, "Dữ liệu demo cập nhật lịch"],
  ["deletion", "Cán bộ Swagger xóa", false, "Dữ liệu demo xóa lịch"],
  ["status", "Cán bộ Swagger trạng thái", true, "Dữ liệu demo đổi trạng thái"],
];

const registrationRows = [
  ["detail", "PENDING", null, "Nguyễn Văn Chi Tiết"],
  ["approve", "PENDING", null, "Nguyễn Văn Chờ Duyệt"],
  ["complete", "APPROVED", "QUAY_2", "Nguyễn Văn Đã Duyệt"],
  ["reject", "PENDING", null, "Nguyễn Văn Chờ Từ Chối"],
  ["ratingLookup", "COMPLETED", "QUAY_4", "Nguyễn Văn Tra Đánh Giá"],
  ["rated", "COMPLETED", "QUAY_5", "Nguyễn Văn Đã Đánh Giá"],
  ["ratingCreate", "COMPLETED", "QUAY_6", "Nguyễn Văn Gửi Đánh Giá"],
];

async function removeCreatedSwaggerSchedules() {
  const officers = [
    DEMO.createScheduleOfficer,
    "Cán bộ Swagger Import Sáng",
    "Cán bộ Swagger Import Chiều",
  ];
  const candidates = await prisma.lich_tiep_dan.findMany({
    where: { ten_can_bo: { in: officers } },
    select: { id: true, _count: { select: { dang_ky_tiep_dan: true } } },
  });
  for (const candidate of candidates) {
    if (candidate._count.dang_ky_tiep_dan > 0) continue;
    await prisma.khung_gio_tiep_dan.deleteMany({ where: { id_lich_tiep_dan: candidate.id } });
    await prisma.lich_tiep_dan.delete({ where: { id: candidate.id } });
  }
}

async function main() {
  await removeCreatedSwaggerSchedules();
  await prisma.danh_gia_tiep_dan.deleteMany({
    where: { id_dang_ky_tiep_dan: DEMO.registrations.ratingCreate.id },
  });
  await prisma.dang_ky_tiep_dan.deleteMany({
    where: {
      OR: [
        { sdt: DEMO.publicRegistration.phone },
        { cccd: DEMO.publicRegistration.citizenId },
      ],
      ma_tiep_dan: { not: { startsWith: "SWG" } },
    },
  });

  for (const code of permissions) {
    await prisma.permissions.upsert({
      where: { code },
      update: {},
      create: { code, description: `Quyền demo Swagger ${code}` },
    });
  }
  await prisma.roles.upsert({
    where: { id: DEMO.auth.roleId },
    update: { name: "SWAGGER_RECEPTION_DEMO", is_active: true, is_delete: false },
    create: {
      id: DEMO.auth.roleId,
      name: "SWAGGER_RECEPTION_DEMO",
      description: "Role DEV chạy thử API tiếp dân trên Swagger",
    },
  });
  for (const permission_code of permissions) {
    await prisma.role_permissions.upsert({
      where: { role_id_permission_code: { role_id: DEMO.auth.roleId, permission_code } },
      update: {},
      create: { role_id: DEMO.auth.roleId, permission_code },
    });
  }
  const password = await hash(DEMO.auth.password);
  await prisma.nguoi_dung.upsert({
    where: { id: DEMO.auth.userId },
    update: {
      ten_dang_nhap: DEMO.auth.username,
      mat_khau: password,
      ho_va_ten: "Cán bộ Demo Swagger",
      is_active: true,
      is_delete: false,
      fcm_token: [],
    },
    create: {
      id: DEMO.auth.userId,
      ten_dang_nhap: DEMO.auth.username,
      mat_khau: password,
      ho_va_ten: "Cán bộ Demo Swagger",
      email: "swagger.reception.demo@example.local",
      is_active: true,
      is_delete: false,
      fcm_token: [],
    },
  });
  await prisma.user_roles.upsert({
    where: { user_id_role_id: { user_id: DEMO.auth.userId, role_id: DEMO.auth.roleId } },
    update: {},
    create: { user_id: DEMO.auth.userId, role_id: DEMO.auth.roleId },
  });

  for (const [key, officer, active, note] of schedules) {
    await prisma.lich_tiep_dan.upsert({
      where: { id: DEMO.schedules[key] },
      update: {
        dia_diem: "Bộ phận tiếp công dân",
        ten_can_bo: officer,
        thoi_gian: "07:30 - 08:30",
        ngay_tiep_dan: date(DEMO.dates[key]),
        ghi_chu: note,
        is_active: active,
        is_delete: false,
        nguoi_cap_nhat: DEMO.auth.userId,
      },
      create: {
        id: DEMO.schedules[key],
        dia_diem: "Bộ phận tiếp công dân",
        ten_can_bo: officer,
        thoi_gian: "07:30 - 08:30",
        ngay_tiep_dan: date(DEMO.dates[key]),
        ghi_chu: note,
        is_active: active,
        is_delete: false,
        nguoi_tao: DEMO.auth.userId,
      },
    });
    for (let counter = 1; counter <= 8; counter += 1) {
      const offset = schedules.findIndex(([scheduleKey]) => scheduleKey === key) * 100 + counter;
      const slotId = `20000000-0000-4000-8000-${String(offset).padStart(12, "0")}`;
      await prisma.khung_gio_tiep_dan.upsert({
        where: { id: slotId },
        update: { suc_chua: 2, is_active: true, is_delete: false },
        create: {
          id: slotId,
          id_lich_tiep_dan: DEMO.schedules[key],
          khung_gio: "07:30 - 08:30",
          ma_quay: `QUAY_${counter}`,
          suc_chua: 2,
          nguoi_tao: DEMO.auth.userId,
        },
      });
    }
  }

  for (let index = 0; index < registrationRows.length; index += 1) {
    const [key, status, department, fullName] = registrationRows[index];
    const fixture = DEMO.registrations[key];
    const stateFields = {
      trang_thai: status,
      bo_phan: department,
      ten_lanh_dao: status === "PENDING" ? null : "Cán bộ Demo Swagger",
      chuc_vu_lanh_dao: status === "PENDING" ? null : "Cán bộ tiếp dân",
      thoi_gian_phe_duyet: status === "PENDING" ? null : now,
      thoi_gian_hoan_thanh: status === "COMPLETED" ? now : null,
      nguoi_hoan_thanh: status === "COMPLETED" ? DEMO.auth.userId : null,
      ly_do_tu_choi: null,
      thoi_gian_tu_choi: null,
      nguoi_tu_choi: null,
    };
    await prisma.dang_ky_tiep_dan.upsert({
      where: { id: fixture.id },
      update: { ...stateFields, is_active: true, is_delete: false },
      create: {
        id: fixture.id,
        ma_tiep_dan: fixture.code,
        loai: "COUNTER_RECEPTION",
        id_lich_tiep_dan: DEMO.schedules.main,
        ngay: date(DEMO.dates.main),
        slot: "07:30 - 08:30",
        chu_de: "Hướng dẫn thủ tục hành chính",
        ly_do: `Nội dung demo Swagger cho luồng ${key}`,
        ho_ten: fullName,
        sdt: `09020000${String(index + 1).padStart(2, "0")}`,
        cccd: `042299800${String(index + 1).padStart(3, "0")}`,
        dia_chi: "Phường Thành Sen, tỉnh Hà Tĩnh",
        ...stateFields,
        nguoi_tao: DEMO.auth.userId,
      },
    });
  }

  await prisma.danh_gia_tiep_dan.upsert({
    where: { id: DEMO.ratingId },
    update: {
      id_dang_ky_tiep_dan: DEMO.registrations.rated.id,
      diem_tong: 5,
      ly_do: ["Cán bộ rất tận tình và chuyên nghiệp"],
      nhan_xet: "Dữ liệu đánh giá mẫu để chạy Swagger.",
      is_active: true,
      is_delete: false,
      thoi_gian_tao: new Date("2099-08-25T01:35:00.000Z"),
    },
    create: {
      id: DEMO.ratingId,
      id_dang_ky_tiep_dan: DEMO.registrations.rated.id,
      diem_tong: 5,
      ly_do: ["Cán bộ rất tận tình và chuyên nghiệp"],
      nhan_xet: "Dữ liệu đánh giá mẫu để chạy Swagger.",
      nguoi_tao: DEMO.auth.userId,
      thoi_gian_tao: new Date("2099-08-25T01:35:00.000Z"),
    },
  });

  console.log("Đã seed dữ liệu Swagger tiếp dân trên DEV:");
  console.log(`- Tài khoản: ${DEMO.auth.username}`);
  console.log(`- Lịch mẫu: ${schedules.length}; đơn mẫu: ${registrationRows.length}; đánh giá mẫu: 1`);
  console.log("- Có thể chạy lại lệnh seed để khôi phục trạng thái demo ban đầu.");
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
