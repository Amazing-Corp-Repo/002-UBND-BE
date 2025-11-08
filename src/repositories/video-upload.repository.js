import prisma from "../config/database.config.js";

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
};

export default VideoUploadRepository;