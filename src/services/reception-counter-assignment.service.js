import ReceptionCounterAssignmentRepository from "../repositories/reception-counter-assignment.repository.js";

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

const ReceptionCounterAssignmentService = {
  async getAll(filters) {
    const assignments = await ReceptionCounterAssignmentRepository.findAll(filters);
    return assignments.map(mapAssignment);
  },
};

export default ReceptionCounterAssignmentService;
