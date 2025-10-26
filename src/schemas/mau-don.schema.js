import JoiToSwagger from 'joi-to-swagger';
import { CreateMauDonRequest, UpdateMauDonRequest } from '../validators/mau-don.validator.js';
import { addFileToJoiSchema } from "../utils/swagger.util.js";

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
};

export default MauDonSchemas;