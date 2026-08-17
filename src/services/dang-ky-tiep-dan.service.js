import { randomInt } from "node:crypto";
import { TIEP_DAN_STATUS, TIEP_DAN_TYPE } from "../constants/tiep-dan.constant.js";
import DangKyTiepDanRepository from "../repositories/dang-ky-tiep-dan.repository.js";
import { BaseError } from "../utils/base-error.util.js";

const MAX_CODE_RETRIES = 10;

const createShortReceptionCode = () => {
  const letter = String.fromCharCode(65 + randomInt(0, 26));
  return `${letter}${String(randomInt(0, 100000)).padStart(5, "0")}`;
};

const getVietnamDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const isUniqueConstraintError = (error) => error?.code === "P2002";

const DangKyTiepDanService = {
  async createCounterReception(input) {
    const schedule = await DangKyTiepDanRepository.findScheduleById(
      input.idLichTiepDan
    );

    if (!schedule || !schedule.ngay_tiep_dan) {
      throw new BaseError(404, "Lịch tiếp dân không tồn tại hoặc đã ngừng hoạt động");
    }

    const scheduleDate = new Date(schedule.ngay_tiep_dan)
      .toISOString()
      .slice(0, 10);
    if (scheduleDate < getVietnamDate()) {
      throw new BaseError(400, "Không thể đăng ký lịch tiếp dân đã qua");
    }

    const duplicate = await DangKyTiepDanRepository.findDuplicate({
      idLichTiepDan: input.idLichTiepDan,
      slot: input.slot,
      sdt: input.sdt,
    });
    if (duplicate) {
      throw new BaseError(
        409,
        "Số điện thoại đã đăng ký khung giờ này"
      );
    }

    const data = {
      loai: TIEP_DAN_TYPE.COUNTER_RECEPTION,
      id_lich_tiep_dan: input.idLichTiepDan,
      ngay: schedule.ngay_tiep_dan,
      slot: input.slot,
      chu_de: input.chuDe,
      ly_do: input.lyDo,
      ho_ten: input.hoTen,
      sdt: input.sdt,
      cccd: input.cccd,
      dia_chi: input.diaChi,
      trang_thai: TIEP_DAN_STATUS.PENDING,
    };

    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt += 1) {
      try {
        return await DangKyTiepDanRepository.create({
          ...data,
          ma_tiep_dan: createShortReceptionCode(),
        });
      } catch (error) {
        if (!isUniqueConstraintError(error) || attempt === MAX_CODE_RETRIES - 1) {
          throw error;
        }
      }
    }

    throw new BaseError(500, "Không thể tạo mã tiếp dân");
  },
};

export default DangKyTiepDanService;
