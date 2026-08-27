import Joi from "joi";

const PUBLIC_LIBRARY_SORT_FIELDS = [
  "thoi_gian_tao",
  "tieu_de",
  "ngay_ban_hanh",
  "luot_xem",
  "so_luot_tai",
];

export const GetPublicLibraryQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Trang phải là số nguyên",
    "number.min": "Trang phải lớn hơn hoặc bằng 1",
  }),
  size: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": "Kích thước trang phải là số nguyên",
    "number.min": "Kích thước trang phải lớn hơn hoặc bằng 1",
    "number.max": "Kích thước trang không được vượt quá 100",
  }),
  search: Joi.string().trim().max(100).allow("").optional().messages({
    "string.max": "Từ khóa tìm kiếm không được vượt quá 100 ký tự",
  }),
  idDanhMuc: Joi.string().trim().uuid().optional().messages({
    "string.uuid": "ID danh mục không hợp lệ",
  }),
  loai: Joi.string().valid("VAN_HOA", "PHAP_LUAT").optional().messages({
    "any.only": "Loại tài liệu phải là VAN_HOA hoặc PHAP_LUAT",
  }),
  sortBy: Joi.string().valid(...PUBLIC_LIBRARY_SORT_FIELDS).optional().messages({
    "any.only": "Trường sắp xếp không hợp lệ",
  }),
  sortOrder: Joi.string().valid("asc", "desc").default("desc").messages({
    "any.only": "Thứ tự sắp xếp phải là asc hoặc desc",
  }),
});

export const PublicLibraryDocumentParams = Joi.object({
  id: Joi.string().trim().uuid().required().messages({
    "string.uuid": "ID tài liệu không hợp lệ",
    "any.required": "ID tài liệu là bắt buộc",
  }),
});

// Tạo mới tài liệu Văn hóa
export const CreateVanHoaRequest = Joi.object({
  tieuDe: Joi.string().trim().max(255).required().messages({
    "string.max": "Tiêu đề không được vượt quá 255 ký tự",
    "any.required": "Tiêu đề là bắt buộc",
  }),
  tenDiTich: Joi.string().trim().max(255).optional().allow(null, "").messages({
    "string.max": "Tên di tích không được vượt quá 255 ký tự",
  }),
  diaChi: Joi.string().trim().max(500).optional().allow(null, "").messages({
    "string.max": "Địa chỉ không được vượt quá 500 ký tự",
  }),
  idDanhMuc: Joi.string().trim().uuid().optional().allow(null, "").messages({
    "string.uuid": "ID danh mục không hợp lệ",
  }),
  ngayBanHanh: Joi.date().optional().allow(null, "").messages({
    "date.base": "Ngày ban hành không hợp lệ",
  }),
  phamVi: Joi.string()
    .valid("CONG_KHAI", "NOI_BO", "HAN_CHE")
    .optional()
    .messages({
      "any.only": "Phạm vi phải là CONG_KHAI, NOI_BO hoặc HAN_CHE",
    }),
  moTa: Joi.string().trim().optional().allow(null, "").messages({
    "string.base": "Mô tả phải là chuỗi ký tự",
  }),
  tags: Joi.string().trim().optional().allow(null, ""),
  noiDung: Joi.string().trim().optional().allow(null, "").messages({
    "string.base": "Nội dung phải là chuỗi ký tự",
  }),
  trangThai: Joi.string()
    .valid("NHAP", "CHO_DUYET")
    .optional()
    .messages({
      "any.only": "Trạng thái phải là NHAP (nháp) hoặc CHO_DUYET (chờ duyệt)",
    }),
});

export const UpdateVanHoaRequest = Joi.object({
  tieuDe: Joi.string().trim().max(255).optional().allow(null, "").messages({
    "string.max": "Tiêu đề không được vượt quá 255 ký tự",
  }),
  tenDiTich: Joi.string().trim().max(255).optional().allow(null, "").messages({
    "string.max": "Tên di tích không được vượt quá 255 ký tự",
  }),
  diaChi: Joi.string().trim().max(500).optional().allow(null, "").messages({
    "string.max": "Địa chỉ không được vượt quá 500 ký tự",
  }),
  idDanhMuc: Joi.string().trim().uuid().optional().allow(null, "").messages({
    "string.uuid": "ID danh mục không hợp lệ",
  }),
  ngayBanHanh: Joi.date().optional().allow(null, "").messages({
    "date.base": "Ngày ban hành không hợp lệ",
  }),
  phamVi: Joi.string()
    .valid("CONG_KHAI", "NOI_BO", "HAN_CHE")
    .optional()
    .messages({
      "any.only": "Phạm vi phải là CONG_KHAI, NOI_BO hoặc HAN_CHE",
    }),
  moTa: Joi.string().trim().optional().allow(null, "").messages({
    "string.base": "Mô tả phải là chuỗi ký tự",
  }),
  tags: Joi.string().trim().optional().allow(null, ""),
  noiDung: Joi.string().trim().optional().allow(null, "").messages({
    "string.base": "Nội dung phải là chuỗi ký tự",
  }),
});

export const CreatePhapLuatRequest = Joi.object({
  soHieu: Joi.string().trim().max(100).required().messages({
    "string.max": "Số hiệu không được vượt quá 100 ký tự",
    "any.required": "Số hiệu văn bản là bắt buộc",
  }),
  tieuDe: Joi.string().trim().max(255).required().messages({
    "string.max": "Tiêu đề không được vượt quá 255 ký tự",
    "any.required": "Tiêu đề là bắt buộc",
  }),
  idDanhMuc: Joi.string().trim().uuid().required().messages({
    "string.uuid": "ID danh mục không hợp lệ",
    "any.required": "Loại văn bản là bắt buộc",
  }),
  coQuanBanHanh: Joi.string().trim().max(255).required().messages({
    "string.max": "Cơ quan ban hành không được vượt quá 255 ký tự",
    "any.required": "Cơ quan ban hành là bắt buộc",
  }),
  ngayBanHanh: Joi.date().required().messages({
    "date.base": "Ngày ban hành không hợp lệ",
    "any.required": "Ngày ban hành là bắt buộc",
  }),
  ngayHieuLuc: Joi.date().optional().allow(null, "").messages({
    "date.base": "Ngày hiệu lực không hợp lệ",
  }),
  ngayHetHan: Joi.date().optional().allow(null, "").messages({
    "date.base": "Ngày hết hạn không hợp lệ",
  }),
  phamVi: Joi.string()
    .valid("CONG_KHAI", "NOI_BO", "HAN_CHE")
    .optional()
    .messages({
      "any.only": "Phạm vi phải là CONG_KHAI, NOI_BO hoặc HAN_CHE",
    }),
  moTa: Joi.string().trim().optional().allow(null, "").messages({
    "string.base": "Mô tả phải là chuỗi ký tự",
  }),
  tags: Joi.string().trim().optional().allow(null, ""),
  trangThai: Joi.string()
    .valid("NHAP", "CHO_DUYET")
    .optional()
    .messages({
      "any.only": "Trạng thái phải là NHAP (nháp) hoặc CHO_DUYET (chờ duyệt)",
    }),
});

export const UpdatePhapLuatRequest = Joi.object({
  soHieu: Joi.string().trim().max(100).optional().allow(null, "").messages({
    "string.max": "Số hiệu không được vượt quá 100 ký tự",
  }),
  tieuDe: Joi.string().trim().max(255).optional().allow(null, "").messages({
    "string.max": "Tiêu đề không được vượt quá 255 ký tự",
  }),
  idDanhMuc: Joi.string().trim().uuid().optional().allow(null, "").messages({
    "string.uuid": "ID danh mục không hợp lệ",
  }),
  coQuanBanHanh: Joi.string()
    .trim()
    .max(255)
    .optional()
    .allow(null, "")
    .messages({
      "string.max": "Cơ quan ban hành không được vượt quá 255 ký tự",
    }),
  ngayBanHanh: Joi.date().optional().allow(null, "").messages({
    "date.base": "Ngày ban hành không hợp lệ",
  }),
  ngayHieuLuc: Joi.date().optional().allow(null, "").messages({
    "date.base": "Ngày hiệu lực không hợp lệ",
  }),
  ngayHetHan: Joi.date().optional().allow(null, "").messages({
    "date.base": "Ngày hết hạn không hợp lệ",
  }),
  phamVi: Joi.string()
    .valid("CONG_KHAI", "NOI_BO", "HAN_CHE")
    .optional()
    .messages({
      "any.only": "Phạm vi phải là CONG_KHAI, NOI_BO hoặc HAN_CHE",
    }),
  moTa: Joi.string().trim().optional().allow(null, "").messages({
    "string.base": "Mô tả phải là chuỗi ký tự",
  }),
  tags: Joi.string().trim().optional().allow(null, ""),
});

export const UpdateStatusTaiLieuRequest = Joi.object({
  trangThai: Joi.string()
    .valid("NHAP", "CHO_DUYET", "DA_DUYET", "TU_CHOI", "LUU_TRU")
    .required()
    .messages({
      "any.only": "Trạng thái phải là NHAP, CHO_DUYET, DA_DUYET, TU_CHOI hoặc LUU_TRU",
      "any.required": "Trạng thái là bắt buộc",
    }),
});

export const AiLearnRequest = Joi.object({
  action: Joi.string()
    .valid("learn", "unlearn")
    .required()
    .messages({
      "any.only": "Hành động phải là learn hoặc unlearn",
      "any.required": "Hành động là bắt buộc",
    }),
});

export const ApproveTaiLieuRequest = Joi.object({
  // Không yêu cầu body, chỉ cần id trên URL
});

export const RejectTaiLieuRequest = Joi.object({
  lyDoTuChoi: Joi.string().trim().max(500).optional().allow(null, "").messages({
    "string.max": "Lý do từ chối không được vượt quá 500 ký tự",
  }),
});
