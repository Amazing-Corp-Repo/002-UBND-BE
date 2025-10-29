import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import CoSoDichVuCongRepository from "../repositories/co-so-dich-vu-cong.repository.js";
import UyBanRepository from "../repositories/uy-ban.repository.js";

const CoSoDichVuCongService = {
  async getAll(isRemoved, search = "") {
    const result = await CoSoDichVuCongRepository.getAll({
      isRemoved,
      search: search.toUpperCase(),
    });

    return result;
  },

  async getCoSoDichVuCongById(id) {
    const facility = await CoSoDichVuCongRepository.findById(id);

    if (!facility) {
      throw new BaseError(404, "Cơ sở dịch vụ công không tồn tại");
    }

    return facility;
  },

  async getCoSoDichVuCongById(id) {
    const facility = await CoSoDichVuCongRepository.findById(id);

    if (!facility) {
      throw new BaseError(404, "Cơ sở dịch vụ công không tồn tại");
    }

    return facility;
  },

  async createCoSoDichVuCong(
    idUyBan,
    tenCoSo,
    diaChi,
    soDienThoai,
    moTa,
    linkGoogleMap
  ) {
    if (tenCoSo) {
      const duplicate = await CoSoDichVuCongRepository.findByTenCoSo(tenCoSo);
      if (duplicate) {
        throw new BaseError(400, "Tên cơ sở dịch vụ công đã tồn tại");
      }
    }

    const existingUyBan = await UyBanRepository.findById(idUyBan);
    if (!existingUyBan) {
      throw BaseError(404, 'Ủy ban không tồn tại');
    }


    return await CoSoDichVuCongRepository.createCoSoDichVuCong(
      idUyBan, tenCoSo, diaChi, soDienThoai, moTa, linkGoogleMap
    );
  },

  async updateCoSoDichVuCong(id, updateData, nguoiCapNhapId) {
    const existing = await CoSoDichVuCongRepository.findById(id);
    if (!existing) {
      throw new BaseError(400, "Cơ sở dịch vụ công không tồn tại");
    }

    if (updateData?.tenCoSo) {
      const duplicate = await CoSoDichVuCongRepository.findByTenCoSoExcludeId(
        updateData.tenCoSo,
        id
      );
      if (duplicate) {
        throw new BaseError(400, "Tên cơ sở dịch vụ công đã tồn tại");
      }
    }

    const payload = mapPayloadToDb(updateData);

    return await CoSoDichVuCongRepository.updateCoSoDichVuCong(
      id,
      payload,
      nguoiCapNhapId
    );
  },

  async softDeleteCoSoDichVuCong(id, nguoiCapNhapId) {
    const existing = await CoSoDichVuCongRepository.findById(id, {
      includeRemoved: true,
    });

    if (!existing) {
      throw new BaseError(400, "Cơ sở dịch vụ công không tồn tại");
    }

    if (existing.is_removed) {
      return existing;
    }

    return await CoSoDichVuCongRepository.deleteCoSoDichVuCong(
      id,
      nguoiCapNhapId
    );
  },
};

export default CoSoDichVuCongService;
