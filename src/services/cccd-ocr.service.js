import { createWorker } from "tesseract.js";
import { BaseError } from "../utils/base-error.util.js";

let workerPromise;

const getWorker = () => {
  if (!workerPromise) workerPromise = createWorker("vie+eng");
  return workerPromise;
};

const normalizeText = (value) => String(value || "")
  .replace(/\r/g, "")
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const valueAfterLabel = (lines, labels) => {
  const pattern = new RegExp(`^(${labels.join("|")})\\s*:?\\s*(.*)$`, "iu");
  const index = lines.findIndex((line) => pattern.test(line));
  if (index < 0) return "";
  const match = lines[index].match(pattern);
  return match?.[2]?.trim() || lines[index + 1] || "";
};

const parseDate = (text) => {
  const match = String(text).match(/(?<!\d)(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?!\d)/);
  return match ? `${match[1].padStart(2, "0")}/${match[2].padStart(2, "0")}/${match[3]}` : "";
};

const parseCccdText = (rawText) => {
  const lines = normalizeText(rawText);
  const text = lines.join(" ");
  const citizenId = text.match(/(?<!\d)\d{12}(?!\d)/)?.[0] || "";
  const fullName = valueAfterLabel(lines, ["HỌ VÀ TÊN", "HO VA TEN", "FULL NAME"])
    .replace(/[^\p{L}\s.'-]/gu, "").replace(/\s+/g, " ").trim();
  const issuedDate = parseDate(valueAfterLabel(lines, ["NGÀY CẤP", "NGAY CAP", "DATE OF ISSUE"]));
  const issuedPlace = valueAfterLabel(lines, ["NƠI CẤP", "NOI CAP", "PLACE OF ISSUE"])
    .replace(/\s+/g, " ").trim();
  const address = valueAfterLabel(lines, ["NƠI THƯỜNG TRÚ", "NOI THUONG TRU", "PLACE OF RESIDENCE", "ĐỊA CHỈ"])
    .replace(/\s+/g, " ").trim();
  return { citizenId, fullName, issuedDate, issuedPlace, address, rawText };
};

const CccdOcrService = {
  async recognize(file) {
    if (!file?.buffer) throw new BaseError(400, "Vui lòng gửi ảnh CCCD");
    try {
      const worker = await getWorker();
      const result = await worker.recognize(file.buffer);
      return parseCccdText(result.data?.text);
    } catch (error) {
      throw new BaseError(502, `Không thể đọc thông tin CCCD: ${error?.message || "OCR thất bại"}`);
    }
  },
};

export default CccdOcrService;
