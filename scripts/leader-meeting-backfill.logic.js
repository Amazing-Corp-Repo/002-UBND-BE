const SLOT_PATTERN = /^\s*([01]?\d|2[0-3]):([0-5]\d)\s*-\s*([01]?\d|2[0-3]):([0-5]\d)\s*$/;

const STATUS_MAP = new Map([
  ["PENDING", "PENDING"],
  ["CHO_PHE_DUYET", "PENDING"],
  ["APPROVED", "APPROVED"],
  ["DA_PHE_DUYET", "APPROVED"],
  ["IN_PROGRESS", "IN_PROGRESS"],
  ["DANG_XU_LY", "IN_PROGRESS"],
  ["COMPLETED", "COMPLETED"],
  ["HOAN_THANH", "COMPLETED"],
  ["REJECTED", "REJECTED"],
  ["TU_CHOI", "REJECTED"],
  ["CANCELED", "CANCELED"],
  ["CANCELLED", "CANCELED"],
  ["DA_HUY", "CANCELED"],
]);

function normalizeKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "D")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

export function parseLegacySlot(value) {
  const match = SLOT_PATTERN.exec(String(value ?? ""));
  if (!match) return null;

  const start = `${match[1].padStart(2, "0")}:${match[2]}`;
  const end = `${match[3].padStart(2, "0")}:${match[4]}`;
  if (start >= end) return null;
  return { start, end };
}

export function normalizeLegacyStatus(value) {
  return STATUS_MAP.get(normalizeKey(value)) ?? null;
}

export function resolveLeaderId(registration, leaderMap = {}) {
  const byId = leaderMap.byRegistrationId?.[registration.id];
  if (byId) return byId;

  const originalName = String(registration.ten_lanh_dao ?? "").trim();
  return (
    leaderMap.byLeaderName?.[originalName] ??
    leaderMap.byLeaderName?.[normalizeKey(originalName)] ??
    null
  );
}

function dateOnly(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function buildIssue(registration, reason) {
  return {
    id: registration.id,
    registrationCode: registration.ma_tiep_dan,
    leaderName: registration.ten_lanh_dao,
    reason,
  };
}

export function analyzeLegacyLeaderMeetings(registrations, leaderMap = {}) {
  const issues = [];
  const prepared = [];

  for (const registration of registrations) {
    const leaderId = resolveLeaderId(registration, leaderMap);
    const slot = parseLegacySlot(registration.slot);
    const status = normalizeLegacyStatus(registration.trang_thai);
    const appointmentDate = dateOnly(registration.ngay);

    if (!leaderId) issues.push(buildIssue(registration, "UNMAPPED_LEADER"));
    if (!slot) issues.push(buildIssue(registration, "INVALID_SLOT"));
    if (!status) issues.push(buildIssue(registration, "INVALID_STATUS"));
    if (!appointmentDate) issues.push(buildIssue(registration, "INVALID_APPOINTMENT_DATE"));
    if (!registration.ma_tiep_dan) issues.push(buildIssue(registration, "MISSING_REGISTRATION_CODE"));
    if (!registration.ho_ten || !registration.sdt || !registration.cccd || !registration.dia_chi || !registration.ly_do) {
      issues.push(buildIssue(registration, "MISSING_REQUIRED_CITIZEN_DATA"));
    }

    if (leaderId && slot && status && appointmentDate && registration.ma_tiep_dan && registration.ho_ten && registration.sdt && registration.cccd && registration.dia_chi && registration.ly_do) {
      prepared.push({ registration, leaderId, slot, status, appointmentDate });
    }
  }

  const slotCapacity = new Map();
  for (const item of prepared) {
    const key = [item.leaderId, item.appointmentDate.toISOString().slice(0, 10), item.slot.start, item.slot.end].join("|");
    slotCapacity.set(key, (slotCapacity.get(key) ?? 0) + 1);
    item.slotKey = key;
  }

  return { prepared, issues, slotCapacity };
}

function mapRegistrationData(item, slotId) {
  const source = item.registration;
  return {
    id: source.id,
    ma_dang_ky: source.ma_tiep_dan,
    id_khung_gio_gap: slotId,
    ngay_hen: item.appointmentDate,
    chu_de: source.chu_de,
    ho_ten: source.ho_ten,
    sdt: source.sdt,
    cccd: source.cccd,
    dia_chi: source.dia_chi,
    ngay_lam_don: dateOnly(source.thoi_gian_tao) ?? item.appointmentDate,
    ly_do: source.ly_do,
    trang_thai: item.status,
    thoi_gian_phe_duyet: source.thoi_gian_phe_duyet,
    thoi_gian_hoan_thanh: source.thoi_gian_hoan_thanh,
    thoi_gian_tu_choi: source.thoi_gian_tu_choi,
    ly_do_tu_choi: source.ly_do_tu_choi,
    nguoi_duyet_don: source.nguoi_duyet_don,
    nguoi_hoan_thanh: source.nguoi_hoan_thanh,
    nguoi_tu_choi: source.nguoi_tu_choi,
    is_active: source.is_active ?? true,
    is_delete: source.is_delete ?? false,
    nguoi_tao: source.nguoi_tao,
    nguoi_cap_nhat: source.nguoi_cap_nhat,
    thoi_gian_tao: source.thoi_gian_tao ?? undefined,
    thoi_gian_cap_nhat: source.thoi_gian_cap_nhat,
  };
}

async function migratePreparedItem(tx, item, capacity) {
  const source = item.registration;
  const schedule = await tx.lich_gap_lanh_dao.upsert({
    where: {
      id_lanh_dao_ngay: {
        id_lanh_dao: item.leaderId,
        ngay: item.appointmentDate,
      },
    },
    update: {},
    create: {
      id_lanh_dao: item.leaderId,
      ngay: item.appointmentDate,
      dia_diem: "Phòng tiếp công dân",
      ghi_chu: "Dữ liệu được chuyển từ đăng ký gặp lãnh đạo phiên bản cũ",
      nguoi_tao: source.nguoi_tao ?? item.leaderId,
    },
  });

  let slot = await tx.khung_gio_gap_lanh_dao.upsert({
    where: {
      id_lich_gap_gio_bat_dau_gio_ket_thuc: {
        id_lich_gap: schedule.id,
        gio_bat_dau: item.slot.start,
        gio_ket_thuc: item.slot.end,
      },
    },
    update: {},
    create: {
      id_lich_gap: schedule.id,
      gio_bat_dau: item.slot.start,
      gio_ket_thuc: item.slot.end,
      suc_chua: Math.max(1, capacity),
      nguoi_tao: source.nguoi_tao ?? item.leaderId,
    },
  });

  if (slot.suc_chua < capacity) {
    slot = await tx.khung_gio_gap_lanh_dao.update({
      where: { id: slot.id },
      data: { suc_chua: capacity },
    });
  }

  const existing = await tx.dang_ky_gap_lanh_dao.findFirst({
    where: { OR: [{ id: source.id }, { ma_dang_ky: source.ma_tiep_dan }] },
    select: { id: true, ma_dang_ky: true },
  });

  if (existing && existing.id !== source.id) {
    throw new Error(`Mã ${source.ma_tiep_dan} đã thuộc bản ghi gặp lãnh đạo khác`);
  }

  const registration = existing
    ? existing
    : await tx.dang_ky_gap_lanh_dao.create({ data: mapRegistrationData(item, slot.id) });

  const oldRating = source.danh_gia_tiep_dan?.[0];
  if (oldRating) {
    await tx.danh_gia_gap_lanh_dao.upsert({
      where: { id_dang_ky_gap_lanh_dao: registration.id },
      update: {},
      create: {
        id: oldRating.id,
        id_dang_ky_gap_lanh_dao: registration.id,
        diem_tong: oldRating.diem_tong,
        tieu_chi: oldRating.tieu_chi,
        ly_do: oldRating.ly_do,
        nhan_xet: oldRating.nhan_xet,
        is_active: oldRating.is_active ?? true,
        is_delete: oldRating.is_delete ?? false,
        thoi_gian_tao: oldRating.thoi_gian_tao ?? undefined,
        thoi_gian_cap_nhat: oldRating.thoi_gian_cap_nhat,
      },
    });
  }
}

async function loadLegacyRegistrations(client) {
  return client.dang_ky_tiep_dan.findMany({
    where: { loai: "LEADER_MEETING" },
    include: { danh_gia_tiep_dan: true },
    orderBy: { thoi_gian_tao: "asc" },
  });
}

export async function runLeaderMeetingBackfill(client, { apply = false, leaderMap = {} } = {}) {
  const source = await loadLegacyRegistrations(client);
  const analysis = analyzeLegacyLeaderMeetings(source, leaderMap);
  const report = {
    sourceRegistrations: source.length,
    readyRegistrations: analysis.prepared.length,
    sourceRatings: source.reduce((sum, item) => sum + (item.danh_gia_tiep_dan?.length ?? 0), 0),
    issueCount: analysis.issues.length,
    issues: analysis.issues,
  };

  if (!apply) return { applied: false, before: report, after: report };
  if (analysis.issues.length > 0) {
    throw new Error("Backfill bị dừng: còn dữ liệu LEADER_MEETING chưa thể ánh xạ an toàn");
  }

  await client.$transaction(
    async (tx) => {
      for (const item of analysis.prepared) {
        await migratePreparedItem(tx, item, analysis.slotCapacity.get(item.slotKey));
      }
    },
    { isolationLevel: "Serializable", timeout: 120000 }
  );

  const migratedRegistrations = await client.dang_ky_gap_lanh_dao.count({
    where: { id: { in: analysis.prepared.map((item) => item.registration.id) } },
  });
  const migratedRatings = await client.danh_gia_gap_lanh_dao.count({
    where: {
      id_dang_ky_gap_lanh_dao: { in: analysis.prepared.map((item) => item.registration.id) },
    },
  });

  if (migratedRegistrations !== report.readyRegistrations || migratedRatings !== report.sourceRatings) {
    throw new Error("Backfill chưa hoàn tất: số lượng dữ liệu đích không khớp dữ liệu nguồn");
  }

  return {
    applied: true,
    before: report,
    after: { ...report, migratedRegistrations, migratedRatings },
  };
}
