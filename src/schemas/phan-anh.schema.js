import joiToSwagger from "joi-to-swagger";
import { addFileToJoiSchema } from "../utils/swagger.util.js";
import { CreatePhanAnhRequest, UpdatePhanAnhStatusRequest } from "../validators/phan-anh.validator.js";

const { swagger: UpdatePhanAnhStatusRequestSchema } = joiToSwagger(UpdatePhanAnhStatusRequest);

const PhanAnhSchemas = {
    CreatePhanAnhRequest: addFileToJoiSchema(CreatePhanAnhRequest, {
        fieldName: "file",
        maxCount: 5,
        description: "Các tệp tin đính kèm cho phản ánh. Tối đa 5 tệp.",
    }),
    UpdatePhanAnhStatusRequest: UpdatePhanAnhStatusRequestSchema,
};

export default PhanAnhSchemas;