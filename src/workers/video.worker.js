import { connectRabbitMQ } from "../config/rabbitmq.config.js";
import VideoProcessingService from "../services/video-processing.service.js";
import env from "../config/environment.config.js";

const { channel } = await connectRabbitMQ();

const MAX_RETRY_MERGE = 3;
const MAX_RETRY_HLS = 3;


channel.consume(env.queues.videoMerge, async (msg) => {
    if (!msg) return;

    const job = JSON.parse(msg.content.toString());
    const retryCount = job.retryCount || 0;
    const { uploadId } = job;


    try {
        // Merge chunks → mp4
        const merged = await VideoProcessingService.mergeVideoChunks(uploadId);
        console.log(`[MERGE] Hoàn tất merge: ${merged.mergedPath}`);

        // Đẩy sang queue HLS
        await channel.sendToQueue(
            env.queues.videoHLS,
            Buffer.from(JSON.stringify({
                uploadId,
                mp4Path: merged.mergedPath
            })),
            { persistent: true }
        );

        channel.ack(msg);
    } catch (err) {
        if (retryCount < MAX_RETRY_MERGE) {
            console.warn(`[MERGE] Retry ${retryCount + 1}/${MAX_RETRY_MERGE}`);
            await channel.sendToQueue(
                env.queues.videoMerge,
                Buffer.from(JSON.stringify({
                    uploadId,
                    retryCount: retryCount + 1
                })),
                { persistent: true }
            );
        } else {
            console.error(`MERGE] FAIL sau ${MAX_RETRY_MERGE} retries`);
        }

        channel.ack(msg);
    }
});


channel.consume(env.queues.videoHLS, async (msg) => {
    if (!msg) return;

    const job = JSON.parse(msg.content.toString());
    const retryCount = job.retryCount || 0;
    const { uploadId, mp4Path } = job;

    console.log(`[HLS] Nhận job uploadId = ${uploadId}`);

    try {
        // Convert .mp4 → HLS
        await VideoProcessingService.convertToHLS(uploadId, mp4Path);
        console.log(`[HLS] DONE cho ${uploadId}`);

        channel.ack(msg);
    } catch (err) {
        console.error(`[HLS] Lỗi uploadId ${uploadId}:`, err.message);

        if (retryCount < MAX_RETRY_HLS) {
            console.warn(`[HLS] Retry ${retryCount + 1}/${MAX_RETRY_HLS}`);
            await channel.sendToQueue(
                env.queues.videoHLS,
                Buffer.from(JSON.stringify({
                    uploadId,
                    mp4Path,
                    retryCount: retryCount + 1
                })),
                { persistent: true }
            );
        } else {
            console.error(`[HLS] FAIL sau ${MAX_RETRY_HLS} retries`);
        }

        channel.ack(msg);
    }
});
