import CccdOcrService from "../services/cccd-ocr.service.js";
import { successResponse } from "../utils/response.util.js";

const CccdOcrController = {
  async recognize(req, res) {
    const data = await CccdOcrService.recognize(req.file);
    return successResponse(res, data, "Đọc thông tin CCCD thành công");
  },
};

export default CccdOcrController;
