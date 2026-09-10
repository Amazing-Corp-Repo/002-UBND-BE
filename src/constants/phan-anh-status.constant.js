const PHAN_ANH_STATUS = {
    DA_GUI: 'Đã gửi',
    DANG_XU_LY: 'Đang xử lý',
    DA_GIAI_QUYET: 'Đã giải quyết',
    DONG: 'Đóng',
    TU_CHOI: 'Từ chối',
    DA_GIA_HAN: 'Đã gia hạn',
};

// "Đã gia hạn" is an audit/history event, not a status that can be set through
// the normal complaint-status transition endpoint.
export const PHAN_ANH_LIFECYCLE_STATUS = Object.freeze([
    PHAN_ANH_STATUS.DA_GUI,
    PHAN_ANH_STATUS.DANG_XU_LY,
    PHAN_ANH_STATUS.DA_GIAI_QUYET,
    PHAN_ANH_STATUS.DONG,
    PHAN_ANH_STATUS.TU_CHOI,
]);

export default PHAN_ANH_STATUS;
