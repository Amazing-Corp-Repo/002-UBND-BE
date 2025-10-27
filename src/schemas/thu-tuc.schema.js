import JoiToSwagger from 'joi-to-swagger';
import { CreateThuTucRequest, UpdateThuTucRequest } from '../validators/thu-tuc.validator.js';

const { swagger: CreateThuTucRequestSchema } = JoiToSwagger(CreateThuTucRequest);
const { swagger: UpdateThuTucRequestSchema } = JoiToSwagger(UpdateThuTucRequest);

const ThuTucSchemas = {
    CreateThuTucRequest: CreateThuTucRequestSchema,
    UpdateThuTucRequest: UpdateThuTucRequestSchema,
};
export default ThuTucSchemas;