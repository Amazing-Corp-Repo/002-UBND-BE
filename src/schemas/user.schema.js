import JoiToSwagger from 'joi-to-swagger';
import { CreateAccountRequest, UpdateProfileByAdminRequest, UpdateProfileRequest, UpdateStatusByAdminRequest } from '../validators/user.validator.js';

const { swagger: CreateAccountSchema } = JoiToSwagger(CreateAccountRequest);
const { swagger: UpdateProfileRequestSchema } = JoiToSwagger(UpdateProfileRequest);
const { swagger: UpdateProfileByAdminRequestSchema } = JoiToSwagger(UpdateProfileByAdminRequest);
const { swagger: UpdateStatusByAdminRequestSchema } = JoiToSwagger(UpdateStatusByAdminRequest);

const UserSchemas = {
    CreateAccountRequest: CreateAccountSchema,
    UpdateProfileRequest: UpdateProfileRequestSchema,
    UpdateProfileByAdminRequest: UpdateProfileByAdminRequestSchema,
    UpdateStatusByAdminRequest: UpdateStatusByAdminRequestSchema,
};

export default UserSchemas;
