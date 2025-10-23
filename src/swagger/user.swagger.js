import UserSchemas from "../schemas/user.schema.js";

const UserSwagger = {
    '/api/users/my-profile': {
        get: {
            tags: ['Users'],
            summary: 'Get my profile',
            description: 'Fetch the profile of the currently authenticated user',
            security: [{ bearerAuth: [] }],
            responses: {}
        },
    },
    '/api/users': {
        get: {
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            summary: 'Get all users with pagination',
            description: 'Retrieve a paginated list of all users. Requires page and size query parameters.',
            parameters: [
                {
                    name: 'page',
                    in: 'query',
                    required: true,
                    schema: { type: 'integer', minimum: 1 },
                    description: 'Page number for pagination'
                },
                {
                    name: 'size',
                    in: 'query',
                    required: true,
                    schema: { type: 'integer', minimum: 1 },
                    description: 'Number of users per page'
                }
            ],
            responses: {}
        }
    },
    '/api/users/create-account': {
        post: {
            tags: ['Users'],
            summary: 'Create a new user account use by admin',
            description: 'Create a new user account with the provided username and email. Accessible only by admin users.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: UserSchemas.CreateAccountRequest
                    }
                }
            },
            responses: {}
        }
    },
};

export default UserSwagger;