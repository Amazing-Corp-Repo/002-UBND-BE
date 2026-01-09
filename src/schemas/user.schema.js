import JoiToSwagger from 'joi-to-swagger';
import { CreateAccountRequest, UpdateFcmTokenRequest, UpdateFirstLoginRequest, UpdateProfileByAdminRequest, UpdateProfileRequest, UpdateStatusByAdminRequest } from '../validators/user.validator.js';

const { swagger: CreateAccountSchema } = JoiToSwagger(CreateAccountRequest);
const { swagger: UpdateProfileRequestSchema } = JoiToSwagger(UpdateProfileRequest);
const { swagger: UpdateProfileByAdminRequestSchema } = JoiToSwagger(UpdateProfileByAdminRequest);
const { swagger: UpdateStatusByAdminRequestSchema } = JoiToSwagger(UpdateStatusByAdminRequest);
const { swagger: UpdateFcmTokenRequestSchema } = JoiToSwagger(UpdateFcmTokenRequest);
const { swagger: UpdateFirstLoginRequestSchema } = JoiToSwagger(UpdateFirstLoginRequest);

const UserSchemas = {
    CreateAccountRequest: CreateAccountSchema,
    UpdateProfileRequest: UpdateProfileRequestSchema,
    UpdateProfileByAdminRequest: UpdateProfileByAdminRequestSchema,
    UpdateStatusByAdminRequest: UpdateStatusByAdminRequestSchema,
    UpdateFcmTokenRequest: UpdateFcmTokenRequestSchema,
    UpdateFirstLoginRequest: UpdateFirstLoginRequestSchema,
};

export default UserSchemas;
