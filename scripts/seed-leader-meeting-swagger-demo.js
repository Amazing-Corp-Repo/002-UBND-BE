import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { hash } from "../src/utils/bcrypt.util.js";
import { LEADER_MEETING_SWAGGER_DEMO as DEMO } from "../src/swagger/leader-meeting-swagger-demo.fixture.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Thiếu DATABASE_URL");
const databaseUrl = new URL(connectionString);
const databaseName = databaseUrl.pathname.replace(/^\//, "");
const schema = databaseUrl.searchParams.get("schema") || "public";
if (!/dev/i.test(`${databaseName}/${schema}`)) {
  throw new Error("Từ chối seed: script chỉ được chạy trên database/schema DEV");
}

const options = `-c search_path="${schema}",public`;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString, options }, { schema }),
});
const date = (value) => new Date(`${value}T00:00:00.000Z`);
const operatedAt = new Date("2099-08-20T01:00:00.000Z");
const demoDocumentRelativePath = "src/private/uploads/leader-meetings/demo/tai-lieu-demo.pdf";
const demoDocument = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 30 80 Td (Tai lieu demo) Tj ET\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n",
  "utf8"
);

const slotRows = [
  ["publicCreate", "07:30", "08:00"],
  ["approve", "08:00", "08:30"],
  ["reject", "08:30", "09:00"],
  ["process", "09:00", "09:30"],
  ["complete", "09:30", "10:00"],
  ["cancel", "10:00", "10:30"],
  ["detail", "10:30", "11:00"],
  ["rated", "13:30", "14:00"],
  ["ratingCreate", "14:00", "14:30"],
];

const registrationRows = [
  ["approve", "approve", "Nguyễn Văn Chờ Duyệt"],
  ["reject", "reject", "Trần Thị Chờ Từ Chối"],
  ["process", "process", "Lê Văn Đã Duyệt"],
  ["complete", "complete", "Phạm Thị Đang Xử Lý"],
  ["cancel", "cancel", "Hoàng Văn Chờ Hủy"],
  ["detail", "detail", "Đỗ Thị Hồ Sơ Chi Tiết"],
  ["rated", "rated", "Võ Văn Đã Đánh Giá"],
  ["ratingCreate", "ratingCreate", "Bùi Thị Chờ Đánh Giá"],
];

function workflowFields(status, leaderId) {
  return {
    trang_thai: status,
    thoi_gian_phe_duyet: status === "PENDING" ? null : operatedAt,
    nguoi_duyet_don: status === "PENDING" ? null : leaderId,
    thoi_gian_bat_dau_xu_ly: ["IN_PROGRESS", "COMPLETED"].includes(status) ? operatedAt : null,
    nguoi_bat_dau_xu_ly: ["IN_PROGRESS", "COMPLETED"].includes(status) ? leaderId : null,
    thoi_gian_hoan_thanh: status === "COMPLETED" ? operatedAt : null,
    nguoi_hoan_thanh: status === "COMPLETED" ? leaderId : null,
    thoi_gian_tu_choi: status === "REJECTED" ? operatedAt : null,
    nguoi_tu_choi: status === "REJECTED" ? leaderId : null,
    ly_do_tu_choi: status === "REJECTED" ? "Dữ liệu demo từ chối" : null,
    thoi_gian_huy: status === "CANCELED" ? operatedAt : null,
    nguoi_huy: status === "CANCELED" ? leaderId : null,
    ly_do_huy: status === "CANCELED" ? "Dữ liệu demo hủy" : null,
  };
}

async function main() {
  const leaderRole = await prisma.roles.findFirst({
    where: { name: { in: ["LANH_DAO", "LEADER"] }, is_active: true, is_delete: false },
  });
  if (!leaderRole) throw new Error("Chưa có role LANH_DAO/LEADER để seed Swagger");

  const password = await hash(DEMO.auth.password);
  for (let index = 0; index < DEMO.leaders.length; index += 1) {
    const leader = DEMO.leaders[index];
    await prisma.nguoi_dung.upsert({
      where: { id: leader.id },
      update: {
        ten_dang_nhap: leader.username,
        mat_khau: password,
        ho_va_ten: leader.name,
        is_active: true,
        is_delete: false,
        fcm_token: [],
      },
      create: {
        id: leader.id,
        ten_dang_nhap: leader.username,
        mat_khau: password,
        ho_va_ten: leader.name,
        email: `swagger.leader.meeting.${index + 1}@example.local`,
        is_active: true,
        is_delete: false,
        fcm_token: [],
      },
    });
    await prisma.user_roles.upsert({
      where: { user_id_role_id: { user_id: leader.id, role_id: leaderRole.id } },
      update: {},
      create: { user_id: leader.id, role_id: leaderRole.id },
    });
  }

  const scheduleRows = [
    ["main", 0, "2099-08-25", true, "Lịch chính chạy demo Swagger"],
    ["update", 0, "2099-08-26", true, "Lịch dùng thử API cập nhật"],
    ["status", 0, "2099-08-27", true, "Lịch dùng thử API trạng thái"],
    ["deletion", 0, "2099-08-28", true, "Lịch dùng thử API xóa"],
    ["leader2", 1, "2099-08-25", true, "Lịch mẫu lãnh đạo 2"],
    ["leader3", 2, "2099-08-25", true, "Lịch mẫu lãnh đạo 3"],
  ];
  for (const [key, leaderIndex, receptionDate, active, note] of scheduleRows) {
    const leader = DEMO.leaders[leaderIndex];
    await prisma.lich_gap_lanh_dao.upsert({
      where: { id: DEMO.schedules[key] },
      update: { ngay: date(receptionDate), dia_diem: "Phòng tiếp công dân", ghi_chu: note, is_active: active, is_delete: false },
      create: { id: DEMO.schedules[key], id_lanh_dao: leader.id, ngay: date(receptionDate), dia_diem: "Phòng tiếp công dân", ghi_chu: note, is_active: active, is_delete: false, nguoi_tao: leader.id },
    });
  }

  for (const [key, startTime, endTime] of slotRows) {
    await prisma.khung_gio_gap_lanh_dao.upsert({
      where: { id: DEMO.slots[key] },
      update: { gio_bat_dau: startTime, gio_ket_thuc: endTime, suc_chua: 1, is_active: true, is_delete: false },
      create: { id: DEMO.slots[key], id_lich_gap: DEMO.schedules.main, gio_bat_dau: startTime, gio_ket_thuc: endTime, suc_chua: 1, is_active: true, is_delete: false, nguoi_tao: DEMO.leaders[0].id },
    });
  }

  for (let index = 0; index < registrationRows.length; index += 1) {
    const [registrationKey, slotKey, fullName] = registrationRows[index];
    const fixture = DEMO.registrations[registrationKey];
    const state = workflowFields(fixture.status, DEMO.leaders[0].id);
    await prisma.dang_ky_gap_lanh_dao.upsert({
      where: { id: fixture.id },
      update: { ...state, is_active: true, is_delete: false },
      create: {
        id: fixture.id,
        ma_dang_ky: fixture.code,
        id_khung_gio_gap: DEMO.slots[slotKey],
        ngay_hen: date(DEMO.appointmentDate),
        chu_de: "Kiến nghị về thủ tục hành chính",
        ho_ten: fullName,
        sdt: `09031000${String(index + 1).padStart(2, "0")}`,
        cccd: `042310000${String(index + 1).padStart(3, "0")}`,
        ngay_cap_cccd: date("2021-05-20"),
        noi_cap_cccd: "Cục Cảnh sát QLHC về TTXH",
        dia_chi: "Phường Thành Sen, tỉnh Hà Tĩnh",
        ngay_lam_don: date("2099-08-20"),
        ly_do: `Nội dung demo Swagger cho luồng ${registrationKey}`,
        ...state,
        nguoi_tao: DEMO.leaders[0].id,
      },
    });
  }

  const demoDocumentPath = path.resolve(process.cwd(), demoDocumentRelativePath);
  await mkdir(path.dirname(demoDocumentPath), { recursive: true });
  await writeFile(demoDocumentPath, demoDocument);

  await prisma.dinh_kem_dang_ky_gap_lanh_dao.upsert({
    where: { id: DEMO.attachmentId },
    update: {
      id_dang_ky: DEMO.registrations.detail.id,
      loai_dinh_kem: "SUPPORTING_DOCUMENT",
      ten_file_goc: "tai-lieu-demo.pdf",
      duong_dan_file: demoDocumentRelativePath,
      mime_type: "application/pdf",
      kich_thuoc: demoDocument.length,
    },
    create: {
      id: DEMO.attachmentId,
      id_dang_ky: DEMO.registrations.detail.id,
      loai_dinh_kem: "SUPPORTING_DOCUMENT",
      ten_file_goc: "tai-lieu-demo.pdf",
      duong_dan_file: demoDocumentRelativePath,
      mime_type: "application/pdf",
      kich_thuoc: demoDocument.length,
    },
  });

  await prisma.danh_gia_gap_lanh_dao.upsert({
    where: { id: DEMO.ratingId },
    update: {
      id_dang_ky_gap_lanh_dao: DEMO.registrations.rated.id,
      diem_tong: 5,
      ly_do: ["Lãnh đạo lắng nghe và giải thích rõ ràng"],
      nhan_xet: "Dữ liệu đánh giá mẫu chạy Swagger.",
      is_active: true,
      is_delete: false,
    },
    create: {
      id: DEMO.ratingId,
      id_dang_ky_gap_lanh_dao: DEMO.registrations.rated.id,
      diem_tong: 5,
      ly_do: ["Lãnh đạo lắng nghe và giải thích rõ ràng"],
      nhan_xet: "Dữ liệu đánh giá mẫu chạy Swagger.",
    },
  });

  console.log("Đã seed dữ liệu Swagger đăng ký gặp lãnh đạo trên DEV:");
  console.log(`- Tài khoản: ${DEMO.auth.username} / ${DEMO.auth.password}`);
  console.log("- 3 lãnh đạo, 6 lịch, 9 khung giờ, 8 đơn, 1 tài liệu và 1 đánh giá");
  console.log("- Script chỉ upsert fixture cố định, không xóa dữ liệu đã phát sinh khi demo.");
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
