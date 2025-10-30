import JoiToSwagger from 'joi-to-swagger';
import { CreateLinhVucRequest, UpdateLinhVucRequest } from '../validators/linh-vuc.validator.js';

const { swagger: CreateLinhVucRequestSchema } = JoiToSwagger(CreateLinhVucRequest);
const { swagger: UpdateLinhVucRequestSchema } = JoiToSwagger(UpdateLinhVucRequest);

const LinhVucSchemas = {
    CreateLinhVucRequest: CreateLinhVucRequestSchema,
    UpdateLinhVucRequest: UpdateLinhVucRequestSchema,
};

export default LinhVucSchemas;

