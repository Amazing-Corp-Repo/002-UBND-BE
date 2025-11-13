import JoiToSwagger from 'joi-to-swagger';
import { CreateAccountRequest, UpdateFcmTokenRequest, UpdateProfileByAdminRequest, UpdateProfileRequest, UpdateStatusByAdminRequest } from '../validators/user.validator.js';

const { swagger: CreateAccountSchema } = JoiToSwagger(CreateAccountRequest);
const { swagger: UpdateProfileRequestSchema } = JoiToSwagger(UpdateProfileRequest);
const { swagger: UpdateProfileByAdminRequestSchema } = JoiToSwagger(UpdateProfileByAdminRequest);
const { swagger: UpdateStatusByAdminRequestSchema } = JoiToSwagger(UpdateStatusByAdminRequest);
const { swagger: UpdateFcmTokenRequestSchema } = JoiToSwagger(UpdateFcmTokenRequest);

const UserSchemas = {
    CreateAccountRequest: CreateAccountSchema,
    UpdateProfileRequest: UpdateProfileRequestSchema,
    UpdateProfileByAdminRequest: UpdateProfileByAdminRequestSchema,
    UpdateStatusByAdminRequest: UpdateStatusByAdminRequestSchema,
    UpdateFcmTokenRequest: UpdateFcmTokenRequestSchema
};

export default UserSchemas;
