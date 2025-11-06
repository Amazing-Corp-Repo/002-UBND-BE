import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";
import LinhVucPhanAnhRepository from "../repositories/linh-vuc-phan-anh.repository.js";
import PhanAnhRepository from "../repositories/phan-anh.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import { capitalizeWords, generateUniqueCode } from "../utils/string.util.js";
import UserRepository from "../repositories/user.repository.js";
import PHAN_ANH_MUC_DO from "../constants/phan-anh-muc-do.constant.js";

const PhanAnhService = {
    async createPhanAnh(idLinhVucPhanAnh, tieuDe, moTa, viTri, mucDo, tenNguoiPhanAnh, soDienThoaiNguoiPhanAnh, userId, file) {
        if (!file || file.length === 0) {
            throw new BaseError(400, "Phải tải lên ít nhất một tệp tin đính kèm");
        }
        const existingLinhVuc = await LinhVucPhanAnhRepository.findById(idLinhVucPhanAnh);

        if (!existingLinhVuc || existingLinhVuc.is_active === false) {
            throw new BaseError(400, "Lĩnh vực phản ánh không tồn tại");
        }

        tieuDe = capitalizeWords(tieuDe);
        tenNguoiPhanAnh = tenNguoiPhanAnh ? capitalizeWords(tenNguoiPhanAnh) : '';

        let data = {
            id_linh_vuc_phan_anh: idLinhVucPhanAnh,
            tieu_de: tieuDe,
            mo_ta: moTa,
            vi_tri: viTri,
            muc_do: mucDo,
            ten_nguoi_phan_anh: tenNguoiPhanAnh,
            sdt_nguoi_phan_anh: soDienThoaiNguoiPhanAnh,
        };

        if (userId != null && userId !== '') {
            const existingPhanAnh = await UserRepository.findById(userId);
            if (!existingPhanAnh) {
                throw new BaseError(400, "Người dùng không tồn tại");
            }
            data.nguoi_tao = userId;
        };

        let maPhanAnh = generateUniqueCode(tieuDe);
        while (await PhanAnhRepository.findByMaPhanAnh(maPhanAnh)) {
            maPhanAnh = generateUniqueCode(tieuDe);
        }

        data.ma_phan_anh = maPhanAnh;

        let createdPhanAnh = await PhanAnhRepository.create(data);

        let trangThai = await PhanAnhRepository.createLichSuTrangThaiPhanAnh({
            id_phan_anh: createdPhanAnh.id,
            ten: PHAN_ANH_STATUS.DA_GUI,
        });

        for (let item of file) {
            await PhanAnhRepository.addFileToPhanAnh({
                id_phan_anh: createdPhanAnh.id,
                dinh_dang_file: item.mimetype,
                url_file: item.relativeUrl,
                kich_thuoc_file_mb: item.sizeMB,
            });
        };

        return {
            id_phan_anh: createdPhanAnh.id,
            ma_phan_anh: createdPhanAnh.ma_phan_anh,
            tieu_de: createdPhanAnh.tieu_de,
            mo_ta: createdPhanAnh.mo_ta,
            vi_tri: createdPhanAnh.vi_tri,
            muc_do: createdPhanAnh.muc_do,
            ten_nguoi_phan_anh: createdPhanAnh.ten_nguoi_phan_anh,
            sdt_nguoi_phan_anh: createdPhanAnh.sdt_nguoi_phan_anh,
            trang_thai: trangThai.ten,
            nguoi_tao: createdPhanAnh.nguoi_tao,
            hinh_anh_dinh_kems: file.map(f => ({
                dinh_dang_file: f.mimetype,
                url_file: f.relativeUrl,
                kich_thuoc_file_mb: f.sizeMB,
            })),
        }
    },

    async getPhanAnhByMaPhanAnh(maPhanAnh) {
        let phanAnh = await PhanAnhRepository.getPhanAnhByMaPhanAnh(maPhanAnh);
        if (!phanAnh) {
            throw new BaseError(400, "Phản ánh không tồn tại");
        }
        return phanAnh;
    },

    async getAll(idLinhVucPhanAnh, trangThai, mucDo, maPhanAnh, page, size) {
        let { data, totalItems } = await PhanAnhRepository.getAll
            (idLinhVucPhanAnh, trangThai, mucDo, maPhanAnh, page, size);
        let pagination = createPagination(page, size, totalItems);
        return { data, pagination };
    },

    async getLichSuTrangThaiPhanAnh(idPhanAnh) {
        return await PhanAnhRepository.getLichSuTrangThaiPhanAnh(idPhanAnh);
    },

    async getPhanAnhByUserId(userId) {
        return await PhanAnhRepository.getPhanAnhByUserId(userId);
    },

    getMucDoPhanAnh() {
        return PHAN_ANH_MUC_DO;
    },

    getTrangThaiPhanAnh() {
        return PHAN_ANH_STATUS;
    },

    async getPhanAnhById(idPhanAnh) {
        let phanAnh = await PhanAnhRepository.getById(idPhanAnh);
        if (!phanAnh) {
            throw new BaseError(400, "Phản ánh không tồn tại");
        }
        console.log(phanAnh);
        return phanAnh;
    }
};

export default PhanAnhService;