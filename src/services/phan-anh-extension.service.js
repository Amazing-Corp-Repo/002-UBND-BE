import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";
import { BaseError } from "../utils/base-error.util.js";
import PhanAnhExtensionRepository from "../repositories/phan-anh-extension.repository.js";

const assertEligibleForExtension = (complaint, currentUser, proposedDeadline) => {
  if (!complaint) throw new BaseError(404, "Phản ánh không tồn tại");
  if (complaint.id_to !== currentUser) {
    throw new BaseError(403, "Chỉ cán bộ đang phụ trách phản ánh mới được đề nghị gia hạn");
  }
  if (complaint.lich_su_trang_thai[0]?.ten !== PHAN_ANH_STATUS.DANG_XU_LY) {
    throw new BaseError(400, "Chỉ phản ánh đang xử lý mới được đề nghị gia hạn");
  }
  if (!complaint.ngay_du_kien_hoan_thanh || new Date(complaint.ngay_du_kien_hoan_thanh) < new Date()) {
    throw new BaseError(400, "Không thể đề nghị gia hạn cho phản ánh đã quá hạn");
  }
  if (new Date(proposedDeadline) <= new Date(complaint.ngay_du_kien_hoan_thanh)) {
    throw new BaseError(400, "Ngày đề xuất hoàn thành phải sau hạn xử lý hiện tại");
  }
};

const PhanAnhExtensionService = {
  async create(idPhanAnh, input, currentUser, files = []) {
    const complaint = await PhanAnhExtensionRepository.findComplaintForExtension(idPhanAnh);
    assertEligibleForExtension(complaint, currentUser, input.ngayDeXuatHoanThanh);
    const existing = await PhanAnhExtensionRepository.findByComplaintId(idPhanAnh);
    if (existing) {
      throw new BaseError(409, "Mỗi phản ánh chỉ được tạo một đề nghị gia hạn");
    }

    return PhanAnhExtensionRepository.create(
      {
        id_phan_anh: idPhanAnh,
        ly_do: input.lyDo,
        ngay_de_xuat_hoan_thanh: input.ngayDeXuatHoanThanh,
        nguoi_tao: currentUser,
        id_video: input.idVideo || [],
      },
      (files || []).map((file) => ({
        dinh_dang_file: file.mimetype,
        url_file: file.relativeUrl,
        kich_thuoc_file_mb: file.sizeMB,
      })),
    );
  },

  async getDetail(idPhanAnh) {
    const extension = await PhanAnhExtensionRepository.findByComplaintId(idPhanAnh);
    if (!extension) throw new BaseError(404, "Đề nghị gia hạn không tồn tại");
    return extension;
  },

  async getAll(query) {
    const { data, total } = await PhanAnhExtensionRepository.list(query);
    return {
      data,
      pagination: {
        page: query.page,
        size: query.size,
        totalItems: total,
        totalPages: Math.ceil(total / query.size),
      },
    };
  },

  async approve(idPhanAnh, currentUser) {
    const complaint = await PhanAnhExtensionRepository.findComplaintForExtension(idPhanAnh);
    if (!complaint) throw new BaseError(404, "Phản ánh không tồn tại");
    if (complaint.lich_su_trang_thai[0]?.ten !== PHAN_ANH_STATUS.DANG_XU_LY) {
      throw new BaseError(400, "Chỉ được duyệt gia hạn khi phản ánh đang xử lý");
    }
    const result = await PhanAnhExtensionRepository.approve(idPhanAnh, currentUser);
    if (!result) throw new BaseError(404, "Đề nghị gia hạn không tồn tại");
    if (result.conflict) throw new BaseError(409, "Đề nghị gia hạn không còn chờ duyệt");
    return result;
  },

  async reject(idPhanAnh, lyDoTuChoi, currentUser) {
    const result = await PhanAnhExtensionRepository.reject(idPhanAnh, lyDoTuChoi, currentUser);
    if (!result) throw new BaseError(409, "Đề nghị gia hạn không tồn tại hoặc không còn chờ duyệt");
    return result;
  },
};

export default PhanAnhExtensionService;
