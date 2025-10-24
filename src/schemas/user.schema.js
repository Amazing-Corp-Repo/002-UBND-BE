import JoiToSwagger from 'joi-to-swagger';
import { CreateAccountRequest, UpdateProfileByAdminRequest, UpdateProfileRequest } from '../validators/user.validator.js';

const { swagger: CreateAccountSchema } = JoiToSwagger(CreateAccountRequest);
const { swagger: UpdateProfileRequestSchema } = JoiToSwagger(UpdateProfileRequest);
const { swagger: UpdateProfileByAdminRequestSchema } = JoiToSwagger(UpdateProfileByAdminRequest);

const UserSchemas = {
    CreateAccountRequest: CreateAccountSchema,
    UpdateProfileRequest: UpdateProfileRequestSchema,
    UpdateProfileByAdminRequest: UpdateProfileByAdminRequestSchema,
};

export default UserSchemas;
