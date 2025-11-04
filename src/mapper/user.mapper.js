const toUserResponse = (user) => {
    return {
        id: user.id,
        ten_dang_nhap: user.ten_dang_nhap,
        ho_va_ten: user.ho_va_ten,
        email: user.email,
        so_dien_thoai: user.so_dien_thoai,
        vai_tro: user.vai_tro,
        xac_thuc_hai_yeu_to: user.is_enable_two_factor,
        is_active: user.is_active,
        thoi_gian_tao: user.thoi_gian_tao,
        thoi_gian_cap_nhat: user.thoi_gian_cap_nhat,
    };
}

export default toUserResponse;