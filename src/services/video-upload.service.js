import VIDEO_STATUS from "../constants/video-status.constant.js";
import VideoUploadRepository from "../repositories/video-upload.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { connectRabbitMQ } from "../config/rabbitmq.config.js";
import env from "../config/environment.config.js";
import fs from "fs";
import path from "path";

const VideoUploadService = {
    async handleUploadChunk(file, idVideo, currentIndex, totalChunks) {
        if (totalChunks === 1) {
            if (!file || file.length === 0) {
                throw new BaseError(400, "Không có tệp tin để tải lên");
            }
            const now = new Date();
            const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
            const dateFolder = vnTime.toISOString().split("T")[0];

            const targetDir = path.join(
                process.cwd(),
                "src",
                "public",
                "uploads",
                "PHAN_ANH",
                dateFolder,
                "video"
            );
            await fs.promises.mkdir(targetDir, { recursive: true });

            const srcPath = path.resolve(file[0].path);
            const mergedPath = path.join(targetDir, `${idVideo}.mp4`);

            try {
                await fs.promises.rename(srcPath, mergedPath);
            } catch (err) {
                await fs.promises.copyFile(srcPath, mergedPath);
                try {
                    await fs.promises.unlink(srcPath);
                } catch (e) {
                    console.warn(`Không thể xóa file tạm: ${srcPath}`);
                }
            }
            const publicDir = path.join(process.cwd(), "src", "public");
            const relativePath = path.relative(publicDir, mergedPath).replace(/\\/g, "/");
            const relativeUrl = `/${relativePath}`;

            await VideoUploadRepository.createVideoUpload({
                id: idVideo,
                total_chunks: 1,
                status: VIDEO_STATUS.MERGING,
                received_chunks: 1,
                final_mp4_url: relativeUrl,
                created_at: new Date().toISOString(),
            });

            const { channel } = await connectRabbitMQ();
            await channel.sendToQueue(
                env.queues.videoHLS,
                Buffer.from(JSON.stringify({ uploadId: idVideo, mp4Path: mergedPath })),
                { persistent: true }
            );

            return `Uploaded single chunk as original mp4 and queued HLS job for uploadId ${idVideo}`;
        }

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
                env.queues.videoMerge,
                Buffer.from(JSON.stringify({ uploadId: existingVideoUpload.id })),
                { persistent: true }
            );
        }
        return `Chunk ${currentIndex} uploaded thành công. Upload được ${existingVideoUpload.received_chunks} / ${existingVideoUpload.total_chunks} chunks.`;
    },
};

export default VideoUploadService;