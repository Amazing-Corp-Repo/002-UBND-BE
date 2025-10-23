import JoiToSwagger from 'joi-to-swagger';
import { CreateAccountRequest } from '../validators/user.validator.js';

const { swagger: CreateAccountSchema } = JoiToSwagger(CreateAccountRequest);

const UserSchemas = {
    CreateAccountRequest: CreateAccountSchema,
};

export default UserSchemas;
