import JoiToSwagger from 'joi-to-swagger';
import { CreateThuTucRequest, UpdateThucTucStatusRequest, UpdateThuTucRequest } from '../validators/thu-tuc.validator.js';

const { swagger: CreateThuTucRequestSchema } = JoiToSwagger(CreateThuTucRequest);
const { swagger: UpdateThuTucRequestSchema } = JoiToSwagger(UpdateThuTucRequest);
const { swagger: UpdateThuTucStatusRequestSchema } = JoiToSwagger(UpdateThucTucStatusRequest);

const ThuTucSchemas = {
    CreateThuTucRequest: CreateThuTucRequestSchema,
    UpdateThuTucRequest: UpdateThuTucRequestSchema,
    UpdateThuTucStatusRequest: UpdateThuTucStatusRequestSchema,
};
export default ThuTucSchemas;