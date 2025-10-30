import { BaseError } from "../utils/base-error.util.js";
import ThuTucRepository from "../repositories/thu-tuc.repository.js";
import { createPagination } from "../utils/response.util.js";
import CoSoDichVuCongRepository from "../repositories/co-so-dich-vu-cong.repository.js";
import LinhVucRepository from "../repositories/linh-vuc.repository.js";
import MauDonRepository from "../repositories/mau-don.repository.js";

const ThuTucService = {
  async getThuTucById(procedureId) {
    const procedure = await ThuTucRepository.findByIdFull(procedureId);

    if (!procedure) {
      console.warn(
        `[WARN] ${new Date().toISOString()} - Thủ tục với ID ${procedureId} không tìm thấy`
      );
      throw new BaseError(400, "Thủ tục hành chính không tìm thấy");
    }

    return procedure;
  },

  async getAll(page, size, is_removed, id_linh_vuc, search) {
    const { thuTucs, total } = await ThuTucRepository.getAll(
      page,
      size,
      is_removed,
      id_linh_vuc,
      search,
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
      is_removed: item.is_removed,
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

  async createThuTuc(idCoSoDichVuCong, tenThuTuc, maThuTuc, doiTuongThucHien, yeuCauDieuKienChung, soQuyetDinh, danhSachLinhVucIds = [], danhSachMauDon = [], cachThuThucHien = [], trinhTuThucHien = []) {

    const existingCoso = await CoSoDichVuCongRepository.findById(idCoSoDichVuCong, false);
    const existingThuTuc = await ThuTucRepository.findByMaAndTenThuTuc(maThuTuc, tenThuTuc, false);
    const existingLinhVucs = await LinhVucRepository.findManyByIds(danhSachLinhVucIds, false);
    const existingDanhSachMauDons = await MauDonRepository.findManyByIds(danhSachMauDon, false);

    if (existingThuTuc) {
      throw new BaseError(400, "Thủ tục hành chính với mã hoặc tên đã tồn tại");
    }

    if (!existingCoso) {
      throw new BaseError(400, "Cơ sở dịch vụ công không tồn tại");
    }

    if (existingLinhVucs.length !== danhSachLinhVucIds.length) {
      throw new BaseError(400, "Một hoặc nhiều lĩnh vực không tồn tại");
    }

    if (existingDanhSachMauDons.length !== danhSachMauDon.length) {
      throw new BaseError(400, "Một hoặc nhiều mẫu đơn không tồn tại");
    }

    const newThuTuc = await ThuTucRepository.createThuTuc(idCoSoDichVuCong, tenThuTuc, maThuTuc, doiTuongThucHien, yeuCauDieuKienChung, soQuyetDinh, danhSachLinhVucIds, danhSachMauDon, cachThuThucHien, trinhTuThucHien);
    return newThuTuc;
  },

  async hardDeleteThuTuc(thuTucId) {
    const exists = await ThuTucRepository.getThuTucById(thuTucId);
    if (!exists) {
      throw new BaseError(404, "Không tìm thấy thủ tục hành chính để xóa");
    }
    if (exists.is_removed === false) {
      throw new BaseError(400, "Chỉ có thể xóa thủ tục hành chính đã được đánh dấu là đã xóa");
    }
    await ThuTucRepository.hardDeleteThuTuc(thuTucId);
  },

  async updateThuTuc(thuTucId, idCoSoDichVuCong, tenThuTuc, maThuTuc, doiTuongThucHien, yeuCauDieuKienChung, soQuyetDinh, isRemoved, danhSachLinhVucIds = [], danhSachMauDon = [], cachThuThucHien = [], trinhTuThucHien = []) {

    const existingThuTuc = await ThuTucRepository.getThuTucById(thuTucId);

    if (!existingThuTuc) {
      throw new BaseError(404, "Không tìm thấy thủ tục hành chính để cập nhật");
    }

    const dupliacte = await ThuTucRepository.findByMaOrTenExcludeId(maThuTuc, tenThuTuc, thuTucId);
    if (dupliacte) {
      throw new BaseError(400, "Trung mã thủ thục hoặc tên thủ tục với thủ tục hành chính khác");
    }

    const existingCoso = await CoSoDichVuCongRepository.findById(idCoSoDichVuCong, false);
    const existingLinhVucs = await LinhVucRepository.findManyByIds(danhSachLinhVucIds, false);
    const existingDanhSachMauDons = await MauDonRepository.findManyByIds(danhSachMauDon, false);

    if (!existingCoso) {
      throw new BaseError(400, "Cơ sở dịch vụ công không tồn tại");
    }

    if (existingLinhVucs.length !== danhSachLinhVucIds.length) {
      throw new BaseError(400, "Một hoặc nhiều lĩnh vực không tồn tại");
    }

    if (existingDanhSachMauDons.length !== danhSachMauDon.length) {
      throw new BaseError(400, "Một hoặc nhiều mẫu đơn không tồn tại");
    }

    return await ThuTucRepository.updateThuTuc(thuTucId, idCoSoDichVuCong, tenThuTuc, maThuTuc, doiTuongThucHien, yeuCauDieuKienChung, soQuyetDinh, isRemoved, danhSachLinhVucIds, danhSachMauDon, cachThuThucHien, trinhTuThucHien);
  },

  async getAllForMobile(id_linh_vuc) {
    const thuTucs = await ThuTucRepository.getAllForMobile(id_linh_vuc);
    return thuTucs;
  }

};

export default ThuTucService;
