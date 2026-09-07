import cron from "node-cron";
import ThuVienRepository from "../repositories/thu-vien.repository.js";
import ThuVienService from "../services/thu-vien.service.js";

export const registerCleanupThuVienCron = () => {
  cron.schedule(
    "0 2 * * *", // 02:00 UTC mỗi ngày
    async () => {
      console.log("[cleanup-thu-vien] Bắt đầu dọn file tài liệu đã xóa quá 30 ngày...");
      const documents = await ThuVienRepository.getDocumentsToCleanup();

      for (const doc of documents) {
        try {
          await ThuVienService._deletePhysicalFiles(doc.id);
          await ThuVienRepository.forceDelete(doc.id, null);
          console.log(`[cleanup-thu-vien] Đã dọn file cho tài liệu: ${doc.id}`);
        } catch (error) {
          console.error(`[cleanup-thu-vien] Lỗi khi dọn tài liệu ${doc.id}: ${error.message}`);
        }
      }

      console.log(`[cleanup-thu-vien] Hoàn thành dọn ${documents.length} tài liệu.`);
    },
    {
      timezone: "utc",
    },
  );
};