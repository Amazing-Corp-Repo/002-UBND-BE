import { CreateTinTucRequest, UpdateTinTucRequest, UploadFileDinhKemRequest } from "../validators/tin-tuc.validator.js";
import { addFileToJoiSchema } from "../utils/swagger.util.js";

const TinTucSchemas = {
    UploadFileDinhKemRequest: addFileToJoiSchema(UploadFileDinhKemRequest, {
        fieldName: "file",
        maxCount: 1,
        description: "Tệp đính kèm cho tin tức.",
    }),
    UpdateDanhMucTinTucRequest: addFileToJoiSchema(UpdateTinTucRequest, {
        fieldName: "file",
        maxCount: 1,
        description: "Hình ảnh đại diện cho danh mục tin tức.",
        allowNull: true
    }),
    CreateTinTucRequest: addFileToJoiSchema(CreateTinTucRequest, {
        fieldName: "file",
        maxCount: 1,
        description: "Hình ảnh đại diện cho tin tức.",
        allowNull: false
    }),
};

export default TinTucSchemas;