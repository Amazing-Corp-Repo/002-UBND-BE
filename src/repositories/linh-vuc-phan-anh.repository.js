import prisma from '../config/database.config.js';
import PHAN_ANH_STATUS from '../constants/phan-anh-status.constant.js';

const LinhVucPhanAnhRepository = {
    async findByName(ten) {
        return await prisma.linh_vuc_phan_anh.findFirst({
            where: {
                ten: ten,
                is_delete: false,
            },
        });
    },

    async create(data) {
        return await prisma.linh_vuc_phan_anh.create({
            data: data,
        });
    },

    async getAll(page, size, search, isActive) {
        const skip = (page - 1) * size;
        const where = {
            ...(isActive !== undefined && isActive !== ''
                ? { is_active: isActive === 'true' }
                : {}),
            is_delete: false,
            ...(search !== undefined && search !== ''
                ? { ten: { contains: search, mode: 'insensitive' } }
                : {}),
        };
        const [data, totalItems] = await Promise.all([
            prisma.linh_vuc_phan_anh.findMany({
                where,
                skip,
                take: size,
                orderBy: {
                    thoi_gian_tao: 'desc',
                },
            }),
            prisma.linh_vuc_phan_anh.count({ where }),
        ]);
        return { data, totalItems };
    },
    async findById(id) {
        return await prisma.linh_vuc_phan_anh.findFirst({
            where: {
                id: id,
                is_delete: false,
            },
        });
    },

    async update(id, data) {
        return await prisma.linh_vuc_phan_anh.update({
            where: { id: id },
            data: data,
        });
    },

    async findByNameExcludingId(id, ten) {
        return await prisma.linh_vuc_phan_anh.findFirst({
            where: {
                ten: ten,
                id: { not: id },
                is_delete: false,
            },
        });
    },

    async countActiveReflections(idLinhVuc) {
        const dong = PHAN_ANH_STATUS.DONG;
        const daGiaiQuyet = PHAN_ANH_STATUS.DA_GIAI_QUYET;

        const result = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*)::int AS count
        FROM phan_anh pa
        LEFT JOIN LATERAL (
            SELECT lst.ten
            FROM lich_su_trang_thai lst
            WHERE lst.id_phan_anh = pa.id
            ORDER BY lst.thoi_gian_tao DESC
            LIMIT 1
        ) AS latest ON TRUE
        WHERE pa.id_linh_vuc_phan_anh = $1::uuid
        AND (latest.ten NOT IN ($2, $3));
    `, idLinhVuc, dong, daGiaiQuyet);

        return result[0]?.count ?? 0;
    },

    async countActiveReflectionsToDelete(idLinhVuc) {
        return await prisma.phan_anh.count({
            where: {
                id_linh_vuc_phan_anh: idLinhVuc,
            },
        });
    },

    async searchByName(search) {
        const where = {
            is_delete: false,
            ...(search !== undefined && search !== ''
                ? { ten: { contains: search, mode: 'insensitive' } }
                : {}),
            is_active: true,
        };
        return await prisma.linh_vuc_phan_anh.findMany({
            where,
            orderBy: {
                thoi_gian_tao: 'desc',
            },
        });
    },

    async getAllActiveLinhVucPhanAnh() {
        return await prisma.linh_vuc_phan_anh.findMany({
            where: {
                is_delete: false,
                is_active: true,
            },
            orderBy: {
                thoi_gian_tao: 'desc',
            },
            select: {
                id: true,
                ten: true,
            },
        });
    },

    async getTenLinhVucById(id) {
        const linhVuc =  await prisma.linh_vuc_phan_anh.findFirst({
            where: {
                id: id,
                is_delete: false,
            },
            select: {
                ten: true,
            },
        });
        return linhVuc ? linhVuc.ten : null;
    }
};

export default LinhVucPhanAnhRepository;