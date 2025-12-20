import { toUTCFromVN_End, toUTCFromVN_Start } from "../utils/string.util.js";
import FileService from "./file.service.js";
import { connectRabbitMQ } from "../config/rabbitmq.config.js";
import VideoUploadRepository from "../repositories/video-upload.repository.js";
import path from "path";
import PhanAnhRepository from "../repositories/phan-anh.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import env from "../config/environment.config.js";
import fs from "fs";

const ExportService = {
  async exportPhanAnhToZip(fromRaw, toRaw, email) {
    if (!email) {
      throw new BaseError(400, "Email không được để trống");
    }
    const from = fromRaw ? toUTCFromVN_Start(fromRaw) : null;
    const to = toRaw ? toUTCFromVN_End(toRaw) : null;

    const phanAnhList = await PhanAnhRepository.getPhanAnhToDowload(from, to);
    const normalized = await normalizePhanAnhMedia(phanAnhList);

    if (!normalized.length) {
      throw new BaseError(404, "Không có phản ánh trong khoảng thời gian này");
    }
    const { channel } = await connectRabbitMQ();

    await channel.sendToQueue(
      env.queues.exportPhanAnh,
      Buffer.from(
        JSON.stringify({
          exportId: Date.now().toString(),
          phanAnhList: normalized,
          email,
        })
      ),
      { persistent: true }
    );
  },

  async getExportPhanAnhList() {
    const exportDir = path.resolve("src/public/export/phan-anh");
    await fs.promises.mkdir(exportDir, { recursive: true });

    const files = await fs.promises.readdir(exportDir);

    const exports = files
      .filter((f) => /\.zip$/i.test(f))
      .map((f) => {
        const filePath = path.join(exportDir, f);
        const stat = fs.statSync(filePath);
        const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);

        return {
          name: f,
          size: `${sizeMB} MB`,
          createAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));

    return exports;
  },

  async resolveExportPhanAnhPath(fileName) {
    const exportDir = path.resolve("src/public/export/phan-anh");
    return resolveSafePath(fileName, exportDir);
  },

  async ensureExists(fullPath) {
    if (!fs.existsSync(fullPath)) {
      const err = new Error("NOT_FOUND");
      err.code = "NOT_FOUND";
      throw err;
    }
  },

  async deleteExport(fullPath) {
    await fs.promises.unlink(fullPath);
  },
};

const normalizePhanAnhMedia = (phanAnhList = []) => {
  return Promise.all(
    phanAnhList.map(async (pa) => {
      // IMAGE
      const images = [];

      for (const img of pa.dinh_kem_phan_anh || []) {
        const absPath = await FileService.resolvePublicPath(img.url_file);

        if (absPath) {
          images.push({
            url: img.url_file,
            absPath,
          });
        }
      }

      // VIDEO (HLS)
      const videos = [];
      for (const idVideo of pa.id_video || []) {
        const video = await VideoUploadRepository.findVideoUploadById(idVideo);
        const hlsIndexPath = await FileService.resolvePublicPath(
          video.final_hls_url
        );

        if (hlsIndexPath) {
          videos.push({
            hlsUrl: hlsIndexPath,
            hlsDir: path.dirname(hlsIndexPath),
          });
        }
      }

      return {
        id: pa.id,
        ma_phan_anh: pa.ma_phan_anh,
        tieu_de: pa.tieu_de,
        muc_do: pa.muc_do,
        mo_ta: pa.mo_ta,
        vi_tri: pa.vi_tri,
        thoi_gian_tao: pa.thoi_gian_tao,
        linh_vuc: pa.linh_vuc_phan_anh?.ten || null,
        lich_su_trang_thai: pa.lich_su_trang_thai || [],
        images,
        videos,
      };
    })
  );
};

const resolveSafePath = (fileName, exportDir) => {
  const safeName = path.basename(fileName);
  const fullPath = path.join(exportDir, safeName);

  const rel = path.relative(exportDir, fullPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    const err = new Error("INVALID_PATH");
    err.code = "INVALID_PATH";
    throw err;
  }

  return { safeName, fullPath };
};

export default ExportService;
