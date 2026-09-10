const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

const getDatePartsInVietnam = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, Number(value)]),
  );
};

const dateFromParts = ({ year, month, day }) =>
  new Date(Date.UTC(year, month - 1, day));

const formatDate = ({ year, month, day }) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const parseDateOnly = (value) => {
  if (!value) return null;
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value);
  if (!match) return null;

  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
  const date = dateFromParts(parts);
  if (
    date.getUTCFullYear() !== parts.year ||
    date.getUTCMonth() + 1 !== parts.month ||
    date.getUTCDate() !== parts.day
  ) {
    return null;
  }
  return parts;
};

const addDays = (parts, days) => {
  const date = dateFromParts(parts);
  date.setUTCDate(date.getUTCDate() + days);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

const diffDays = (from, to) =>
  Math.round((dateFromParts(to) - dateFromParts(from)) / 86400000) + 1;

const toVietnamStart = (parts) =>
  new Date(dateFromParts(parts).getTime() - VIETNAM_OFFSET_MS);

const toVietnamEnd = (parts) =>
  new Date(dateFromParts(addDays(parts, 1)).getTime() - VIETNAM_OFFSET_MS - 1);

const resolveDashboardPeriod = ({
  preset = "today",
  startDate,
  endDate,
  now = new Date(),
} = {}) => {
  const today = getDatePartsInVietnam(now);
  let currentStart = today;
  let currentEnd = today;

  if (preset === "yesterday") {
    currentStart = addDays(today, -1);
    currentEnd = currentStart;
  } else if (preset === "7days") {
    currentStart = addDays(today, -6);
  } else if (preset === "30days") {
    currentStart = addDays(today, -29);
  } else if (preset === "thisMonth") {
    currentStart = { ...today, day: 1 };
  } else if (preset === "thisQuarter") {
    currentStart = {
      year: today.year,
      month: Math.floor((today.month - 1) / 3) * 3 + 1,
      day: 1,
    };
  } else if (preset === "custom" || (startDate && endDate)) {
    currentStart = parseDateOnly(startDate);
    currentEnd = parseDateOnly(endDate);
  }

  if (!currentStart || !currentEnd) {
    throw new Error("Khoảng ngày Dashboard không hợp lệ");
  }

  const periodLength = diffDays(currentStart, currentEnd);
  const previousEnd = addDays(currentStart, -1);
  const previousStart = addDays(previousEnd, -(periodLength - 1));

  return {
    current: {
      startDate: formatDate(currentStart),
      endDate: formatDate(currentEnd),
      start: toVietnamStart(currentStart),
      end: toVietnamEnd(currentEnd),
    },
    previous: {
      startDate: formatDate(previousStart),
      endDate: formatDate(previousEnd),
      start: toVietnamStart(previousStart),
      end: toVietnamEnd(previousEnd),
    },
    today: {
      start: toVietnamStart(today),
      end: toVietnamEnd(today),
    },
  };
};

const getChange = (current, previous, { percentagePoint = false } = {}) => {
  const currentValue = Number(current) || 0;
  const previousValue = Number(previous) || 0;

  if (percentagePoint) {
    const difference = Number((currentValue - previousValue).toFixed(1));
    return {
      value: Math.abs(difference),
      direction: difference > 0 ? "up" : difference < 0 ? "down" : "flat",
    };
  }

  if (previousValue === 0) {
    return {
      value: currentValue > 0 ? 100 : 0,
      direction: currentValue > 0 ? "up" : "flat",
    };
  }

  const difference = ((currentValue - previousValue) / previousValue) * 100;
  return {
    value: Math.abs(Number(difference.toFixed(1))),
    direction: difference > 0 ? "up" : difference < 0 ? "down" : "flat",
  };
};

const resolveDashboardScope = ({
  permissions = [],
  cate = "",
  idLinhVuc = "all",
} = {}) => {
  const permissionList = Array.isArray(permissions) ? permissions : [];
  const isFullAccess = ["PA_THUONG_TRUC", "RPT_GET_DETAIL"].some((permission) =>
    permissionList.includes(permission),
  );
  const assignedLinhVucIds = String(cate || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (isFullAccess) {
    return {
      isFullAccess,
      assignedLinhVucIds,
      effectiveLinhVucIds: idLinhVuc !== "all" ? [idLinhVuc] : undefined,
    };
  }

  return {
    isFullAccess,
    assignedLinhVucIds,
    effectiveLinhVucIds:
      idLinhVuc === "all"
        ? assignedLinhVucIds
        : assignedLinhVucIds.includes(idLinhVuc)
          ? [idLinhVuc]
          : [],
  };
};

const getSlaClassification = ({
  createdAt,
  deadline,
  completedAt = null,
  now = new Date(),
} = {}) => {
  const created = createdAt ? new Date(createdAt) : null;
  const due = deadline ? new Date(deadline) : null;
  const completed = completedAt ? new Date(completedAt) : null;
  const current = new Date(now);

  if (
    !created ||
    !due ||
    Number.isNaN(created.getTime()) ||
    Number.isNaN(due.getTime()) ||
    Number.isNaN(current.getTime()) ||
    (completed && Number.isNaN(completed.getTime()))
  ) {
    return "unknown";
  }

  const effectiveNow = completed || current;
  if (effectiveNow > due) return "overdue";
  if (completed) return "onTime";

  const totalDuration = due.getTime() - created.getTime();
  const remainingDuration = due.getTime() - current.getTime();
  if (totalDuration > 0 && remainingDuration <= totalDuration * (2 / 3)) {
    return "soon";
  }
  return "onTime";
};

export {
  VIETNAM_TIME_ZONE,
  addDays,
  diffDays,
  formatDate,
  getChange,
  getDatePartsInVietnam,
  getSlaClassification,
  parseDateOnly,
  resolveDashboardPeriod,
  resolveDashboardScope,
};
