import { BaseError } from "../utils/base-error.util.js";
import ThuTucRepository from "../repositories/thu-tuc.repository.js";
import { createPagination } from "../utils/response.util.js";
import CoSoDichVuCongRepository from "../repositories/co-so-dich-vu-cong.repository.js";
import LinhVucRepository from "../repositories/linh-vuc.repository.js";
import MauDonRepository from "../repositories/mau-don.repository.js";
import { appendDeleteSuffixc, capitalizeWords } from "../utils/string.util.js";

const ThuTucService = {
  async getThuTucById(procedureId) {
    const procedure = await ThuTucRepository.findByIdFull(procedureId);

    if (!procedure) {
      throw new BaseError(400, "Thủ tục hành chính không tìm thấy");
    }

    return procedure;
  },

  async getAll(page, size, isActive, idLinhVuc, search) {
    const { thuTucs, total } = await ThuTucRepository.getAll(
      page,
      size,
      isActive,
      idLinhVuc,
      search = search ? capitalizeWords(search) : "",
    );

    const data = thuTucs.map(item => ({
      id: item.id,
      ma_thu_tuc: item.ma_thu_tuc,
      ten_thu_tuc: item.ten_thu_tuc,
      doi_tuong_thuc_hien: item.doi_tuong_thuc_hien,
      so_quyet_dinh: item.so_quyet_dinh,
      co_so_dich_vu_cong: item.co_so_dich_vu_cong?.ten_co_so || null,
      so_dien_thoai_co_so: item.co_so_dich_vu_cong?.so_dien_thoai || null,
      linh_vuc: item.thu_tuc_hanh_chinh_linh_vuc.map(lv => lv.linh_vuc.ten_linh_vuc),
      is_active: item.is_active,
      thoi_gian_tao: item.thoi_gian_tao,
    }));

    const pagination = createPagination(page, size, total);

    return { data, pagination };
  },

  async getMauDonByThuTucId(thuTucId) {
    // Kiểm tra thủ tục có tồn tại không
    const exists = await ThuTucRepository.exists(thuTucId);
    if (!exists) {
      throw new BaseError(404, "Không tìm thấy thủ tục hành chính");
    }

    // Lấy danh sách mẫu đơn
    const mauDonList = await ThuTucRepository.getMauDonByThuTucId(thuTucId);

    return mauDonList;
  },

  async createThuTuc(idCoSoDichVuCong, tenThuTuc, maThuTuc, doiTuongThucHien, yeuCauDieuKienChung, soQuyetDinh, danhSachLinhVucIds = [], danhSachMauDon = [], cachThuThucHien = [], trinhTuThucHien = [], truongHopThuTuc = [], currentUser) {
    tenThuTuc = capitalizeWords(tenThuTuc);
    maThuTuc = maThuTuc?.toUpperCase();
    const existingCoso = await CoSoDichVuCongRepository.findById(idCoSoDichVuCong);
    const existingThuTuc = await ThuTucRepository.findByMaAndTenThuTuc(maThuTuc, tenThuTuc);
    const existingLinhVucs = await LinhVucRepository.findManyByIds(danhSachLinhVucIds, true);
    const existingDanhSachMauDons = await MauDonRepository.findManyByIds(danhSachMauDon, true);

    if (existingThuTuc) {
      throw new BaseError(409, "Thủ tục hành chính với mã hoặc tên đã tồn tại");
    }

    if (!existingCoso) {
      throw new BaseError(404, "Cơ sở dịch vụ công không tồn tại");
    }

    if (existingLinhVucs.length !== danhSachLinhVucIds.length) {
      throw new BaseError(404, "Một hoặc nhiều lĩnh vực không tồn tại");
    }

    if (existingDanhSachMauDons.length !== danhSachMauDon.length) {
      throw new BaseError(404, "Một hoặc nhiều mẫu đơn không tồn tại");
    }

    // Normalize nested names
    const normalizedTruongHop = (truongHopThuTuc || []).map(th => ({
      ...th,
      tenTruongHop: th.tenTruongHop ? capitalizeWords(th.tenTruongHop) : th.tenTruongHop,
      thanhPhanHoSo: (th.thanhPhanHoSo || []).map(tp => ({
        ...tp,
        tenThanhPhan: tp.tenThanhPhan ? capitalizeWords(tp.tenThanhPhan) : tp.tenThanhPhan,
      })),
    }));

    const newThuTuc = await ThuTucRepository.createThuTuc(idCoSoDichVuCong, tenThuTuc, maThuTuc, doiTuongThucHien, yeuCauDieuKienChung, soQuyetDinh, danhSachLinhVucIds, danhSachMauDon, cachThuThucHien, trinhTuThucHien, normalizedTruongHop, currentUser);
    return newThuTuc;
  },

  async deleteThuTuc(thuTucId, currentUser) {
    const exists = await ThuTucRepository.getThuTucById(thuTucId);
    if (!exists) {
      throw new BaseError(404, "Không tìm thấy thủ tục hành chính để xóa");
    }
    if (exists.is_active === true) {
      throw new BaseError(400, "Chỉ có thể xóa thủ tục hành chính không còn hoạt động");
    }
    let tenThuTuc = appendDeleteSuffixc(exists.ten_thu_tuc);
    let maThuc = appendDeleteSuffixc(exists.ma_thu_tuc);
    await ThuTucRepository.deleteThuTuc(thuTucId, currentUser, tenThuTuc, maThuc);
  },

  async updateThuTuc(thuTucId, idCoSoDichVuCong, tenThuTuc, maThuTuc, doiTuongThucHien, yeuCauDieuKienChung, soQuyetDinh, danhSachLinhVucIds = [], danhSachMauDon = [], cachThuThucHien = [], trinhTuThucHien = [], truongHopThuTuc = [], currentUser) {
    tenThuTuc = capitalizeWords(tenThuTuc);
    maThuTuc = maThuTuc?.toUpperCase();
    const existingThuTuc = await ThuTucRepository.getThuTucById(thuTucId);

    if (!existingThuTuc) {
      throw new BaseError(404, "Không tìm thấy thủ tục hành chính để cập nhật");
    }

    const dupliacte = await ThuTucRepository.findByMaOrTenExcludeId(maThuTuc, tenThuTuc, thuTucId);
    if (dupliacte) {
      throw new BaseError(409, "Trùng mã thủ thục hoặc tên thủ tục với thủ tục hành chính khác");
    }

    const existingCoso = await CoSoDichVuCongRepository.findById(idCoSoDichVuCong);
    const existingLinhVucs = await LinhVucRepository.findManyByIds(danhSachLinhVucIds, true);
    const existingDanhSachMauDons = await MauDonRepository.findManyByIds(danhSachMauDon, true);

    if (!existingCoso || existingCoso.is_active === false) {
      throw new BaseError(400, "Cơ sở dịch vụ công không tồn tại");
    }

    if (existingLinhVucs.length !== danhSachLinhVucIds.length) {
      throw new BaseError(400, "Một hoặc nhiều lĩnh vực không tồn tại");
    }

    if (existingDanhSachMauDons.length !== danhSachMauDon.length) {
      throw new BaseError(400, "Một hoặc nhiều mẫu đơn không tồn tại");
    }

    // Normalize nested names
    const normalizedTruongHop = (truongHopThuTuc || []).map(th => ({
      ...th,
      tenTruongHop: th.tenTruongHop ? capitalizeWords(th.tenTruongHop) : th.tenTruongHop,
      thanhPhanHoSo: (th.thanhPhanHoSo || []).map(tp => ({
        ...tp,
        tenThanhPhan: tp.tenThanhPhan ? capitalizeWords(tp.tenThanhPhan) : tp.tenThanhPhan,
      })),
    }));

    return await ThuTucRepository.updateThuTuc(thuTucId, idCoSoDichVuCong, tenThuTuc, maThuTuc, doiTuongThucHien, yeuCauDieuKienChung, soQuyetDinh, danhSachLinhVucIds, danhSachMauDon, cachThuThucHien, trinhTuThucHien, normalizedTruongHop, currentUser);
  },

  async getAllForMobile(idLinhVuc) {
    const thuTucs = await ThuTucRepository.getAllForMobile(idLinhVuc);
    return thuTucs;
  },

  async updateThuTucStatus(thuTucId, isActive, currentUser) {
    const existingThuTuc = await ThuTucRepository.getThuTucById(thuTucId);
    if (!existingThuTuc) {
      throw new BaseError(404, "Không tìm thấy thủ tục hành chính để cập nhật trạng thái");
    }
    return await ThuTucRepository.updateThuTucStatus(thuTucId, isActive, currentUser);
  },
};

export default ThuTucService;
