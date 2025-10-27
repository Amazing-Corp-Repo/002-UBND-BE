import prisma from "../config/database.config.js";

const CoSoDichVuCongRepository = {
    async findById(id, is_removed = false) {
        return await prisma.co_so_dich_vu_cong.findFirst({
            where: {
                id,
                is_removed
            },
        });
    },
};

export default CoSoDichVuCongRepository;