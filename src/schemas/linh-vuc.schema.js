import JoiToSwagger from 'joi-to-swagger';
import { CreateLinhVucRequest, UpdateLinhVucRequest, UpdateLinhVucStatusRequest } from '../validators/linh-vuc.validator.js';

const { swagger: CreateLinhVucRequestSchema } = JoiToSwagger(CreateLinhVucRequest);
const { swagger: UpdateLinhVucRequestSchema } = JoiToSwagger(UpdateLinhVucRequest);
const { swagger: UpdateLinhVucStatusRequestSchema } = JoiToSwagger(UpdateLinhVucStatusRequest);

const LinhVucSchemas = {
    CreateLinhVucRequest: CreateLinhVucRequestSchema,
    UpdateLinhVucRequest: UpdateLinhVucRequestSchema,
    UpdateLinhVucStatusRequest: UpdateLinhVucStatusRequestSchema,
};

export default LinhVucSchemas;

