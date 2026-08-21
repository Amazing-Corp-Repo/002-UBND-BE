import {
  CreateVanHoaRequest,
  UpdateVanHoaRequest,
  CreatePhapLuatRequest,
  UpdatePhapLuatRequest,
  UpdateStatusTaiLieuRequest,
  AiLearnRequest,
} from "../validators/thu-vien.validator.js";
import { addFileToJoiSchema } from "../utils/swagger.util.js";
import JoiToSwagger from "joi-to-swagger";

const { swagger: UpdateStatusTaiLieuSwagger } = JoiToSwagger(UpdateStatusTaiLieuRequest);
const { swagger: AiLearnSwagger } = JoiToSwagger(AiLearnRequest);

const ThuVienSchemas = {
  CreateVanHoaRequest: addFileToJoiSchema(CreateVanHoaRequest, {
    fieldName: "file",
    maxCount: 1,
    description: "File tài liệu đính kèm (PDF, DOC, DOCX)",
    allowNull: true,
  }),
  UpdateVanHoaRequest: addFileToJoiSchema(UpdateVanHoaRequest, {
    fieldName: "file",
    maxCount: 1,
    description: "File tài liệu đính kèm (PDF, DOC, DOCX)",
    allowNull: true,
  }),
  CreatePhapLuatRequest: addFileToJoiSchema(CreatePhapLuatRequest, {
    fieldName: "file",
    maxCount: 1,
    description: "File tài liệu đính kèm (PDF, DOC, DOCX)",
    allowNull: true,
  }),
  UpdatePhapLuatRequest: addFileToJoiSchema(UpdatePhapLuatRequest, {
    fieldName: "file",
    maxCount: 1,
    description: "File tài liệu đính kèm (PDF, DOC, DOCX)",
    allowNull: true,
  }),
  UpdateStatusTaiLieuRequest: UpdateStatusTaiLieuSwagger,
  AiLearnRequest: AiLearnSwagger,
};

export default ThuVienSchemas;