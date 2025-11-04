import prisma from "../config/database.config.js";

const RefreshTokenRepository = {
    async create(data) {
        return await prisma.refresh_token.create({
            data
        });
    },

    async findByHash(tokenHash) {
        return await prisma.refresh_token.findUnique({
            where: {
                token_hash: tokenHash,
                is_revoked: false
            }
        })
    },

    async update(id, data) {
        return await prisma.refresh_token.update({
            where: { id },
            data
        });
    },

    async revokeAllForUser(userId, ip) {
        return await prisma.refresh_token.updateMany({
            where: {
                is_revoked: false,
                id_nguoi_dung: userId
            },
            data: {
                is_revoked: true,
                revoked_by_ip: ip,
            }
        });
    }
}

export default RefreshTokenRepository;