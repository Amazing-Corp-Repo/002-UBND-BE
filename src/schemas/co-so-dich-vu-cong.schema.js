import JoiToSwagger from 'joi-to-swagger';

import {
    CreateCoSoDichVuCongRequest,
    UpdateCoSoDichVuCongRequest,
    UpdateStatusCoSoDichVuCongRequest
} from '../validators/co-so-dich-vu-cong.validator.js';

const { swagger: CreateCoSoDichVuCongRequestSchema } = JoiToSwagger(CreateCoSoDichVuCongRequest);
const { swagger: UpdateCoSoDichVuCongRequestSchema } = JoiToSwagger(UpdateCoSoDichVuCongRequest);
const { swagger: UpdateStatusCoSoDichVuCongRequestSchema } = JoiToSwagger(UpdateStatusCoSoDichVuCongRequest);

const CoSoDichVuCongSchemas = {
    CreateCoSoDichVuCongRequest: CreateCoSoDichVuCongRequestSchema,
    UpdateCoSoDichVuCongRequest: UpdateCoSoDichVuCongRequestSchema,
    UpdateStatusCoSoDichVuCongRequest: UpdateStatusCoSoDichVuCongRequestSchema,
};

export default CoSoDichVuCongSchemas;