import LinhVucRepository from "../repositories/linh-vuc.repository.js";

const LinhVucService = {
    async getAll(is_removed) {
        const linhVucs = await LinhVucRepository.getAll(is_removed);
        return linhVucs;
    }
};

export default LinhVucService;