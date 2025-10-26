import { BaseError } from "../utils/base-error.util.js";
import ThuTucRepository from "../repositories/thu-tuc.respository.js";
import { logger } from '../utils/logger.util.js';

const ThuTucService = {
 async getThuTucBasicDetails(procedureId) {
    const procedure = await ThuTucRepository.getThuTucById(procedureId);

    if(!procedure || procedure.is_removed) {
        logger.warn(`Thủ tục với ID ${procedureId} không tìm thấy hoặc đã bị xóa`)
        throw new BaseError(404, 'Thủ tục hành chính không tìm thấy');
    }

    return procedure;
 },

 async getAllProcedure(page, size) {
    // Kiểm tra logic size, page
    if(page < 1) page = 1
    if(size < 1) size = 10

    const {procedures, total} = await ThuTucRepository.getAllThuTucWithBasicDetails(page, size);

    return {procedures, total, page, size, totalPages: Math.ceil(total/ size)};
 },

 async getFullProcedureDetails(procedureId) {
    const procedure = await ThuTucRepository.getThuTucAllDetails(procedureId);

      if (!procedure || procedure.is_removed) {
            logger.warn(`Thủ tục với ID ${procedureId} không tìm thấy hoặc đã bị xóa (chi tiết đầy đủ).`);
            throw new BaseError(404, 'Thủ tục hành chính không tìm thấy hoặc đã bị xóa.');
        }
        return procedure;
 }
}

export default ThuTucService;