import prisma from "../config/database.config.js"

const ThuTucRepository = {
     async getThuTucById(procedureId) {
        return await prisma.thu_tuc_hanh_chinh.findUnique({
            where: { id: procedureId },
        });
    },
    async getAllThuTucWithBasicDetails(page, size) {
        const skip = (page - 1) * size;
        const [procedures, total] = await Promise.all([
            // Truy vấn đầu tiên trong Promise.all
            prisma.thu_tuc_hanh_chinh.findMany({
                skip,
                take: size,
                include: {
                    thu_tuc_hanh_chinh_linh_vuc: {
                        include: {
                            linh_vuc: true // Lấy chi tiết
                        }                   
                },

                co_so_dich_vu_cong: {
                        include: {
                            uy_ban: true 
                        }
                    }
                },
                where: {is_removed: false},
                orderBy: {
                    thoi_gian_tao: 'desc' 
                }
                
            }),
            // truy vấn thứ hai
            prisma.thu_tuc_hanh_chinh.count({
                where: {is_removed: false}
    })
        ]);
        return {procedures, total}
    },

    async getThuTucAllDetails(procedureId) {
        return await prisma.thu_tuc_hanh_chinh.findUnique({
            where: {id: procedureId},
            include: {
                 thu_tuc_hanh_chinh_linh_vuc: {
                    include: {
                        linh_vuc: true
                    }
                },

                 co_so_dich_vu_cong: {
                    where: { is_removed: false }, 
                    include: {
                        uy_ban: true 
                }
            },
               trinh_tu_thuc_hien_thu_tuc: { 
                    orderBy:{thu_tu_buoc: 'asc'},
                    where: {is_removed: false}
                },
                thu_tuc_hanh_chinh_mau_don: { 
                    where: {mau_don: {is_removed: false}},
                    include: {
                        mau_don: true
                    }
                },  
                cach_thuc_thuc_hien: {
                    where: { is_removed: false },
                    orderBy: { hinh_thuc_ap_dung: 'asc' } 
                },
                nguoi_dung_thu_tuc_hanh_chinh_nguoi_taoTonguoi_dung: true,
                nguoi_dung_thu_tuc_hanh_chinh_nguoi_cap_nhapTonguoi_dung: true,
            }
        })
    }
}

export default ThuTucRepository;