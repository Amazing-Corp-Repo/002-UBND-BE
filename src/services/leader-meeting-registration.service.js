import { randomInt } from "node:crypto";
import path from "node:path";
import LeaderMeetingRegistrationRepository from "../repositories/leader-meeting-registration.repository.js";
import { BaseError } from "../utils/base-error.util.js";

const MAX_RETRIES = 10;

const createCode = () => `LD${String(randomInt(0, 1000000)).padStart(6, "0")}`;

const vietnamDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const vietnamTime = (date = new Date()) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);

const buildAttachments = (files = {}) => {
  const mapFile = (file, type) => ({
    loai_dinh_kem: type,
    ten_file_goc: Buffer.from(file.originalname, "latin1").toString("utf8"),
    duong_dan_file: path.relative(process.cwd(), file.path).replace(/\\/g, "/"),
    mime_type: file.mimetype,
    kich_thuoc: file.size,
  });

  return [
    ...(files.citizenIdFront || []).map((file) => mapFile(file, "CCCD_FRONT")),
    ...(files.citizenIdBack || []).map((file) => mapFile(file, "CCCD_BACK")),
    ...(files.supportingDocuments || []).map((file) =>
      mapFile(file, "SUPPORTING_DOCUMENT")
    ),
  ];
};

const conflictMessages = {
  SLOT_UNAVAILABLE: [404, "Khung giờ gặp lãnh đạo không tồn tại hoặc đã ngừng hoạt động"],
  SLOT_PASSED: [409, "Khung giờ gặp lãnh đạo đã qua"],
  SLOT_FULL: [409, "Khung giờ gặp lãnh đạo đã đủ sức chứa"],
  PHONE_DAILY_LIMIT: [409, "Số điện thoại đã có đăng ký giữ chỗ trong ngày hẹn này"],
  CITIZEN_DAILY_LIMIT: [409, "CCCD đã có đăng ký giữ chỗ trong ngày hẹn này"],
  PHONE_SLOT_ALREADY_USED: [
    409,
    "Số điện thoại đã từng đăng ký khung giờ này, vui lòng chọn khung giờ khác",
  ],
  CITIZEN_SLOT_ALREADY_USED: [
    409,
    "CCCD đã từng đăng ký khung giờ này, vui lòng chọn khung giờ khác",
  ],
};

const uniqueErrorText = (error) => {
  try {
    return `${error?.message || ""} ${JSON.stringify(error?.meta || {})}`.toLowerCase();
  } catch {
    return String(error?.message || "").toLowerCase();
  }
};

const mapUniqueConflict = (error) => {
  if (error?.code !== "P2002") return null;
  const text = uniqueErrorText(error);
  if (text.includes("uq_leader_meeting_slot_phone")) {
    return "PHONE_SLOT_ALREADY_USED";
  }
  if (text.includes("uq_leader_meeting_slot_citizen")) {
    return "CITIZEN_SLOT_ALREADY_USED";
  }
  if (text.includes("ngay_sdt") || text.includes("sdt")) return "PHONE_DAILY_LIMIT";
  if (text.includes("ngay_cccd") || text.includes("cccd")) return "CITIZEN_DAILY_LIMIT";
  return null;
};

const mapCreated = ({ registration, slot }) => ({
  id: registration.id,
  registrationCode: registration.ma_dang_ky,
  status: registration.trang_thai,
  receptionDate: vietnamDate(slot.lich_gap_lanh_dao.ngay),
  timeSlot: `${slot.gio_bat_dau} - ${slot.gio_ket_thuc}`,
  leaderName: slot.lich_gap_lanh_dao.lanh_dao.ho_va_ten,
});

const LeaderMeetingRegistrationService = {
  async create(input, files = {}) {
    const now = new Date();
    const attachments = buildAttachments(files);

    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        const result = await LeaderMeetingRegistrationRepository.createWithGuards({
          slotId: input.slotId,
          phoneNumber: input.phoneNumber,
          citizenId: input.citizenId,
          currentDate: vietnamDate(now),
          currentTime: vietnamTime(now),
          attachments,
          data: {
            ma_dang_ky: createCode(),
            chu_de: input.topic || null,
            ho_ten: input.fullName,
            sdt: input.phoneNumber,
            cccd: input.citizenId,
            ngay_cap_cccd: input.citizenIdIssuedDate
              ? new Date(`${input.citizenIdIssuedDate}T00:00:00.000Z`)
              : null,
            noi_cap_cccd: input.citizenIdIssuedPlace || null,
            dia_chi: input.address,
            ngay_lam_don: new Date(`${vietnamDate(now)}T00:00:00.000Z`),
            ly_do: input.reason,
            trang_thai: "PENDING",
          },
        });

        if (result.conflict) {
          const [statusCode, message] = conflictMessages[result.conflict];
          throw new BaseError(statusCode, message);
        }

        return mapCreated(result);
      } catch (error) {
        const uniqueConflict = mapUniqueConflict(error);
        if (uniqueConflict) {
          throw new BaseError(...conflictMessages[uniqueConflict]);
        }
        if (error?.code === "P2034") {
          if (attempt === MAX_RETRIES - 1) {
            throw new BaseError(
              503,
              "Hệ thống đang xử lý nhiều đăng ký cùng lúc, vui lòng thử lại"
            );
          }
          continue;
        }
        if (error?.code === "P2002") {
          if (attempt === MAX_RETRIES - 1) {
            throw new BaseError(500, "Không thể tạo mã đăng ký gặp lãnh đạo");
          }
          continue;
        }
        throw error;
      }
    }

    throw new BaseError(500, "Không thể tạo mã đăng ký gặp lãnh đạo");
  },
};

export default LeaderMeetingRegistrationService;
