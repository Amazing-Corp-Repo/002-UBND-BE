import fs from "fs-extra";
import path from "path";
import ExcelJS from "exceljs";

const FileService = {
    async deleteFileByAbsolutePath(absolutePath) {
        try {
            console.log("🔍 Đường dẫn file cần xóa:", absolutePath);

            if (await fs.pathExists(absolutePath)) {
                await fs.remove(absolutePath);
                console.log(`✅ Đã xóa file: ${absolutePath}`);

                // ✅ Kiểm tra thư mục cha
                const parentDir = path.dirname(absolutePath);
                const files = await fs.readdir(parentDir);

                if (files.length === 0) {
                    await fs.remove(parentDir);
                }
            } else {
                console.warn(`⚠️ File không tồn tại: ${absolutePath}`);
            }
        } catch (err) {
            console.error("❌ Lỗi khi xóa theo absolutePath:", err.message);
        }
    },

    async deleteFile(relativePath) {
        try {
            const fullPath = path.join(process.cwd(), relativePath);
            console.log("🔍 Đường dẫn đầy đủ của file:", fullPath);

            if (await fs.pathExists(fullPath)) {
                await fs.remove(fullPath);
                console.log(`✅ Đã xóa file: ${fullPath}`);

                // 🔍 Kiểm tra thư mục cha
                const parentDir = path.dirname(fullPath);
                const files = await fs.readdir(parentDir);

                if (files.length === 0) {
                    await fs.remove(parentDir);
                    console.log(`🗑️ Thư mục rỗng đã bị xóa: ${parentDir}`);
                } else {
                    console.log(`📁 Thư mục ${parentDir} vẫn còn ${files.length} file, không xóa.`);
                }
            } else {
                console.warn(`⚠️ File không tồn tại: ${fullPath}`);
            }
        } catch (err) {
            console.error("❌ Lỗi khi xóa file:", err.message);
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
            console.log(`✅ Đã xóa file sau khi đọc: ${filePath}`);
        } catch (err) {
            console.error("❌ Lỗi khi xóa file sau khi đọc:", err.message);
        }

        return rows;
    },
};

export default FileService;