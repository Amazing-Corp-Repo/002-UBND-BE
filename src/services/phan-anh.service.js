import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";
import LinhVucPhanAnhRepository from "../repositories/linh-vuc-phan-anh.repository.js";
import PhanAnhRepository from "../repositories/phan-anh.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import { capitalizeWords, generateUniqueCode } from "../utils/string.util.js";
import UserRepository from "../repositories/user.repository.js";
import PHAN_ANH_MUC_DO from "../constants/phan-anh-muc-do.constant.js";
import { getIO } from "../realtime/socket/index.js";


const ORDER = [
    PHAN_ANH_STATUS.DA_GUI,
    PHAN_ANH_STATUS.DA_TIEP_NHAN,
    PHAN_ANH_STATUS.DANG_XU_LY,
    PHAN_ANH_STATUS.DA_GIAI_QUYET,
];

const PhanAnhService = {
    async createPhanAnh(idLinhVucPhanAnh, tieuDe, moTa, viTri, mucDo, tenNguoiPhanAnh, soDienThoaiNguoiPhanAnh, userId, file, idVideo) {
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
            id_video: idVideo,
        };

        if (userId != null && userId !== '') {
            const existingPhanAnh = await UserRepository.findById(userId);
            if (!existingPhanAnh) {
                throw new BaseError(400, "Người dùng không tồn tại");
            }
            data.nguoi_tao = userId;
        };

        let maPhanAnh = generateUniqueCode();

        data.ma_phan_anh = maPhanAnh;

        let createdPhanAnh = await PhanAnhRepository.create(data);

        let trangThai = await PhanAnhRepository.createLichSuTrangThaiPhanAnh({
            id_phan_anh: createdPhanAnh.id,
            ten: PHAN_ANH_STATUS.DA_GUI,
        });

        const attachments = file.map(f => ({
            id_phan_anh: createdPhanAnh.id,
            dinh_dang_file: f.mimetype,
            url_file: f.relativeUrl,
            kich_thuoc_file_mb: f.sizeMB,
        }));

        await PhanAnhRepository.addFileToPhanAnh(attachments);

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
        return phanAnh;
    },

    async updateStatusPhanAnh(idPhanAnh, thoiGianPhanHoiDuKien, ngayDuKienHoanThanh, trangThai, ghiChu, currentUser) {
        let phanAnh = await PhanAnhRepository.getById(idPhanAnh);
        if (!phanAnh) {
            throw new BaseError(400, "Phản ánh không tồn tại");
        }
        const lastStatus = phanAnh.lich_su_trang_thai[0].ten;
        if (lastStatus === PHAN_ANH_STATUS.DA_GIAI_QUYET || lastStatus === PHAN_ANH_STATUS.DONG) {
            throw new BaseError(400, "Không thể cập nhật trạng thái cho phản ánh đã được giải quyết hoặc đóng");
        }
        if (trangThai !== PHAN_ANH_STATUS.DONG) {
            const currentIndex = ORDER.indexOf(lastStatus);
            const nextIndex = ORDER.indexOf(trangThai);

            if (nextIndex === -1 || currentIndex === -1) {
                throw new BaseError(400, "Trạng thái không hợp lệ");
            }

            if (nextIndex !== currentIndex + 1) {
                throw new BaseError(400, `Trạng thái tiếp theo phải là: ${ORDER[currentIndex + 1]}`);
            }
        }

        let existingUser = await UserRepository.findById(currentUser);
        if (!existingUser) {
            throw new BaseError(400, "Người dùng không tồn tại");
        }

        const phanAnhPatch = {
            nguoi_cap_nhat: currentUser,
            thoi_gian_tiep_nhan: trangThai === PHAN_ANH_STATUS.DA_TIEP_NHAN ? new Date().toISOString() : phanAnh.thoi_gian_tiep_nhan,
            thoi_gian_phan_hoi_du_kien: thoiGianPhanHoiDuKien,
            ngay_du_kien_hoan_thanh: ngayDuKienHoanThanh,
        };

        const historyData = {
            ten: trangThai,
            ghi_chu: ghiChu,
            nguoi_tao: currentUser,
        };

        await PhanAnhRepository.updateStatusWithHistory(idPhanAnh, phanAnhPatch, historyData);
        if (phanAnh.nguoi_tao) {
            handleSendNotification(phanAnh, trangThai, ghiChu);
        }
    },
};

const handleSendNotification = (phanAnh, trangThai, ghiChu) => {
    // Gửi thông báo qua socket.io
    console.log(`Gửi thông báo trạng thái phản ánh [${phanAnh.ma_phan_anh}] mới: ${trangThai} đến người dùng ID: ${phanAnh.nguoi_tao}`);

    const io = getIO();

    const targetRoom = `user_${phanAnh.nguoi_tao}`;

    const payload = {
        ma_phan_anh: phanAnh.ma_phan_anh,
        trang_thai: trangThai,
        tieu_de: 'Phản ánh của bạn đã được cập nhật',
        ghi_chu: ghiChu,
    };

    io.to(targetRoom).emit("phan-anh.update-status", payload);

    console.log(`📨 Đã gửi thông báo đến room: ${targetRoom}`);
}

export default PhanAnhService;