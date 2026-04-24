import joiToSwagger from "joi-to-swagger";
import { addFileToJoiSchema } from "../utils/swagger.util.js";
import {
  CreatePhanAnhRequest,
  UpdatePhanAnhStatusRequest,
  CreatePhanAnhPublicRequest,
  ApproveOrRejectPhanAnhRequest,
} from "../validators/phan-anh.validator.js";

const { swagger: UpdatePhanAnhStatusRequestSchema } = joiToSwagger(
  UpdatePhanAnhStatusRequest,
);
const { swagger: CreatePhanAnhPublicRequestSchema } = joiToSwagger(
  CreatePhanAnhPublicRequest,
);
const { swagger: ApproveOrRejectPhanAnhRequestSchema } = joiToSwagger(
  ApproveOrRejectPhanAnhRequest,
);

const PhanAnhSchemas = {
  CreatePhanAnhRequest: addFileToJoiSchema(CreatePhanAnhRequest, {
    fieldName: "file",
    maxCount: 5,
    description: "Các tệp tin đính kèm cho phản ánh. Tối đa 5 tệp.",
  }),
  UpdatePhanAnhStatusRequest: UpdatePhanAnhStatusRequestSchema,
  CreatePhanAnhPublicRequest: addFileToJoiSchema(CreatePhanAnhPublicRequest, {
    fieldName: "file",
    maxCount: 5,
    description: "Các tệp tin đính kèm cho phản ánh. Tối đa 5 tệp.",
  }),
  ApproveOrRejectPhanAnhRequest: ApproveOrRejectPhanAnhRequestSchema,
};

export default PhanAnhSchemas;
