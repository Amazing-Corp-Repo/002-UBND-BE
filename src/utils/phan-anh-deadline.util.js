import PHAN_ANH_MUC_DO, {
  normalizePhanAnhMucDo,
} from "../constants/phan-anh-muc-do.constant.js";

const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const getVietnamWeekday = (date) =>
  new Date(date.getTime() + VIETNAM_UTC_OFFSET_MS).getUTCDay();

export const addVietnamWorkingDays = (startAt, workingDays) => {
  const days = Number(workingDays);
  if (!Number.isInteger(days) || days < 1) {
    throw new TypeError("Số ngày xử lý phải là số nguyên dương");
  }

  const deadline = new Date(startAt);
  if (Number.isNaN(deadline.getTime())) {
    throw new TypeError("Thời điểm tiếp nhận không hợp lệ");
  }

  let addedDays = 0;
  while (addedDays < days) {
    deadline.setTime(deadline.getTime() + ONE_DAY_MS);
    const weekday = getVietnamWeekday(deadline);
    if (weekday !== 0 && weekday !== 6) {
      addedDays += 1;
    }
  }

  return deadline;
};

export const calculatePhanAnhDeadline = ({
  receivedAt,
  mucDo,
  soNgayXuLy,
}) => {
  const start = new Date(receivedAt);
  if (Number.isNaN(start.getTime())) {
    throw new TypeError("Thời điểm tiếp nhận không hợp lệ");
  }

  if (normalizePhanAnhMucDo(mucDo) === PHAN_ANH_MUC_DO.KHAN_CAP) {
    return new Date(start.getTime() + ONE_DAY_MS);
  }

  return addVietnamWorkingDays(start, soNgayXuLy);
};
