import joiToSwagger from "joi-to-swagger";
import { CreateDanhMucTinTucRequest, UpdateDanhMucTinTucRequest } from "../validators/danh-muc-tin-tuc.validator.js";

const { swagger: CreateDanhMucTinTucRequestSchema } = joiToSwagger(CreateDanhMucTinTucRequest);
const { swagger: UpdateDanhMucTinTucRequestSchema } = joiToSwagger(UpdateDanhMucTinTucRequest);

const DanhMucTinTucSchema = {
    CreateDanhMucTinTucRequest: CreateDanhMucTinTucRequestSchema,
    UpdateDanhMucTinTucRequest: UpdateDanhMucTinTucRequestSchema,
};

export default DanhMucTinTucSchema;