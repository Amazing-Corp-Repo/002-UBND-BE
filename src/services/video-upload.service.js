import VIDEO_STATUS from "../constants/video-status.constant.js";
import VideoUploadRepository from "../repositories/video-upload.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { connectRabbitMQ } from "../config/rabbitmq.config.js";
import env from "../config/environment.config.js";

const VideoUploadService = {
    async handleUploadChunk(file, idVideo, currentIndex, totalChunks) {
        if (!file || file.length === 0) {
            throw new BaseError(400, "Không có tệp tin để tải lên");
        }

        let existingVideoUpload = await VideoUploadRepository.findVideoUploadById(idVideo);

        if (!existingVideoUpload) {
            existingVideoUpload = await VideoUploadRepository.createVideoUpload({
                id: idVideo,
                total_chunks: totalChunks,
                status: VIDEO_STATUS.UPLOADING,
                received_chunks: 1,
                created_at: new Date().toISOString(),
            });
        } else {
            let dataVideoUploadUpdate = {
                received_chunks: { increment: 1 },
                updated_at: new Date().toISOString(),
            };
            existingVideoUpload = await VideoUploadRepository.updateVideoUpload(idVideo, dataVideoUploadUpdate);
        }

        let chunkData = {
            upload_id: existingVideoUpload.id,
            chunk_index: currentIndex,
            path: file[0].path,
            created_at: new Date().toISOString(),
            size_mb: file[0].sizeMB,
        }

        await VideoUploadRepository.createChunks(chunkData);

        if (existingVideoUpload.received_chunks === existingVideoUpload.total_chunks) {
            existingVideoUpload = await VideoUploadRepository.updateVideoUpload(idVideo, {
                status: VIDEO_STATUS.READY,
                updated_at: new Date().toISOString(),
            });
            const { channel } = await connectRabbitMQ();
            await channel.sendToQueue(
                env.queues.videoProcess,
                Buffer.from(JSON.stringify({ uploadId: existingVideoUpload.id })),
                { persistent: true }
            );
        }
        return `Chunk ${currentIndex} uploaded thành công. Upload được ${existingVideoUpload.received_chunks} / ${existingVideoUpload.total_chunks} chunks.`;
    },
};

export default VideoUploadService;