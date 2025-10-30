import JoiToSwagger from 'joi-to-swagger';

import {
    CreateCoSoDichVuCongRequest,
    UpdateCoSoDichVuCongRequest
} from '../validators/co-so-dich-vu-cong.validator.js';

const { swagger: CreateCoSoDichVuCongRequestSchema } = JoiToSwagger(CreateCoSoDichVuCongRequest);
const { swagger: UpdateCoSoDichVuCongRequestSchema } = JoiToSwagger(UpdateCoSoDichVuCongRequest);

const CoSoDichVuCongSchemas = {
    CreateCoSoDichVuCongRequest: CreateCoSoDichVuCongRequestSchema,
    UpdateCoSoDichVuCongRequest: UpdateCoSoDichVuCongRequestSchema,
};

export default CoSoDichVuCongSchemas;