import joiToSwagger from "joi-to-swagger";
import { CreateLinhVucPhanAnhRequest, UpdateLinhVucPhanAnhRequest, UpdateLinhVucPhanAnhStatusRequest } from "../validators/linh-vuc-phan-anh.validator.js";

const { swagger: CreateLinhVucPhanAnhRequesSchema } = joiToSwagger(CreateLinhVucPhanAnhRequest);
const { swagger: UpdateLinhVucPhanAnhRequestSchema } = joiToSwagger(UpdateLinhVucPhanAnhRequest);
const { swagger: UpdateLinhVucPhanAnhStatusRequestSchema } = joiToSwagger(UpdateLinhVucPhanAnhStatusRequest);

const LinhVucPhanAnhSchema = {
    CreateLinhVucPhanAnhRequest: CreateLinhVucPhanAnhRequesSchema,
    UpdateLinhVucPhanAnhRequest: UpdateLinhVucPhanAnhRequestSchema,
    UpdateLinhVucPhanAnhStatusRequest: UpdateLinhVucPhanAnhStatusRequestSchema,
};

export default LinhVucPhanAnhSchema;