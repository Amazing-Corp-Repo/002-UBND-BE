import prisma from "../config/database.config.js";

const MauDonRepository = {
    // Lấy thông tin thủ tục theo id
    async findById(thuTucId) {
        return await prisma.thu_tuc_hanh_chinh.findUnique({
            where: { id: thuTucId },
            include: {
                thu_tuc_hanh_chinh_mau_don: {
                    include: {
                        mau_don: true
                    }
                }
            }
        });
    },

    // Lấy danh sách mẫu đơn của một thủ tục
    async getMauDonByThuTucId(thuTucId) {
        const thuTuc = await prisma.thu_tuc_hanh_chinh.findUnique({
            where: { id: thuTucId },
            include: {
                thu_tuc_hanh_chinh_mau_don: {
                    where: {
                        mau_don: {
                            is_removed: false
                        }
                    },
                    include: {
                        mau_don: true
                    },
                    orderBy: {
                        mau_don: {
                            ten_mau_don: 'asc'
                        }
                    }
                }
            }
        });

        return thuTuc?.thu_tuc_hanh_chinh_mau_don || [];
    },

    // Kiểm tra thủ tục có tồn tại không
    async existsThuTuc(thuTucId) {
        const count = await prisma.thu_tuc_hanh_chinh.count({
            where: {
                id: thuTucId,
                is_removed: false
            }
        });
        return count > 0;
    }
};

export default MauDonRepository;

