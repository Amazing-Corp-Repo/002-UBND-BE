import joiToSwagger from "joi-to-swagger";
import { CreateDanhMucTinTucRequest, UpdateDanhMucTinTucRequest, UpdateStatusDanhMucTinTucRequest } from "../validators/danh-muc-tin-tuc.validator.js";

const { swagger: CreateDanhMucTinTucRequestSchema } = joiToSwagger(CreateDanhMucTinTucRequest);
const { swagger: UpdateDanhMucTinTucRequestSchema } = joiToSwagger(UpdateDanhMucTinTucRequest);
const { swagger: UpdateStatusDanhMucTinTucRequestSchema } = joiToSwagger(UpdateStatusDanhMucTinTucRequest);

const DanhMucTinTucSchema = {
    CreateDanhMucTinTucRequest: CreateDanhMucTinTucRequestSchema,
    UpdateDanhMucTinTucRequest: UpdateDanhMucTinTucRequestSchema,
    UpdateStatusDanhMucTinTucRequest: UpdateStatusDanhMucTinTucRequestSchema,
};

export default DanhMucTinTucSchema;