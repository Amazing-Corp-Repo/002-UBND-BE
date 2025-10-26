import fs from "fs-extra";
import path from "path";

const FileService = {
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
};

export default FileService;