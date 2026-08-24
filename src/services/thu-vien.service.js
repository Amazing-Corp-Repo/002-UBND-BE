import ThuVienRepository from "../repositories/thu-vien.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import { convertBigInt } from "../utils/number.util.js";
import prisma from "../config/database.config.js";
import ExcelJS from "exceljs";
import FileService from "./file.service.js";

// Ánh xạ cột FE gửi lên → header hiển thị + cách lấy giá trị
const COLUMN_MAP = {
  stt:              { label: "STT", getValue: (item, idx) => idx + 1 },
  tieuDe:           { label: "Tên tài liệu", getValue: (item) => item.tieu_de ?? "" },
  soHieu:           { label: "Số hiệu", getValue: (item) => item.so_hieu ?? "" },
  tenDiTich:        { label: "Di tích / Địa danh", getValue: (item) => item.ten_di_tich ?? "" },
  diaChi:           { label: "Địa chỉ", getValue: (item) => item.dia_chi ?? "" },
  danhMuc:          { label: "Phân nhóm", getValue: (item) => item.thu_vien_danh_muc?.ten ?? "" },
  coQuanBanHanh:    { label: "Cơ quan ban hành", getValue: (item) => item.co_quan_ban_hanh ?? "" },
  phamVi:           { label: "Phạm vi", getValue: (item) => {
    const map = { CONG_KHAI: "Công khai", NOI_BO: "Nội bộ", HAN_CHE: "Hạn chế" };
    return map[item.pham_vi] || item.pham_vi || "";
  }},
  trangThai:        { label: "Trạng thái", getValue: (item) => {
    const map = { NHAP: "Nháp", CHO_DUYET: "Chờ duyệt", DA_DUYET: "Đã duyệt", TU_CHOI: "Từ chối", LUU_TRU: "Lưu trữ" };
    return map[item.trang_thai] || item.trang_thai || "";
  }},
  ngayBanHanh:      { label: "Ngày ban hành", getValue: (item) => item.ngay_ban_hanh ? new Date(item.ngay_ban_hanh).toISOString().split("T")[0] : "" },
  ngayHieuLuc:      { label: "Ngày hiệu lực", getValue: (item) => item.ngay_hieu_luc ? new Date(item.ngay_hieu_luc).toISOString().split("T")[0] : "" },
  ngayHetHan:       { label: "Ngày hết hạn", getValue: (item) => item.ngay_het_han ? new Date(item.ngay_het_han).toISOString().split("T")[0] : "" },
  trangThaiHieuLuc: { label: "Trạng thái hiệu lực", getValue: (item) => item.trang_thai_hieu_luc ?? "" },
  aiDaHoc:          { label: "Trợ lý AI", getValue: (item) => item.ai_da_hoc ? "Đã học" : "Chưa học" },
  luotXem:          { label: "Lượt xem", getValue: (item) => item.luot_xem ?? 0 },
  luotTai:          { label: "Lượt tải", getValue: (item) => item.so_luot_tai ?? 0 },
  nguoiTao:         { label: "Người tạo", getValue: (item) => item.ten_nguoi_tao ?? "" },
  nguoiDuyet:       { label: "Người duyệt", getValue: (item) => item.ten_nguoi_duyet ?? "" },
  thoiGianTao:      { label: "Ngày tạo", getValue: (item) => item.thoi_gian_tao ? new Date(item.thoi_gian_tao).toISOString().split("T")[0] : "" },
};

const ThuVienService = {
  async getAll({ loai, page = 1, size = 10, search, idDanhMuc, trangThai, phamVi, aiDaHoc, dateFrom, dateTo, sortBy, sortOrder, coQuanBanHanh, currentUser, permissions = [] }) {
    const { data, totalItems } = await ThuVienRepository.getAll({
      loai,
      page: parseInt(page),
      size: parseInt(size),
      search,
      idDanhMuc,
      trangThai,
      phamVi,
      aiDaHoc,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      coQuanBanHanh,
      currentUser,
      permissions,
    });

    const pagination = createPagination(parseInt(page), parseInt(size), totalItems);
    return { data, pagination };
  },

  async exportExcel({ loai, search, idDanhMuc, trangThai, phamVi, aiDaHoc, dateFrom, dateTo, sortBy, sortOrder, coQuanBanHanh, currentUser, permissions = [], columns }) {
    // Lấy tất cả dữ liệu (không phân trang) — dùng lại getAll không parse page
    const { data } = await this.getAll({
      loai, page: 1, size: 999999, search, idDanhMuc, trangThai, phamVi, aiDaHoc,
      dateFrom, dateTo, sortBy, sortOrder, coQuanBanHanh, currentUser, permissions,
    });

    // Convert BigInt → Number tránh lỗi JSON serialization
    const cleanData = convertBigInt(data);

    // Parse danh sách cột FE gửi lên: JSON array hoặc CSV
    let selectedColumns = [];
    if (columns) {
      try {
        selectedColumns = JSON.parse(columns);
      } catch {
        selectedColumns = columns.split(",").map((c) => c.trim()).filter(Boolean);
      }
    }
    // Nếu không gửi columns → xuất tất cả cột
    if (selectedColumns.length === 0) {
      selectedColumns = Object.keys(COLUMN_MAP);
    }

    // Lọc cột hợp lệ, giữ thứ tự FE gửi
    const colDefs = selectedColumns.map((key) => COLUMN_MAP[key]).filter(Boolean);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(loai === "VAN_HOA" ? "Tài liệu văn hóa" : "Tài liệu pháp luật");

    // Header row
    const headerRow = sheet.addRow(colDefs.map((c) => c.label));
    FileService.excelStyles.tableHeader(headerRow);

    // Data rows
    cleanData.forEach((item, idx) => {
      const rowValues = colDefs.map((col) => col.getValue(item, idx));
      const row = sheet.addRow(rowValues);
      FileService.excelStyles.tableRow(row);
    });

    // Auto-fit columns
    sheet.columns.forEach((col, i) => {
      let maxLen = colDefs[i]?.label.length || 10;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(maxLen + 4, 60);
    });

    return await workbook.xlsx.writeBuffer();
  },

  async getPublic({ loai, page = 1, size = 10, search, idDanhMuc, sortBy, sortOrder }) {
    const { data, totalItems } = await ThuVienRepository.getPublic({
      page: parseInt(page),
      size: parseInt(size),
      search,
      idDanhMuc,
      loai,
      sortBy,
      sortOrder,
    });

    const pagination = createPagination(parseInt(page), parseInt(size), totalItems);
    return { data, pagination };
  },

  async getPublicById(id) {
    const result = await ThuVienRepository.getPublicById(id);
    if (!result) {
      throw new BaseError(404, "Không tìm thấy tài liệu");
    }
    return result;
  },

  async getById(id, currentUser) {
    const result = await ThuVienRepository.getById(id);
    if (!result) {
      throw new BaseError(404, "Không tìm thấy tài liệu");
    }
    // NHAP chỉ hiển thị với người tạo
    if (result.trang_thai === "NHAP" && result.nguoi_tao !== currentUser) {
      throw new BaseError(404, "Không tìm thấy tài liệu");
    }
    return result;
  },

  async create({ loai, data, files, currentUser }) {
    const createData = {
      loai,
      tieu_de: data.tieuDe,
      id_danh_muc: data.idDanhMuc || null,
      mo_ta: data.moTa || null,
      pham_vi: data.phamVi || "CONG_KHAI",
      trang_thai: data.trangThai || "CHO_DUYET",
      nguoi_tao: currentUser,
      ngay_ban_hanh: data.ngayBanHanh ? new Date(data.ngayBanHanh) : null,
    };

    // Văn hóa fields
    if (loai === "VAN_HOA") {
      createData.ten_di_tich = data.tenDiTich || null;
      createData.dia_chi = data.diaChi || null;
      createData.noi_dung = data.noiDung || null;
    }

    // Pháp luật fields
    if (loai === "PHAP_LUAT") {
      createData.so_hieu = data.soHieu || null;
      createData.co_quan_ban_hanh = data.coQuanBanHanh || null;
      createData.ngay_hieu_luc = data.ngayHieuLuc ? new Date(data.ngayHieuLuc) : null;
      createData.ngay_het_han = data.ngayHetHan ? new Date(data.ngayHetHan) : null;
    }

    // Xử lý file tài liệu chính (nếu có)
    if (files && files.file && files.file.length > 0) {
      createData.thu_vien_tai_lieu_file = {
        create: {
          ten_file: files.file[0].originalname,
          duong_dan: files.file[0].relativeUrl,
          dinh_dang: files.file[0].mimetype,
          kich_thuoc_mb: files.file[0].sizeMB,
          la_phien_ban_hien_tai: true,
          phien_ban: 1,
          nguoi_tao: currentUser,
        },
      };
    }

    const result = await ThuVienRepository.create(createData);

    // Xử lý tags (nếu có)
    if (data.tags) {
      await this.processTags(result.id, data.tags, currentUser);
    }

    // Xử lý media ảnh/video (nếu có) — chỉ cho văn hóa
    if (loai === "VAN_HOA") {
      await this.processMedia(result.id, files, currentUser);
    }

    return ThuVienRepository.getById(result.id);
  },

  async update({ id, data, files, currentUser }) {
    const existing = await ThuVienRepository.findById(id);
    if (!existing) {
      throw new BaseError(404, "Không tìm thấy tài liệu");
    }

    const updateData = {
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    };

    if (data.tieuDe !== undefined) updateData.tieu_de = data.tieuDe;
    if (data.idDanhMuc !== undefined) updateData.id_danh_muc = data.idDanhMuc || null;
    if (data.moTa !== undefined) updateData.mo_ta = data.moTa || null;
    if (data.phamVi !== undefined) updateData.pham_vi = data.phamVi;
    if (data.ngayBanHanh !== undefined) updateData.ngay_ban_hanh = data.ngayBanHanh ? new Date(data.ngayBanHanh) : null;

    if (existing.loai === "VAN_HOA") {
      if (data.tenDiTich !== undefined) updateData.ten_di_tich = data.tenDiTich || null;
      if (data.diaChi !== undefined) updateData.dia_chi = data.diaChi || null;
      if (data.noiDung !== undefined) updateData.noi_dung = data.noiDung || null;
    }

    if (existing.loai === "PHAP_LUAT") {
      if (data.soHieu !== undefined) updateData.so_hieu = data.soHieu || null;
      if (data.coQuanBanHanh !== undefined) updateData.co_quan_ban_hanh = data.coQuanBanHanh || null;
      if (data.ngayHieuLuc !== undefined) updateData.ngay_hieu_luc = data.ngayHieuLuc ? new Date(data.ngayHieuLuc) : null;
      if (data.ngayHetHan !== undefined) updateData.ngay_het_han = data.ngayHetHan ? new Date(data.ngayHetHan) : null;
    }

    await ThuVienRepository.update(id, updateData);

    // Xử lý tags (nếu có)
    if (data.tags !== undefined) {
      await ThuVienRepository.deleteTagLinks(id);
      if (data.tags) {
        await this.processTags(id, data.tags, currentUser);
      }
    }

    // Xử lý media ảnh/video (nếu có)
    if (existing.loai === "VAN_HOA" && files) {
      await this.processMedia(id, files, currentUser);
    }

    // Xử lý file mới (nếu có)
    if (files && files.file && files.file.length > 0) {
      // Đánh dấu tất cả file cũ không còn hiện tại
      await prisma.thu_vien_tai_lieu_file.updateMany({
        where: { id_tai_lieu: id, la_phien_ban_hien_tai: true, is_delete: false },
        data: { la_phien_ban_hien_tai: false },
      });

      // Tạo file mới
      await ThuVienRepository.update(id, {
        thu_vien_tai_lieu_file: {
          create: {
            ten_file: files.file[0].originalname,
            duong_dan: files.file[0].relativeUrl,
            dinh_dang: files.file[0].mimetype,
            kich_thuoc_mb: files.file[0].sizeMB,
            la_phien_ban_hien_tai: true,
            phien_ban: (existing.phien_ban || 0) + 1,
            nguoi_tao: currentUser,
          },
        },
      });
    }

    return ThuVienRepository.getById(id);
  },

  async delete(id, currentUser) {
    const existing = await ThuVienRepository.findById(id);
    if (!existing) {
      throw new BaseError(404, "Không tìm thấy tài liệu");
    }
    if (existing.trang_thai === "DA_DUYET") {
      throw new BaseError(400, "Không thể xóa tài liệu đã được duyệt");
    }

    await ThuVienRepository.softDelete(id, currentUser);
  },

  async updateStatus(id, trangThai, currentUser) {
    const existing = await ThuVienRepository.findById(id);
    if (!existing) {
      throw new BaseError(404, "Không tìm thấy tài liệu");
    }

    const updateData = {
      trang_thai: trangThai,
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    };

    // Nếu duyệt → ghi nhận người duyệt
    if (trangThai === "DA_DUYET") {
      updateData.nguoi_duyet = currentUser;
      updateData.thoi_gian_duyet = new Date().toISOString();
    }

    await ThuVienRepository.update(id, updateData);
    return ThuVienRepository.getById(id);
  },

  async aiLearn(id, action, currentUser) {
    const existing = await ThuVienRepository.findById(id);
    if (!existing) {
      throw new BaseError(404, "Không tìm thấy tài liệu");
    }

    const isLearn = action === "learn";
    const updateData = {
      ai_da_hoc: isLearn,
      thoi_gian_ai_hoc: isLearn ? new Date().toISOString() : null,
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    };

    await ThuVienRepository.update(id, updateData);
    return ThuVienRepository.getById(id);
  },

  async approve(id, currentUser) {
    const existing = await ThuVienRepository.findById(id);
    if (!existing) {
      throw new BaseError(404, "Không tìm thấy tài liệu");
    }
    if (existing.trang_thai !== "CHO_DUYET") {
      throw new BaseError(400, "Chỉ có thể phê duyệt tài liệu đang chờ duyệt");
    }

    const updateData = {
      trang_thai: "DA_DUYET",
      nguoi_duyet: currentUser,
      thoi_gian_duyet: new Date().toISOString(),
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    };

    await ThuVienRepository.update(id, updateData);
    return ThuVienRepository.getById(id);
  },

  async reject(id, lyDoTuChoi, currentUser) {
    const existing = await ThuVienRepository.findById(id);
    if (!existing) {
      throw new BaseError(404, "Không tìm thấy tài liệu");
    }
    if (existing.trang_thai !== "CHO_DUYET") {
      throw new BaseError(400, "Chỉ có thể từ chối tài liệu đang chờ duyệt");
    }

    const updateData = {
      trang_thai: "TU_CHOI",
      ly_do_tu_choi: lyDoTuChoi || null,
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    };

    await ThuVienRepository.update(id, updateData);
    return ThuVienRepository.getById(id);
  },

  async unapprove(id, currentUser) {
    const existing = await ThuVienRepository.findById(id);
    if (!existing) {
      throw new BaseError(404, "Không tìm thấy tài liệu");
    }
    if (existing.trang_thai !== "DA_DUYET") {
      throw new BaseError(400, "Chỉ có thể hoàn tác phê duyệt tài liệu đã được duyệt");
    }

    const updateData = {
      trang_thai: "CHO_DUYET",
      nguoi_duyet: null,
      thoi_gian_duyet: null,
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    };

    await ThuVienRepository.update(id, updateData);
    return ThuVienRepository.getById(id);
  },

  async getStatistics(loai, currentUser, permissions) {
    return ThuVienRepository.getStatistics(loai, currentUser, permissions);
  },

  async getSubCategories(loai) {
    return ThuVienRepository.getSubCategories(loai);
  },

  async getDocTypes() {
    return ThuVienRepository.getDocTypes();
  },

  async getIssuingAgencies() {
    return ThuVienRepository.getIssuingAgencies();
  },

  async incrementViewCount(id) {
    const existing = await ThuVienRepository.findById(id);
    if (!existing) {
      throw new BaseError(404, "Không tìm thấy tài liệu");
    }
    await ThuVienRepository.incrementViewCount(id);
  },

  async incrementDownloadCount(id) {
    const existing = await ThuVienRepository.findById(id);
    if (!existing) {
      throw new BaseError(404, "Không tìm thấy tài liệu");
    }
    await ThuVienRepository.incrementDownloadCount(id);
  },

  async deleteMedia(id, mediaId, currentUser) {
    const existing = await ThuVienRepository.findById(id);
    if (!existing) {
      throw new BaseError(404, "Không tìm thấy tài liệu");
    }

    const media = await ThuVienRepository.findMediaById(id, mediaId);
    if (!media) {
      throw new BaseError(404, "Không tìm thấy media");
    }

    await ThuVienRepository.deleteMedia(id, mediaId);
  },

  async processTags(idTaiLieu, tagsStr, currentUser) {
    if (!tagsStr || tagsStr.trim() === "") return;

    let tags = [];
    try {
      tags = JSON.parse(tagsStr);
    } catch {
      tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
    }

    if (!Array.isArray(tags)) tags = [tags];

    for (const tagName of tags) {
      if (!tagName || tagName.trim() === "") continue;
      const trimmed = tagName.trim().toLowerCase();

      let tag = await ThuVienRepository.findTagByName(trimmed);
      if (!tag) {
        tag = await ThuVienRepository.createTag(trimmed);
      }

      await ThuVienRepository.createTagLink(idTaiLieu, tag.id);
    }
  },

  async processMedia(idTaiLieu, files, currentUser) {
    if (!files) return;

    // Xử lý ảnh
    if (files.images && files.images.length > 0) {
      for (const img of files.images) {
        await ThuVienRepository.createMedia({
          id_tai_lieu: idTaiLieu,
          loai: "IMAGE",
          ten_file_goc: img.originalname,
          url: img.relativeUrl,
          kich_thuoc: img.size,
          mime_type: img.mimetype,
          nguoi_tao: currentUser,
        });
      }
    }

    // Xử lý video
    if (files.videos && files.videos.length > 0) {
      for (const vid of files.videos) {
        await ThuVienRepository.createMedia({
          id_tai_lieu: idTaiLieu,
          loai: "VIDEO",
          ten_file_goc: vid.originalname,
          url: vid.relativeUrl,
          kich_thuoc: vid.size,
          mime_type: vid.mimetype,
          nguoi_tao: currentUser,
        });
      }
    }
  },
};

export default ThuVienService;