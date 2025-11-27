import cron from "node-cron";
import VideoUploadRepository from "../repositories/video-upload.repository.js";
import VIDEO_STATUS from "../constants/video-status.constant.js";
import fs from "fs-extra";

export const registerCleanupCron = () => {
  cron.schedule(
    "0 17 * * *",
    async () => {
      const videosToCleanup = await VideoUploadRepository.getVideoToCleanup();
      videosToCleanup.forEach(async (video) => {
        video.video_upload_chunks.forEach(async (chunk) => {
          console.log(`  Chunk ID: ${chunk.id}, Path: ${chunk.path}`);
          try {
            const chunkFilePath = chunk.path;
            if (fs.pathExists(chunkFilePath)) {
              fs.remove(chunkFilePath);
            } else {
              console.log(`Tệp chunk không tồn tại: ${chunkFilePath}`);
            }

            await VideoUploadRepository.deleteChunk(chunk.path);
            console.log(`Đã xóa chunk: ${chunk.id}.`);
          } catch (error) {
            console.error(
              `Lỗi khi xóa chunk ID: ${chunk.id} - Error: ${error.message}`
            );
          }
        });

        await VideoUploadRepository.updateVideoUpload(video.id, {
          status: VIDEO_STATUS.CLEANED_UP,
        });
      });
    },
    {
      timezone: "utc",
    }
  );
};
