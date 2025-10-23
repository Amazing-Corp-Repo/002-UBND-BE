const toUserResponse = (user) => {
    return {
        id: user.id,
        tenDangNhap: user.ten_dang_nhap,
        hoVaTen: user.ho_va_ten,
        email: user.email,
        soDienThoai: user.so_dien_thoai,
        vaiTro: user.vai_tro,
        xacThucHaiYeuTo: user.is_enable_two_factor,
        trangThai: user.trang_thai,
        ngayTao: user.ngay_tao,
        ngayCapNhap: user.ngay_cap_nhap,
    };
}

export default toUserResponse;