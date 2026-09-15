const vietnamDateParts = (date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value;
  return { year: value("year"), month: value("month"), day: value("day") };
};

export const getLeaderMeetingGraceDeadline = (appointmentDate, slotStart) => {
  if (!appointmentDate || !/^\d{2}:\d{2}$/.test(slotStart || "")) return null;
  const { year, month, day } = vietnamDateParts(appointmentDate);
  const [hour, minute] = slotStart.split(":").map(Number);
  // Đơn chờ duyệt quá hạn sau 15 phút kể từ giờ bắt đầu ca, theo giờ Việt Nam.
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), hour - 7, minute + 15));
};

export const getLeaderMeetingStartTime = (appointmentDate, slotStart) => {
  if (!appointmentDate || !/^\d{2}:\d{2}$/.test(slotStart || "")) return null;
  const { year, month, day } = vietnamDateParts(appointmentDate);
  const [hour, minute] = slotStart.split(":").map(Number);
  // Việt Nam là UTC+7 quanh năm. Giữ mốc thời gian độc lập timezone của server.
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), hour - 7, minute));
};

export const isLeaderMeetingOverdue = (registration, now = new Date()) => {
  // OVERDUE chỉ là nhánh kết thúc của đơn chưa được duyệt.
  // REJECTED/CANCELED là trạng thái cuối độc lập, dù dữ liệu cũ còn cờ quá hạn.
  if (registration.trang_thai !== "PENDING") return false;
  if (registration.is_qua_han) return true;
  const deadline = getLeaderMeetingGraceDeadline(
    registration.ngay_hen,
    registration.khung_gio_gap_lanh_dao?.gio_bat_dau,
  );
  return deadline ? now >= deadline : false;
};

export const isLeaderMeetingReadyToProcess = (registration, now = new Date()) => {
  if (registration.trang_thai !== "APPROVED" || registration.is_qua_han) return false;
  if (isLeaderMeetingOverdue(registration, now)) return false;
  const startTime = getLeaderMeetingStartTime(
    registration.ngay_hen,
    registration.khung_gio_gap_lanh_dao?.gio_bat_dau,
  );
  return startTime ? now >= startTime : false;
};

export const getEffectiveLeaderMeetingStatus = (registration, now = new Date()) =>
  isLeaderMeetingOverdue(registration, now) ? "OVERDUE" : registration.trang_thai;
