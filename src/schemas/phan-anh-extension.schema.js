import joiToSwagger from "joi-to-swagger";
import { addFileToJoiSchema } from "../utils/swagger.util.js";
import {
  CreatePhanAnhExtensionRequest,
  RejectPhanAnhExtensionRequest,
} from "../validators/phan-anh-extension.validator.js";

const { swagger: RejectPhanAnhExtensionRequestSchema } = joiToSwagger(
  RejectPhanAnhExtensionRequest,
);

export default {
  CreatePhanAnhExtensionRequest: addFileToJoiSchema(
    CreatePhanAnhExtensionRequest,
    {
      fieldName: "file",
      maxCount: 5,
      description:
        "Minh chứng gia hạn tùy chọn: ảnh, PDF, Word hoặc Excel; video truyền bằng idVideo sau khi tải lên HLS.",
      allowNull: true,
    },
  ),
  RejectPhanAnhExtensionRequest: RejectPhanAnhExtensionRequestSchema,
};
