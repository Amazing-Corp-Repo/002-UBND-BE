import fs from "fs-extra";
import path from "path";
import ExcelJS from "exceljs";
import { buildContentTxt, toVNDateFolder } from "../utils/string.util.js";
import VideoProcessingService from "./video-processing.service.js";
import archiver from "archiver";
import XLSX from "xlsx";

const PUBLIC_DIR = path.join(process.cwd(), "src", "public");

const XLSX_PATH = path.join(
  process.cwd(),
  "src",
  "public",
  "uploads",
  "ADDRESS_VOTE",
  "address_vote_uploads.xlsx",
);

// Cache workbook
let cachedWb = null;
let cachedMtimeMs = 0;

// Load / reload workbook khi file thay đổi
const getWorkbook = () => {
  const stat = fs.statSync(XLSX_PATH);

  if (!cachedWb || stat.mtimeMs !== cachedMtimeMs) {
    cachedWb = XLSX.readFile(XLSX_PATH, { cellDates: true });
    cachedMtimeMs = stat.mtimeMs;
  }
  return cachedWb;
};

// Search cột A === X, trả mảng object theo header

const FileService = {
  async deleteFileByAbsolutePath(absolutePath) {
    try {
      if (await fs.pathExists(absolutePath)) {
        await fs.remove(absolutePath);

        // Kiểm tra thư mục cha
        const parentDir = path.dirname(absolutePath);
        const files = await fs.readdir(parentDir);

        if (files.length === 0) {
          await fs.remove(parentDir);
        }
      } else {
        console.warn(`File không tồn tại: ${absolutePath}`);
      }
    } catch (err) {
      console.error("Lỗi khi xóa theo absolutePath:", err.message);
    }
  },

  async deleteFile(relativePath) {
    try {
      const fullPath = path.join(process.cwd(), relativePath);

      if (await fs.pathExists(fullPath)) {
        await fs.remove(fullPath);

        const parentDir = path.dirname(fullPath);
        const files = await fs.readdir(parentDir);

        if (files.length === 0) {
          await fs.remove(parentDir);
        } else {
          console.log(
            `Thư mục ${parentDir} vẫn còn ${files.length} file, không xóa.`,
          );
        }
      } else {
        console.warn(`File không tồn tại: ${fullPath}`);
      }
    } catch (err) {
      console.error("Lỗi khi xóa file:", err.message);
    }
  },

  async readSpreadsheetFile(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    const rows = [];
    let headers = [];

    worksheet.eachRow((row, rowNumber) => {
      const values = row.values.slice(1);
      if (rowNumber === 1) {
        headers = values.map((v) => String(v || "").trim());
      } else {
        const obj = {};
        headers.forEach((key, i) => {
          obj[key] = values[i] ?? null;
        });
        rows.push(obj);
      }
    });
    try {
      const parentDir = path.dirname(filePath);
      await fs.remove(parentDir);
      console.log(`Đã xóa file sau khi đọc: ${filePath}`);
    } catch (err) {
      console.error("Lỗi khi xóa file sau khi đọc:", err.message);
    }

    return rows;
  },

  excelStyles: {
    title(sheet, rowIndex, text, colSpan = 2) {
      sheet.mergeCells(rowIndex, 1, rowIndex, colSpan);
      const cell = sheet.getCell(rowIndex, 1);
      cell.value = text;
      cell.font = { bold: true, size: 16 };
      cell.alignment = { horizontal: "center" };
    },

    sectionTitle(sheet, rowIndex, text, colSpan = 2) {
      sheet.mergeCells(rowIndex, 1, rowIndex, colSpan);
      const cell = sheet.getCell(rowIndex, 1);
      cell.value = text;
      cell.font = { bold: true, size: 14 };
    },

    tableHeader(row) {
      row.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEFEFEF" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "center" };
      });
    },

    tableRow(row) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "left" };
      });
    },

    autoFit(sheet) {
      sheet.columns.forEach((column) => {
        let maxLength = 10;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const len = cell.value ? cell.value.toString().length : 0;
          if (len > maxLength) maxLength = len;
        });
        column.width = maxLength + 5;
      });
    },
  },

  async ensureDir(dir) {
    await fs.promises.mkdir(dir, { recursive: true });
  },

  async exportContentTxt(phanAnhList, exportRoot) {
    for (const pa of phanAnhList) {
      const dateFolder = toVNDateFolder(pa.thoi_gian_tao);
      const paDir = path.join(exportRoot, dateFolder, pa.ma_phan_anh);

      await this.ensureDir(paDir);

      const contentTxt = buildContentTxt(pa);

      await fs.promises.writeFile(
        path.join(paDir, "content.txt"),
        contentTxt,
        "utf8",
      );
    }
  },

  async exportImagesForOne(pa, exportRoot) {
    if (!pa?.images?.length) return;

    const dateFolder = toVNDateFolder(pa.thoi_gian_tao);
    const imgDir = path.join(exportRoot, dateFolder, pa.ma_phan_anh, "images");

    await this.ensureDir(imgDir);

    for (const img of pa.images) {
      const fileName = path.basename(img.absPath);
      await fs.copy(img.absPath, path.join(imgDir, fileName));
    }
  },

  async exportVideosForOne(pa, exportRoot) {
    if (!pa?.videos?.length) return null;

    const dateFolder = toVNDateFolder(pa.thoi_gian_tao);
    const videoDir = path.join(
      exportRoot,
      dateFolder,
      pa.ma_phan_anh,
      "videos",
    );
    await this.ensureDir(videoDir);

    for (let i = 0; i < pa.videos.length; i++) {
      const video = pa.videos[i];
      const playlistPath = path.join(video.hlsDir, "index.m3u8");
      const outputMp4 = path.join(videoDir, `${pa.ma_phan_anh}-${i + 1}.mp4`);
      await VideoProcessingService.convertHLSToMp4ForExport(
        playlistPath,
        outputMp4,
      );
    }

    return null;
  },

  async zipExportRoot(exportRoot, zipPath) {
    const exists = await fs.pathExists(exportRoot);
    if (!exists) {
      const e = new Error(`exportRoot not found: ${exportRoot}`);
      e.code = "ENOENT";
      throw e;
    }

    await fs.ensureDir(path.dirname(zipPath));

    if (await fs.pathExists(zipPath)) {
      await fs.remove(zipPath);
    }

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);

      const archive = archiver("zip", {
        zlib: { level: 1 },
      });

      const cleanupAndReject = async (err) => {
        try {
          output.destroy();
        } catch {}

        try {
          archive.destroy();
        } catch {}

        try {
          if (await fs.pathExists(zipPath)) await fs.remove(zipPath);
        } catch {}

        reject(err);
      };

      output.on("close", () => {
        resolve({
          zipPath,
          bytes: archive.pointer(),
        });
      });

      output.on("error", cleanupAndReject);
      archive.on("error", cleanupAndReject);

      archive.on("warning", (err) => {
        if (err.code === "ENOENT") {
          console.warn("[ZIP] warning:", err.message);
        } else {
          cleanupAndReject(err);
        }
      });

      archive.pipe(output);

      archive.directory(exportRoot, false);

      archive.finalize().catch(cleanupAndReject);
    });
  },

  async resolvePublicPath(url) {
    if (!url) return null;

    const clean = url.startsWith("/") ? url.slice(1) : url;
    return path.join(PUBLIC_DIR, clean);
  },

  async deleteFileByAbsolutePath(absPath) {
    try {
      if (!absPath) return;

      if (await fs.pathExists(absPath)) {
        await fs.remove(absPath);

        // dọn thư mục cha nếu rỗng (tối đa tới PUBLIC_DIR)
        let dir = path.dirname(absPath);
        while (dir.startsWith(PUBLIC_DIR) && dir !== PUBLIC_DIR) {
          const items = await fs.readdir(dir).catch(() => []);
          if (items.length > 0) break;
          await fs.remove(dir);
          dir = path.dirname(dir);
        }
      }
    } catch (err) {
      console.error("[DELETE_FILE_ABS] error:", absPath, err?.message || err);
    }
  },

  async deleteDirByAbsolutePath(absDir) {
    try {
      if (!absDir) return;

      if (await fs.pathExists(absDir)) {
        await fs.remove(absDir);

        let dir = path.dirname(absDir);
        while (dir.startsWith(PUBLIC_DIR) && dir !== PUBLIC_DIR) {
          const items = await fs.readdir(dir).catch(() => []);
          if (items.length > 0) break;
          await fs.remove(dir);
          dir = path.dirname(dir);
        }
      }
    } catch (err) {
      console.error("[DELETE_DIR_ABS] error:", absDir, err?.message || err);
    }
  },

  async cleanupOriginalMedia(phanAnhList = []) {
    for (const pa of phanAnhList) {
      for (const img of pa.images || []) {
        await this.deleteFileByAbsolutePath(img.absPath);
      }
    }

    for (const pa of phanAnhList) {
      for (const video of pa.videos || []) {
        await this.deleteDirByAbsolutePath(video.hlsDir);
      }
    }
  },

  async searchByColumnAEqualsX(x) {
    const wb = getWorkbook();
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return [];

    const ws = wb.Sheets[sheetName];

    // Dữ liệu dạng object theo header hàng 1
    const rows = XLSX.utils.sheet_to_json(ws, {
      defval: null,
      raw: true,
    });

    // Lấy tên header của cột A (ô A1)
    const headerA = ws["A1"]?.v;
    if (!headerA) return [];

    return rows.filter((row) => row?.[headerA] === x);
  },
};

export default FileService;
