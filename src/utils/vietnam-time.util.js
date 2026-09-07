const VIETNAM_OFFSET_HOURS = 7;
const VIETNAM_OFFSET = "+07:00";

const pad = (value, length = 2) => String(value).padStart(length, "0");

const toValidDate = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatVietnamDate = (value) => {
  const date = toValidDate(value);
  if (!date) return null;

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

// PostgreSQL TIME has no timezone. Prisma exposes it as a Date anchored in UTC,
// therefore its UTC clock fields are the original wall-clock values.
export const formatDatabaseTime = (value, { includeSeconds = false } = {}) => {
  if (typeof value === "string") {
    const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(
      value.trim()
    );
    if (!match) return null;
    return `${match[1]}:${match[2]}${includeSeconds ? `:${match[3] || "00"}` : ""}`;
  }

  const date = toValidDate(value);
  if (!date) return null;
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}${
    includeSeconds ? `:${pad(date.getUTCSeconds())}` : ""
  }`;
};

export const formatVietnamDateTime = (value) => {
  const date = toValidDate(value);
  if (!date) return null;

  const vietnamTime = new Date(
    date.getTime() + VIETNAM_OFFSET_HOURS * 60 * 60 * 1000
  );
  return `${vietnamTime.getUTCFullYear()}-${pad(
    vietnamTime.getUTCMonth() + 1
  )}-${pad(vietnamTime.getUTCDate())}T${pad(
    vietnamTime.getUTCHours()
  )}:${pad(vietnamTime.getUTCMinutes())}:${pad(
    vietnamTime.getUTCSeconds()
  )}.${pad(vietnamTime.getUTCMilliseconds(), 3)}${VIETNAM_OFFSET}`;
};

export const toDatabaseDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? date
    : null;
};

export const parseVietnamImportDate = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(
      Date.UTC(1899, 11, 30) + Math.floor(value) * 24 * 60 * 60 * 1000
    );
    return date.toISOString().slice(0, 10);
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(
      value.getUTCDate()
    )}`;
  }

  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (toDatabaseDate(normalized)) return normalized;

  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(normalized);
  if (!match) return null;
  const result = `${match[3]}-${pad(match[2])}-${pad(match[1])}`;
  return toDatabaseDate(result) ? result : null;
};

export const parseVietnamImportTime = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDatabaseTime(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const dayFraction = ((value % 1) + 1) % 1;
    const totalMinutes = Math.round(dayFraction * 1440) % 1440;
    return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
  }

  if (typeof value !== "string") return null;
  const match = /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(
    value.trim()
  );
  return match ? `${pad(match[1])}:${match[2]}` : null;
};

export const getVietnamDayUtcRange = ({ fromDate, toDate } = {}) => ({
  ...(fromDate
    ? { gte: new Date(`${fromDate}T00:00:00.000${VIETNAM_OFFSET}`) }
    : {}),
  ...(toDate
    ? { lte: new Date(`${toDate}T23:59:59.999${VIETNAM_OFFSET}`) }
    : {}),
});

const DATE_ONLY_KEYS = new Set(["ngay", "ngay_tiep_dan", "receptionDate"]);
const TIME_ONLY_KEYS = new Set([
  "gio_bat_dau",
  "gio_ket_thuc",
  "startTime",
  "endTime",
]);
const TIMESTAMP_KEYS = new Set([
  "thoi_gian_tao",
  "thoi_gian_cap_nhat",
  "thoi_gian_phe_duyet",
  "thoi_gian_hoan_thanh",
  "thoi_gian_tu_choi",
  "createdAt",
  "updatedAt",
  "approvedAt",
  "completedAt",
  "rejectedAt",
  "ratedAt",
]);

export const normalizeReceptionTimes = (value, key = null) => {
  if (value === null || value === undefined) return value;
  if (DATE_ONLY_KEYS.has(key)) return formatVietnamDate(value);
  if (TIME_ONLY_KEYS.has(key) && value instanceof Date) {
    return formatDatabaseTime(value);
  }
  if (TIMESTAMP_KEYS.has(key)) return formatVietnamDateTime(value);
  if (Array.isArray(value)) {
    return value.map((item) => normalizeReceptionTimes(item));
  }
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        normalizeReceptionTimes(childValue, childKey),
      ])
    );
  }
  return value;
};

