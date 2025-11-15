import fs from "fs-extra";
import path from "path";
import ExcelJS from "exceljs";

const FileService = {
    async deleteFileByAbsolutePath(absolutePath) {
        try {

            if (await fs.pathExists(absolutePath)) {
                await fs.remove(absolutePath);

                // Kiểm tra thư mục cha
                const parentDir = path.dirname(absolutePath);
                const files = await fs.readdir(parentDir);

                if (files.length === 0) {
                    await fs.remove(parentDir);
                }
            } else {
                console.warn(`File không tồn tại: ${absolutePath}`);
            }
        } catch (err) {
            console.error("Lỗi khi xóa theo absolutePath:", err.message);
        }
    },

    async deleteFile(relativePath) {
        try {
            const fullPath = path.join(process.cwd(), relativePath);

            if (await fs.pathExists(fullPath)) {
                await fs.remove(fullPath);

                const parentDir = path.dirname(fullPath);
                const files = await fs.readdir(parentDir);

                if (files.length === 0) {
                    await fs.remove(parentDir);
                } else {
                    console.log(`Thư mục ${parentDir} vẫn còn ${files.length} file, không xóa.`);
                }
            } else {
                console.warn(`File không tồn tại: ${fullPath}`);
            }
        } catch (err) {
            console.error("Lỗi khi xóa file:", err.message);
        }
    },

    async readSpreadsheetFile(filePath) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[0];

        const rows = [];
        let headers = [];

        worksheet.eachRow((row, rowNumber) => {
            const values = row.values.slice(1);
            if (rowNumber === 1) {
                headers = values.map((v) => String(v || "").trim());
            } else {
                const obj = {};
                headers.forEach((key, i) => {
                    obj[key] = values[i] ?? null;
                });
                rows.push(obj);
            }
        });
        try {
            const parentDir = path.dirname(filePath);
            await fs.remove(parentDir);
            console.log(`Đã xóa file sau khi đọc: ${filePath}`);
        } catch (err) {
            console.error("Lỗi khi xóa file sau khi đọc:", err.message);
        }

        return rows;
    },

    excelStyles: {
        title(sheet, rowIndex, text, colSpan = 2) {
            sheet.mergeCells(rowIndex, 1, rowIndex, colSpan);
            const cell = sheet.getCell(rowIndex, 1);
            cell.value = text;
            cell.font = { bold: true, size: 16 };
            cell.alignment = { horizontal: "center" };
        },

        sectionTitle(sheet, rowIndex, text, colSpan = 2) {
            sheet.mergeCells(rowIndex, 1, rowIndex, colSpan);
            const cell = sheet.getCell(rowIndex, 1);
            cell.value = text;
            cell.font = { bold: true, size: 14 };
        },

        tableHeader(row) {
            row.eachCell(cell => {
                cell.font = { bold: true };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFEFEFEF" }
                };
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" }
                };
                cell.alignment = { horizontal: "center" };
            });
        },

        tableRow(row) {
            row.eachCell(cell => {
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" }
                };
                cell.alignment = { horizontal: "left" };
            });
        },

        autoFit(sheet) {
            sheet.columns.forEach(column => {
                let maxLength = 10;
                column.eachCell({ includeEmpty: true }, cell => {
                    const len = cell.value ? cell.value.toString().length : 0;
                    if (len > maxLength) maxLength = len;
                });
                column.width = maxLength + 5;
            });
        }
    }
};

export default FileService;