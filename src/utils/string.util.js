import crypto from "crypto";

export const toSnakeCaseNonAccent = (str) => {
  if (!str) return "";

  let result = str.toLowerCase().trim();

  result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  result = result
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  result = result.replace(/_+/g, "_");

  return result;
};

export const capitalizeWords = (str) => {
  // if (!str) return "";
  // return str
  //   .trim()
  //   .toLowerCase()
  //   .split(" ")
  //   .filter(Boolean) // loại bỏ khoảng trắng thừa
  //   .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  //   .join(" ");
  return str;
};

export const normalizeKhuPho = (value) => {
  if (typeof value !== "string") return null;

  const normalized = value
    .trim()
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ");
  const match = /^(?:(?:khu\s*pho|kp)(?:\s*so)?\s*)?([1-9]|[1-3][0-9]|4[0-5])$/.exec(
    normalized
  );

  return match ? `Khu phố ${Number(match[1])}` : null;
};

export const appendDeleteSuffixc = (str) => {
  if (typeof str !== "string") {
    return str;
  }

  return `${generateUniqueCode()}_${str}`;
};

export const generateUniqueCode = () => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const alphabetLength = alphabet.length;
  const size = 8;

  const randomBytes = crypto.randomBytes(size);
  let result = "";

  for (let i = 0; i < size; i++) {
    const index = randomBytes[i] % alphabetLength;
    result += alphabet[index];
  }

  return result;
};

export const parseStringToArray = (str) => {
  if (!str) return [];

  str = String(str).trim();

  if (!str) return [];

  if (str.includes(",")) {
    return str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [str];
};

export const nowVN = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
  return formatter.format(new Date());
};

export const toUTCFromVN_Start = (dateStr) => {
  if (!dateStr) return null;

  const [year, month, day] = dateStr.split("-").map(Number);

  const d = new Date(Date.UTC(year, month - 1, day, -7, 0, 0));

  return d.toISOString();
};

export const toUTCFromVN_End = (dateStr) => {
  if (!dateStr) return null;

  const [year, month, day] = dateStr.split("-").map(Number);

  const d = new Date(Date.UTC(year, month - 1, day, 16, 59, 59));

  return d.toISOString();
};

export const parseCommaString = (str) => {
  if (!str) return [];
  if (typeof str !== "string") return [];
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

export const toVNDateFolder = (utcDate) => {
  if (!utcDate) return "unknown-date";

  const vnMs = new Date(utcDate).getTime() + 7 * 60 * 60 * 1000;
  const vnDate = new Date(vnMs);

  const day = String(vnDate.getUTCDate()).padStart(2, "0");
  const month = String(vnDate.getUTCMonth() + 1).padStart(2, "0");
  const year = vnDate.getUTCFullYear();

  return `${day}-${month}-${year}`;
};

export const toVNDateTimeString = (utcDate) => {
  if (!utcDate) return "";

  const vnMs = new Date(utcDate).getTime() + 7 * 60 * 60 * 1000;
  const vnDate = new Date(vnMs);

  const day = String(vnDate.getUTCDate()).padStart(2, "0");
  const month = String(vnDate.getUTCMonth() + 1).padStart(2, "0");
  const year = vnDate.getUTCFullYear();

  const hours = String(vnDate.getUTCHours()).padStart(2, "0");
  const minutes = String(vnDate.getUTCMinutes()).padStart(2, "0");
  const seconds = String(vnDate.getUTCSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export const buildContentTxt = (pa) => {
  const lines = [];

  // ===== THÔNG TIN CHUNG =====
  lines.push(`MÃ PHẢN ÁNH      : ${pa.ma_phan_anh || ""}`);
  lines.push(`TIÊU ĐỀ          : ${pa.tieu_de || ""}`);
  lines.push(`MỨC ĐỘ           : ${pa.muc_do || ""}`);
  lines.push(`LĨNH VỰC         : ${pa.linh_vuc || ""}`);
  lines.push("");

  // ===== NGƯỜI PHẢN ÁNH =====
  lines.push("NGƯỜI PHẢN ÁNH");
  lines.push(`- Họ tên         : ${pa.ten_nguoi_phan_anh || ""}`);
  lines.push(`- Số điện thoại  : ${pa.sdt_nguoi_phan_anh || ""}`);
  lines.push("");

  // ===== THỜI GIAN =====
  lines.push("THỜI GIAN");
  lines.push(
    `- Thời gian tạo        : ${toVNDateTimeString(pa.thoi_gian_tao)}`
  );
  lines.push("");

  // ===== VỊ TRÍ =====
  lines.push("VỊ TRÍ");
  lines.push(`- Địa điểm       : ${pa.vi_tri || ""}`);
  lines.push("");

  // ===== NỘI DUNG =====
  lines.push("NỘI DUNG PHẢN ÁNH");
  lines.push(pa.mo_ta || "");
  lines.push("");

  // ===== LỊCH SỬ TRẠNG THÁI =====
  lines.push("LỊCH SỬ TRẠNG THÁI");

  if (!pa.lich_su_trang_thai || pa.lich_su_trang_thai.length === 0) {
    lines.push("Không có lịch sử trạng thái.");
  } else {
    pa.lich_su_trang_thai.forEach((ls, index) => {
      lines.push(`[${index + 1}] ${ls.ten}`);
      lines.push(`    - Thời gian  : ${toVNDateTimeString(ls.thoi_gian_tao)}`);
      lines.push(`    - Ghi chú    : ${ls.ghi_chu || ""}`);
      lines.push("");
    });
  }
  lines.push("--------------------------------------------------");
  lines.push("");
  // ===== CẢNH BÁO EXPORT (nếu có) =====
  const imgErr = pa.__export?.imageError;
  const vidErr = pa.__export?.videoError;

  if (imgErr || vidErr) {
    lines.push("**Nội dung này không có trong phản ánh**");
    lines.push("GHI CHÚ XUẤT DỮ LIỆU");

    if (imgErr) {
      lines.push("Có lỗi xảy ra trong quá trình xuất ảnh");
    }

    if (vidErr) {
      lines.push("Có lỗi xảy ra trong quá trình xuất video");
    }

    lines.push("");
  }


  return lines.join("\n");
};

/**
 * Chuẩn hóa tên file an toàn cho tiếng Việt (giữ nguyên có dấu chuẩn NFC, không sinh null byte 0x00)
 */
export const cleanOriginalFileName = (raw) => {
  if (!raw) return raw;
  let name = String(raw);

  try {
    // Chỉ decode latin1 -> utf8 nếu phát hiện chuỗi bị lỗi mã hóa mojibake
    if (/(?:[\xC2\xC3][\x80-\xBF]|á[º»][\x80-\xBF])/.test(name)) {
      const decoded = Buffer.from(name, "latin1").toString("utf8");
      if (!decoded.includes("\uFFFD") && decoded.length < name.length) {
        name = decoded;
      }
    }
  } catch {}

  try {
    // Chuẩn hóa mọi dạng Unicode tổ hợp (NFD) về dạng dựng sẵn (NFC) chuẩn
    name = name.normalize("NFC");
  } catch {}

  // Lọc bỏ ký tự null byte (0x00) gây crash PostgreSQL
  name = name.replace(/\0/g, "").trim();
  return name;
};

/**
 * Lọc bỏ ký tự null byte trong chuỗi để tránh lỗi PostgreSQL 22021
 */
export const sanitizeNullBytes = (val) => {
  if (typeof val === "string") {
    return val.replace(/\0/g, "").trim();
  }
  return val;
};
