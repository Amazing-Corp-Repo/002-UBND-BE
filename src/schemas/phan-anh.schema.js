import joiToSwagger from "joi-to-swagger";
import { addFileToJoiSchema } from "../utils/swagger.util.js";
import {
  CreatePhanAnhRequest,
  UpdatePhanAnhStatusRequest,
  CreatePhanAnhPublicRequest,
  UpdatePhanAnhLinhVucRequest,
} from "../validators/phan-anh.validator.js";

const { swagger: UpdatePhanAnhLinhVucRequestSchema } = joiToSwagger(
  UpdatePhanAnhLinhVucRequest,
);

const PhanAnhSchemas = {
  CreatePhanAnhRequest: addFileToJoiSchema(CreatePhanAnhRequest, {
    fieldName: "file",
    maxCount: 5,
    description:
      "Hình ảnh bắt buộc của phản ánh. Chấp nhận JPEG/PNG, tối đa 5 ảnh, mỗi ảnh tối đa 3 MB.",
  }),
  UpdatePhanAnhStatusRequest: addFileToJoiSchema(UpdatePhanAnhStatusRequest, {
    fieldName: "file",
    maxCount: 5,
    description:
      "Các tệp đính kèm xử lý phản ánh. Hỗ trợ ảnh và tài liệu. Khi chuyển sang trạng thái đã giải quyết, chỉ cần có 1 trong 2: file hoặc idVideoGiaiQuyet.",
    allowNull: true,
  }),
  UpdatePhanAnhLinhVucRequest: UpdatePhanAnhLinhVucRequestSchema,
  CreatePhanAnhPublicRequest: addFileToJoiSchema(CreatePhanAnhPublicRequest, {
    fieldName: "file",
    maxCount: 5,
    description:
      "Hình ảnh bắt buộc của phản ánh. Chấp nhận JPEG/PNG, tối đa 5 ảnh, mỗi ảnh tối đa 3 MB.",
  }),
};

export default PhanAnhSchemas;
