import ReceptionCounterAssignmentRepository from "../repositories/reception-counter-assignment.repository.js";
import { BaseError } from "../utils/base-error.util.js";

const mapAssignment = (item) => ({
  id: item.id,
  shiftId: item.cau_hinh_quay.id_ca_tiep_dan,
  counterConfigurationId: item.id_cau_hinh_quay,
  counter: {
    id: item.cau_hinh_quay.quay_tiep_dan.id,
    counterCode: item.cau_hinh_quay.quay_tiep_dan.ma_quay,
    counterName: item.cau_hinh_quay.quay_tiep_dan.ten_quay,
  },
  officer: {
    id: item.can_bo.id,
    fullName: item.can_bo.ho_va_ten,
    username: item.can_bo.ten_dang_nhap,
  },
  receptionDate: item.cau_hinh_quay.ca_tiep_dan.lich_tiep_dan.ngay_tiep_dan,
  startTime: item.cau_hinh_quay.ca_tiep_dan.gio_bat_dau,
  endTime: item.cau_hinh_quay.ca_tiep_dan.gio_ket_thuc,
  isActive: item.is_active,
  createdAt: item.thoi_gian_tao,
  updatedAt: item.thoi_gian_cap_nhat,
});

const assignmentConflictErrors = {
  NOT_FOUND: [404, "Phân công quầy tiếp dân không tồn tại"],
  OFFICER_NOT_FOUND: [400, "Cán bộ không tồn tại hoặc đã ngừng hoạt động"],
  COUNTER_ALREADY_ASSIGNED: [409, "Quầy đã có cán bộ chính trong ca này"],
  OFFICER_ALREADY_ASSIGNED: [409, "Cán bộ đã được phân công quầy khác trong ca này"],
};

const ReceptionCounterAssignmentService = {
  async getAll(filters) {
    const assignments = await ReceptionCounterAssignmentRepository.findAll(filters);
    return assignments.map(mapAssignment);
  },

  async getById(id) {
    const assignment = await ReceptionCounterAssignmentRepository.findById(id);
    if (!assignment) {
      throw new BaseError(404, "Phân công quầy tiếp dân không tồn tại");
    }
    return mapAssignment(assignment);
  },

  async replaceForShift(shiftId, assignments, currentUserId) {
    const shift = await ReceptionCounterAssignmentRepository.findActiveShiftById(shiftId);
    if (!shift) {
      throw new BaseError(404, "Ca tiếp dân không tồn tại hoặc đã ngừng hoạt động");
    }

    const configurationIds = assignments.map((item) => item.counterConfigurationId);
    const officerIds = assignments.map((item) => item.officerId);
    if (new Set(configurationIds).size !== configurationIds.length) {
      throw new BaseError(409, "Một quầy không thể có nhiều cán bộ chính trong cùng ca");
    }
    if (new Set(officerIds).size !== officerIds.length) {
      throw new BaseError(409, "Một cán bộ không thể trực nhiều quầy trong cùng ca");
    }

    const [configurations, officers] = await Promise.all([
      ReceptionCounterAssignmentRepository.findActiveConfigurationsByIds(
        shiftId,
        configurationIds
      ),
      ReceptionCounterAssignmentRepository.findActiveOfficersByIds(officerIds),
    ]);
    if (configurations.length !== configurationIds.length) {
      throw new BaseError(400, "Có cấu hình quầy không tồn tại, ngừng hoạt động hoặc không thuộc ca");
    }
    if (officers.length !== officerIds.length) {
      throw new BaseError(400, "Có cán bộ không tồn tại hoặc đã ngừng hoạt động");
    }

    try {
      const result = await ReceptionCounterAssignmentRepository.replaceForShift(
        shiftId,
        assignments,
        currentUserId
      );
      return result.map(mapAssignment);
    } catch (error) {
      if (error?.code === "P2002" || error?.code === "P2034") {
        throw new BaseError(409, "Phân công đã thay đổi đồng thời, vui lòng tải lại và thử lại");
      }
      throw error;
    }
  },

  async update(id, input, currentUserId) {
    try {
      const result = await ReceptionCounterAssignmentRepository.updateWithGuards(
        id,
        input,
        currentUserId
      );
      if (result.conflict) {
        const [statusCode, message] = assignmentConflictErrors[result.conflict] || [
          409,
          "Không thể cập nhật phân công quầy",
        ];
        throw new BaseError(statusCode, message);
      }
      return mapAssignment(result.assignment);
    } catch (error) {
      if (error instanceof BaseError) throw error;
      if (error?.code === "P2002" || error?.code === "P2034") {
        throw new BaseError(409, "Phân công đã thay đổi đồng thời, vui lòng tải lại và thử lại");
      }
      throw error;
    }
  },

  async delete(id, currentUserId) {
    const deleted = await ReceptionCounterAssignmentRepository.softDelete(
      id,
      currentUserId
    );
    if (!deleted) {
      throw new BaseError(404, "Phân công quầy tiếp dân không tồn tại");
    }
  },
};

export default ReceptionCounterAssignmentService;
