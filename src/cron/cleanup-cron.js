import cron from "node-cron";

export const registerCleanupCron = () => {
  cron.schedule(
    "0 17 * * *",
    async () => {
      console.log("Cleanup cron chạy mỗi phút!");
      const videosToCleanup = await VideoUploadRepository.getVideoToCleanup();
      videosToCleanup.forEach((video) => {
        video.video_upload_chunks.forEach((chunk) => {
          console.log(`  Chunk ID: ${chunk.id}, Path: ${chunk.path}`);
          console.log("Clear this chunk file from storage here.");
        });
        console.log(`Clean up video upload ID: ${video.id}`);
      });
    },
    {
      timezone: "utc",
    }
  );
};
