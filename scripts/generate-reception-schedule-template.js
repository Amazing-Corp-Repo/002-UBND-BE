import ExcelJS from "exceljs";
import { fileURLToPath } from "node:url";

const outputPath = fileURLToPath(
  new URL("../src/public/static/template-lich-tiep-dan.xlsx", import.meta.url)
);
const workbook = new ExcelJS.Workbook();
workbook.creator = "UBND API";

const styleHeader = (row) => {
  row.height = 28;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F4E78" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
  });
};

// FileService đọc sheet đầu tiên, vì vậy sheet dữ liệu phải luôn đứng trước.
const dataSheet = workbook.addWorksheet("LichTiepDan", {
  views: [{ state: "frozen", ySplit: 1 }],
});
dataSheet.columns = [
  { header: "Ngày tiếp dân", key: "date", width: 16 },
  { header: "Từ", key: "from", width: 11 },
  { header: "Đến", key: "to", width: 11 },
  { header: "Mã quầy", key: "counter", width: 13 },
  { header: "Tài khoản cán bộ", key: "username", width: 22 },
  { header: "Họ tên cán bộ", key: "officerName", width: 24 },
  { header: "Sức chứa / ca", key: "capacity", width: 17 },
  { header: "Địa điểm", key: "location", width: 30 },
  { header: "Ghi chú", key: "note", width: 46 },
];
const officerNames = [
  "Nguyễn Văn An",
  "Trần Thị Bình",
  "Lê Văn Cường",
  "Phạm Thị Dung",
  "Hoàng Văn Em",
  "Võ Thị Giang",
  "Đặng Văn Hùng",
  "Bùi Thị Lan",
];
for (const [from, to, note] of [
  ["07:30", "11:30", "Ca sáng - thay tài khoản mẫu bằng tài khoản thật"],
  ["13:30", "16:30", "Ca chiều - thay tài khoản mẫu bằng tài khoản thật"],
]) {
  officerNames.forEach((officerName, index) =>
    dataSheet.addRow({
      date: "01/09/2099",
      from,
      to,
      counter: `QUAY_${index + 1}`,
      username: `canbo${index + 1}`,
      officerName,
      capacity: 2,
      location: "Bộ phận tiếp công dân",
      note,
    })
  );
}
styleHeader(dataSheet.getRow(1));
dataSheet.autoFilter = "A1:I17";
dataSheet.eachRow((row, rowNumber) => {
  if (rowNumber > 1) {
    row.alignment = { vertical: "top", wrapText: true };
    row.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: rowNumber <= 9 ? "FFEAF3F8" : "FFFFF2CC" },
    };
  }
});
for (let row = 2; row <= 500; row += 1) {
  dataSheet.getCell(`D${row}`).dataValidation = {
    type: "list",
    allowBlank: false,
    formulae: ["'Danh mục quầy'!$A$2:$A$9"],
  };
  dataSheet.getCell(`G${row}`).dataValidation = {
    type: "whole",
    operator: "greaterThanOrEqual",
    allowBlank: true,
    formulae: [1],
  };
}

const instructionSheet = workbook.addWorksheet("Hướng dẫn", {
  views: [{ state: "frozen", ySplit: 1 }],
});
instructionSheet.columns = [
  { key: "item", width: 26 },
  { key: "description", width: 105 },
];
instructionSheet.addRows([
  ["Nội dung", "Hướng dẫn nhập dữ liệu"],
  ["Ý nghĩa một dòng", "Một dòng = một tài khoản cán bộ trực một quầy trong toàn bộ khoảng Từ–Đến của ngày đã chọn."],
  ["Cột bắt buộc", "Ngày tiếp dân, Từ, Đến, Mã quầy, Tài khoản cán bộ và Địa điểm."],
  ["Ngày tiếp dân", "Nhập DD/MM/YYYY hoặc YYYY-MM-DD. Các dòng cùng ngày và địa điểm được gộp thành một lịch."],
  ["Từ / Đến", "Nhập HH:mm theo giờ Việt Nam. Khoảng thời gian phải chia hết thành ca 1 giờ; mặc định sáng 07:30–11:30, chiều 13:30–16:30."],
  ["Mã quầy", "Hệ thống có 8 quầy, thông thường từ QUAY_1 đến QUAY_8. Chỉ dùng mã quầy đang hoạt động trong DB; chỉ quầy có dòng dữ liệu mới được mở."],
  ["Tài khoản cán bộ", "Nhập chính xác tên đăng nhập trong DB. Tài khoản phải hoạt động và có quyền RR_APPROVE để phê duyệt đơn tại quầy."],
  ["Họ tên cán bộ", "Cột tham chiếu; backend lấy họ tên chính thức theo Tài khoản cán bộ."],
  ["Sức chứa / ca", "Không bắt buộc. Nếu để trống, backend lấy sức chứa mặc định của quầy, hiện mặc định 2. Nếu nhập thì phải là số nguyên từ 1 trở lên."],
  ["Không trùng phân công", "Trong cùng một ca 1 giờ: một quầy chỉ có một cán bộ và một cán bộ không được phân công hai quầy."],
  ["Phê duyệt", "Backend tạo đồng thời lịch, ca, cấu hình quầy và phân công. Cán bộ chỉ phê duyệt đơn thuộc đúng ca/quầy được phân công."],
  ["Trùng lịch DB", "Không import nếu lịch cùng Ngày tiếp dân + Địa điểm đã tồn tại."],
  ["Ghi chú", "Không bắt buộc; tối đa 255 ký tự trong DB."],
  ["Lưu ý dữ liệu mẫu", "Tài khoản canbo1...canbo8 và ngày 01/09/2099 chỉ là ví dụ; phải thay bằng dữ liệu thật."],
]);
styleHeader(instructionSheet.getRow(1));
instructionSheet.eachRow((row) => {
  row.alignment = { vertical: "top", wrapText: true };
});

const counterSheet = workbook.addWorksheet("Danh mục quầy", {
  views: [{ state: "frozen", ySplit: 1 }],
});
counterSheet.columns = [
  { header: "Mã quầy", key: "code", width: 15 },
  { header: "Tên quầy", key: "name", width: 22 },
  { header: "Sức chứa mặc định", key: "capacity", width: 22 },
  { header: "Cách sử dụng", key: "usage", width: 68 },
];
for (let index = 1; index <= 8; index += 1) {
  counterSheet.addRow({
    code: `QUAY_${index}`,
    name: `Quầy số ${index}`,
    capacity: 2,
    usage: "Đối chiếu với danh mục quầy đang hoạt động trong DB trước khi import",
  });
}
styleHeader(counterSheet.getRow(1));
counterSheet.eachRow((row) => {
  row.alignment = { vertical: "top", wrapText: true };
});

await workbook.xlsx.writeFile(outputPath);
console.log(`Generated ${outputPath}`);
