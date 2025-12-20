import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";

import { connectRabbitMQ } from "../config/rabbitmq.config.js";
import env from "../config/environment.config.js";
import FileService from "../services/file.service.js";
import MailService from "../services/mail.service.js";
import MAIL_TYPE from "../constants/mail.constant.js";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const { channel } = await connectRabbitMQ();

channel.prefetch(1);

const MAX_RETRY_EXPORT = 3;

// Windows-safe filename/folder: thay các ký tự bị cấm
const sanitizeForPath = (v) =>
  String(v ?? "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-"); // windows invalid chars

const isInvalidPathError = (err) => {
  // fs-extra trên Windows thường ném EINVAL + message này
  return (
    err?.code === "EINVAL" &&
    typeof err?.message === "string" &&
    err.message.includes("Path contains invalid characters")
  );
};

const isPermanentError = (err) => {
  return isInvalidPathError(err);
};

channel.consume(env.queues.exportPhanAnh, async (msg) => {
  if (!msg) return;

  const job = JSON.parse(msg.content.toString());

  const retryCount = job.retryCount || 0;
  const exportIdRaw = job.exportId;
  const exportId = sanitizeForPath(exportIdRaw || Date.now());

  const phanAnhList = job.phanAnhList || [];
  const email = job.email;

  console.log(
    `[EXPORT][${exportId}] Starting export job with ${phanAnhList.length} items (retry=${retryCount})`
  );

  const exportRoot = path.join(process.cwd(), "tmp", "exports", exportId);

  try {
    await fs.ensureDir(exportRoot);

    for (const pa of phanAnhList) {
      pa.__export = pa.__export || { imageError: false, videoError: false };

      try {
        await FileService.exportImagesForOne(pa, exportRoot);
      } catch (e) {
        pa.__export.imageError = true;
        console.error(
          `[EXPORT][${exportId}][${pa.ma_phan_anh}] exportImages ERROR:`,
          e?.message || e
        );
      }

      try {
        await FileService.exportVideosForOne(pa, exportRoot);
      } catch (e) {
        pa.__export.videoError = true;
        console.error(
          `[EXPORT][${exportId}][${pa.ma_phan_anh}] exportVideos ERROR:`,
          e?.message || e
        );
      }
    }

    await FileService.exportContentTxt(phanAnhList, exportRoot);

    const exportZipDir = path.join(
      process.cwd(),
      "src",
      "public",
      "export",
      "phan-anh"
    );
    await fs.ensureDir(exportZipDir);

    const zipFileName = `phan-anh-${exportId}.zip`;
    const zipPath = path.join(exportZipDir, zipFileName);

    await FileService.zipExportRoot(exportRoot, zipPath);
    await fs.remove(exportRoot);
    await FileService.cleanupOriginalMedia(phanAnhList);

    await MailService.sendMail(email, MAIL_TYPE.EXPORT_READY, {
      exportId,
      adminUrl: env.URL_EXPORT_PHAN_ANH,
    });

    console.log(`[EXPORT][${exportId}] DONE`);
    channel.ack(msg);
  } catch (err) {
    console.error(`[EXPORT][${exportId}] ERROR`, err?.message || err);

    if (isPermanentError(err)) {
      console.error(`[EXPORT][${exportId}] CANCEL job (permanent error)`);
      try {
        await fs.remove(exportRoot);
      } catch {}
      channel.ack(msg);
      return;
    }

    if (retryCount < MAX_RETRY_EXPORT) {
      console.warn(
        `[EXPORT][${exportId}] Retry ${retryCount + 1}/${MAX_RETRY_EXPORT}`
      );

      await channel.sendToQueue(
        env.queues.exportPhanAnh,
        Buffer.from(
          JSON.stringify({ ...job, exportId, retryCount: retryCount + 1 })
        ),
        { persistent: true }
      );
    } else {
      console.error(
        `[EXPORT][${exportId}] FAIL after ${MAX_RETRY_EXPORT} retries`
      );
      try {
        await fs.remove(exportRoot);
      } catch {}
    }

    channel.ack(msg);
  }
});
