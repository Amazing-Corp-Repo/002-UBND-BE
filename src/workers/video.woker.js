import VideoProcessingService from "../services/video-processing.service.js";
import { connectRabbitMQ } from "../config/rabbitmq.config.js";
import env from "../config/environment.config.js";

const { channel } = await connectRabbitMQ();
const MAX_RETRY = 3;

channel.consume(env.queues.videoProcess, async (msg) => {
    if (!msg) return;

    const job = JSON.parse(msg.content.toString());
    const { uploadId } = job;
    const retryCount = job.retryCount || 0;

    try {
        // 1️⃣ Merge chunks
        const merged = await VideoProcessingService.mergeVideoChunks(uploadId);
        if (!merged?.mergedPath) {
            console.warn(`⚠️ Merge thất bại hoặc không có file → bỏ qua job ${uploadId}`);
            return channel.ack(msg);
        }

        // 2️⃣ Convert sang HLS
        await VideoProcessingService.convertToHLS(uploadId, merged.mergedPath);
        channel.ack(msg); // ✅ hoàn thành
    } catch (err) {
        const msgErr = err.message || err.toString();
        console.error(`❌ Pipeline lỗi [${uploadId}]: ${msgErr}`);

        // Retry giới hạn
        if (retryCount < MAX_RETRY) {
            const nextJob = { uploadId, retryCount: retryCount + 1 };
            await channel.sendToQueue(env.queues.videoProcess, Buffer.from(JSON.stringify(nextJob)), { persistent: true });
            console.warn(`⚠️ Retry ${retryCount + 1}/${MAX_RETRY} cho job ${uploadId}`);
        } else {
            console.error(`💀 Job ${uploadId} thất bại hoàn toàn sau ${MAX_RETRY} lần retry`);
        }

        channel.ack(msg); // ✅ Không bao giờ requeue vô hạn
    }
});
