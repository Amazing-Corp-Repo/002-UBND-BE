import ThuVienRepository from "../repositories/thu-vien.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";

const ThuVienService = {
  async getAll({ loai, page = 1, size = 10, search, idDanhMuc, trangThai, phamVi, aiDaHoc, dateFrom, dateTo, sortBy, sortOrder, coQuanBanHanh }) {
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
    });

    const pagination = createPagination(parseInt(page), parseInt(size), totalItems);
    return { data, pagination };
  },

  async getById(id) {
    const result = await ThuVienRepository.getById(id);
    if (!result) {
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
      trang_thai: "CHO_DUYET",
      nguoi_tao: currentUser,
      ngay_ban_hanh: data.ngayBanHanh ? new Date(data.ngayBanHanh) : null,
    };

    // Văn hóa fields
    if (loai === "VAN_HOA") {
      createData.ten_di_tich = data.tenDiTich || null;
      createData.dia_chi = data.diaChi || null;
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
      // Đánh dấu file cũ không còn hiện tại
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
      trang_thai: "NHAP",
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    };

    await ThuVienRepository.update(id, updateData);
    return ThuVienRepository.getById(id);
  },

  async getStatistics(loai) {
    return ThuVienRepository.getStatistics(loai);
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