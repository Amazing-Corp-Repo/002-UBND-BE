import ExcelJS from "exceljs";
import { fileURLToPath } from "node:url";

const outputPath = fileURLToPath(
  new URL(
    "../src/public/static/template-lich-tiep-dan.xlsx",
    import.meta.url
  )
);
const workbook = new ExcelJS.Workbook();
workbook.creator = "UBND API";
workbook.created = new Date("2026-08-19T00:00:00.000Z");
workbook.modified = new Date("2026-08-19T00:00:00.000Z");

// FileService đọc sheet đầu tiên, vì vậy sheet dữ liệu phải luôn đứng trước.
const dataSheet = workbook.addWorksheet("LichTiepDan");
dataSheet.columns = [
  { header: "Địa điểm", key: "location", width: 30 },
  { header: "Tên cán bộ", key: "officer", width: 28 },
  { header: "Ngày tiếp dân", key: "date", width: 18 },
  { header: "Ghi chú", key: "note", width: 35 },
  { header: "Từ", key: "from", width: 12 },
  { header: "Đến", key: "to", width: 12 },
];
dataSheet.addRows([
  {
    location: "Bộ phận tiếp công dân",
    officer: "Nguyễn Văn An",
    date: "25/08/2026",
    note: "Ca buổi sáng",
    from: "07:30",
    to: "11:30",
  },
  {
    location: "Bộ phận tiếp công dân",
    officer: "Trần Thị Bình",
    date: "25/08/2026",
    note: "Ca buổi chiều",
    from: "13:30",
    to: "16:30",
  },
]);
dataSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
dataSheet.getRow(1).fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F4E78" },
};
dataSheet.getRow(1).alignment = { horizontal: "center", vertical: "middle" };
dataSheet.views = [{ state: "frozen", ySplit: 1 }];
dataSheet.autoFilter = "A1:F3";
dataSheet.eachRow((row, rowNumber) => {
  if (rowNumber > 1) row.alignment = { vertical: "top", wrapText: true };
});

const instructionSheet = workbook.addWorksheet("Hướng dẫn");
instructionSheet.columns = [
  { key: "item", width: 24 },
  { key: "description", width: 100 },
];
instructionSheet.addRows([
  ["Nội dung", "Hướng dẫn import lịch tiếp dân"],
  ["Sheet import", "Nhập dữ liệu tại sheet LichTiepDan và không đổi tên 6 cột."],
  ["Ngày tiếp dân", "Dùng định dạng DD/MM/YYYY hoặc YYYY-MM-DD và phải là ngày hợp lệ."],
  ["Từ / Đến", "Dùng HH:mm. Giờ bắt đầu phải nhỏ hơn giờ kết thúc và khoảng thời gian phải chia hết thành các ca 1 giờ."],
  ["Quầy và sức chứa", "Mỗi ca được backend tự sinh 8 quầy QUAY_1 đến QUAY_8, mặc định 2 người/quầy."],
  ["Trùng lịch", "Không nhập trùng cùng Tên cán bộ + Ngày tiếp dân trong file hoặc với lịch đang tồn tại."],
  ["Giới hạn hiện tại", "Mỗi cán bộ trong một ngày chỉ có một khoảng Từ–Đến trên một dòng; chưa hỗ trợ hai khoảng sáng/chiều trong cùng bản ghi import."],
  ["Ghi chú", "Không bắt buộc; tối đa 255 ký tự."],
]);
instructionSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
instructionSheet.getRow(1).fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F4E78" },
};
instructionSheet.eachRow((row) => {
  row.alignment = { vertical: "top", wrapText: true };
});
instructionSheet.views = [{ state: "frozen", ySplit: 1 }];

await workbook.xlsx.writeFile(outputPath);
console.log(`Generated ${outputPath}`);
