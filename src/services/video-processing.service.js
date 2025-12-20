import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import VideoUploadRepository from "../repositories/video-upload.repository.js";
import VIDEO_STATUS from "../constants/video-status.constant.js";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const VideoProcessingService = {
  async mergeVideoChunks(uploadId) {
    const videoUpload = await VideoUploadRepository.findVideoUploadById(
      uploadId
    );
    if (!videoUpload)
      throw new Error("Không tìm thấy video upload trong database.");

    const chunks = await VideoUploadRepository.getChunksByUploadId(uploadId);
    if (!chunks?.length)
      throw new Error("Không tìm thấy các chunk trong database.");

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

    const mergedPath = path.join(targetDir, `${uploadId}.mp4`);
    const writeStream = fs.createWriteStream(mergedPath);
    for (const chunk of chunks) {
      const chunkPath = path.resolve(chunk.path);
      const readStream = fs.createReadStream(chunkPath);
      await pipeline(readStream, writeStream, { end: false });
    }

    writeStream.end();
    await new Promise((resolve) => writeStream.on("close", resolve));

    // Xoá chunk cũ
    for (const chunk of chunks) {
      try {
        await fs.promises.unlink(chunk.path);
      } catch {
        console.warn(`⚠️ Không thể xóa chunk: ${chunk.path}`);
      }
    }

    const publicDir = path.join(process.cwd(), "src", "public");
    const relativePath = path
      .relative(publicDir, mergedPath)
      .replace(/\\/g, "/");
    const relativeUrl = `/${relativePath}`;

    await VideoUploadRepository.updateVideoUpload(uploadId, {
      status: VIDEO_STATUS.MERGING,
      final_mp4_url: relativeUrl,
      updated_at: new Date().toISOString(),
    });

    return { mergedPath, relativeUrl };
  },

  async convertToHLS(uploadId, mp4Path) {
    if (!mp4Path) throw new Error("mp4Path không hợp lệ");

    const baseDir = path.dirname(mp4Path);
    const hlsDir = path.join(baseDir, `${uploadId}`);
    await fs.promises.mkdir(hlsDir, { recursive: true });

    const hlsPlaylistPath = path.join(hlsDir, "index.m3u8");

    await new Promise((resolve, reject) => {
      ffmpeg(mp4Path)
        .addOptions([
          "-profile:v baseline",
          "-level 3.0",
          "-start_number 0",
          "-hls_time 10",
          "-hls_list_size 0",
          "-f hls",
        ])
        .output(hlsPlaylistPath)
        .on("progress", (p) =>
          process.stdout.write(`📀 Converting: ${Math.round(p.percent)}%\r`)
        )
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    const publicDir = path.join(process.cwd(), "src", "public");
    const relativePath = path
      .relative(publicDir, hlsPlaylistPath)
      .replace(/\\/g, "/");
    const relativeUrl = `/${relativePath}`;

    await VideoUploadRepository.updateVideoUpload(uploadId, {
      status: VIDEO_STATUS.DONE,
      final_hls_url: relativeUrl,
      updated_at: new Date().toISOString(),
      final_mp4_url: null,
    });

    await safeDeleteMp4(mp4Path);

    return { hlsPath: hlsPlaylistPath, relativeUrl };
  },

  async convertHLSToMp4ForExport(playlistPath, outputMp4) {
    try {
      await fs.promises.access(playlistPath, fs.constants.F_OK);
    } catch {
      const e = new Error("Không tìm thấy index.m3u8");
      e.code = "ENOENT";
      throw e;
    }

    await fs.promises.mkdir(path.dirname(outputMp4), { recursive: true });

    const playlistDir = path.dirname(playlistPath);
    const playlistFile = path.basename(playlistPath);
    const outAbs = path.resolve(outputMp4);

    const oldCwd = process.cwd();

    const run = (mode = "copy") =>
      new Promise((resolve, reject) => {
        const proc = ffmpeg(playlistFile)
          .inputOptions([
            "-protocol_whitelist",
            "file,http,https,tcp,tls,crypto",
            "-allowed_extensions",
            "ALL",
          ])
          .addOptions(
            mode === "copy"
              ? ["-c copy", "-bsf:a aac_adtstoasc"]
              : [
                  "-c:v libx264",
                  "-preset veryfast",
                  "-crf 23",
                  "-c:a aac",
                  "-b:a 128k",
                  "-movflags +faststart",
                ]
          )
          .output(outAbs);

        // ❌ bỏ hết log start/stderr
        proc.on("end", resolve).on("error", reject).run();
      });

    try {
      process.chdir(playlistDir);

      try {
        await run("copy");
      } catch (err) {
        // chỉ log khi thật sự cần fallback
        console.warn("[FFMPEG] copy failed, fallback encode:", err?.message);
        await run("encode");
      }
    } finally {
      process.chdir(oldCwd);
    }
  },
};

const safeDeleteMp4 = async (mp4Path) => {
  try {
    await fs.promises.access(mp4Path, fs.constants.F_OK);
    await fs.promises.unlink(mp4Path);
  } catch (err) {
    console.warn(`Không thể xoá mp4: ${mp4Path}`, err.message);
  }
};

export default VideoProcessingService;
