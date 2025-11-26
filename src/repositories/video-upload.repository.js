import prisma from "../config/database.config.js";
import VIDEO_STATUS from "../constants/video-status.constant.js";

const VideoUploadRepository = {
  async createVideoUpload(data) {
    return await prisma.video_uploads.create({
      data,
    });
  },

  async findVideoUploadById(id) {
    return await prisma.video_uploads.findUnique({
      where: { id },
    });
  },

  async createChunks(data) {
    return await prisma.video_upload_chunks.create({
      data,
    });
  },

  async updateVideoUpload(id, data) {
    return await prisma.video_uploads.update({
      where: { id },
      data,
    });
  },

  async getChunksByUploadId(uploadId) {
    return await prisma.video_upload_chunks.findMany({
      where: { upload_id: uploadId },
      orderBy: { chunk_index: "asc" },
    });
  },

  async getVideoToCleanup() {
    let cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    console.log("Cutoff Date:", cutoffDate);

    return await prisma.video_uploads.findMany({
      where: {
        status: {
          in: [
            VIDEO_STATUS.UPLOADING,
            VIDEO_STATUS.MERGING,
            VIDEO_STATUS.FAILED,
          ],
        },
        created_at: { lt: cutoffDate },
      },
      select: { id: true },
    });
  },
};

export default VideoUploadRepository;
