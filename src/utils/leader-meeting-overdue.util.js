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

export const getLeaderMeetingGraceDeadline = (appointmentDate, slotEnd) => {
  if (!appointmentDate || !/^\d{2}:\d{2}$/.test(slotEnd || "")) return null;
  const { year, month, day } = vietnamDateParts(appointmentDate);
  const [hour, minute] = slotEnd.split(":").map(Number);
  // Việt Nam là UTC+7 quanh năm. Date.UTC giúp so sánh không phụ thuộc timezone của server.
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), hour - 7, minute + 15));
};

export const isLeaderMeetingOverdue = (registration, now = new Date()) => {
  if (registration.is_qua_han) return true;
  if (!["PENDING", "APPROVED"].includes(registration.trang_thai)) return false;
  const deadline = getLeaderMeetingGraceDeadline(
    registration.ngay_hen,
    registration.khung_gio_gap_lanh_dao?.gio_ket_thuc,
  );
  return deadline ? now >= deadline : false;
};

export const getEffectiveLeaderMeetingStatus = (registration, now = new Date()) =>
  isLeaderMeetingOverdue(registration, now) ? "OVERDUE" : registration.trang_thai;
