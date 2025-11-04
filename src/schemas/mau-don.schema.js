import JoiToSwagger from 'joi-to-swagger';
import { CreateMauDonRequest, UpdateMauDonRequest, UpdateStatusMauDonRequest } from '../validators/mau-don.validator.js';
import { addFileToJoiSchema } from "../utils/swagger.util.js";

const { swagger: UpdateStatusMauDonRequestSchema } = JoiToSwagger(UpdateStatusMauDonRequest);

const MauDonSchemas = {
    CreateMauDonRequest: addFileToJoiSchema(CreateMauDonRequest, {
        fieldName: "file",
        maxCount: 1,
        description: "Tài liệu đính kèm cho mẫu đơn.",
    }),
    UpdateMauDonRequest: addFileToJoiSchema(UpdateMauDonRequest, {
        fieldName: "file",
        maxCount: 1,
        description: "Tài liệu đính kèm cho mẫu đơn.",
        allowNull: true,
    }),
    UpdateStatusMauDonRequestSchema,
};

export default MauDonSchemas;