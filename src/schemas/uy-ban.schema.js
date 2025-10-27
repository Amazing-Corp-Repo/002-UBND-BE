import JoiToSwagger from 'joi-to-swagger';
import { CreateUyBanRequest, UpdateUyBanRequest } from '../validators/uy-ban.validator.js';

const { swagger: CreateUyBanRequestSchema } = JoiToSwagger(CreateUyBanRequest);
const { swagger: UpdateUyBanRequestSchema } = JoiToSwagger(UpdateUyBanRequest);

const UyBanSchemas = {
    CreateUyBanRequest: CreateUyBanRequestSchema,
    UpdateUyBanRequest: UpdateUyBanRequestSchema,
};
export default UyBanSchemas;