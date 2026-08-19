import ReceptionCounterRepository from "../repositories/reception-counter.repository.js";

const mapCounter = (counter) => ({
  id: counter.id,
  counterCode: counter.ma_quay,
  counterName: counter.ten_quay,
  order: counter.so_thu_tu,
  description: counter.mo_ta || null,
  defaultCapacity: counter.suc_chua_mac_dinh ?? 2,
  location: counter.vi_tri || null,
  isActive: counter.is_active === true,
  createdAt: counter.thoi_gian_tao || null,
  updatedAt: counter.thoi_gian_cap_nhat || null,
});

const ReceptionCounterService = {
  async getAll() {
    const counters = await ReceptionCounterRepository.findAllActive();
    return counters.map(mapCounter);
  },
};

export default ReceptionCounterService;
