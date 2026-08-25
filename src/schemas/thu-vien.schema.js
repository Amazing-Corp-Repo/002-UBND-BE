import {
  CreateVanHoaRequest,
  UpdateVanHoaRequest,
  CreatePhapLuatRequest,
  UpdatePhapLuatRequest,
  UpdateStatusTaiLieuRequest,
  AiLearnRequest,
  ApproveTaiLieuRequest,
  RejectTaiLieuRequest,
} from "../validators/thu-vien.validator.js";
import { addFileToJoiSchema } from "../utils/swagger.util.js";
import JoiToSwagger from "joi-to-swagger";

const { swagger: UpdateStatusTaiLieuSwagger } = JoiToSwagger(UpdateStatusTaiLieuRequest);
const { swagger: AiLearnSwagger } = JoiToSwagger(AiLearnRequest);
const { swagger: ApproveTaiLieuSwagger } = JoiToSwagger(ApproveTaiLieuRequest);
const { swagger: RejectTaiLieuSwagger } = JoiToSwagger(RejectTaiLieuRequest);

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
  ApproveTaiLieuRequest: ApproveTaiLieuSwagger,
  RejectTaiLieuRequest: RejectTaiLieuSwagger,
};

export default ThuVienSchemas;