import MauDonSchemas from "../schemas/mau-don.schema.js";

const MauDonSwagger = {
    '/api/mau-don': {
        post: {
            tags: ['MauDon'],
            summary: 'Create Mau Don',
            security: [{ bearerAuth: [] }],
            description: 'Create a new Mau Don record',
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: MauDonSchemas.CreateMauDonRequest,
                    }
                }
            },
            responses: {}
        },
        get: {
            tags: ['MauDon'],
            security: [{ bearerAuth: [] }],
            summary: 'Get All Mau Don',
            description: 'Retrieve all Mau Don records, optionally filtered by removal status',
            parameters: [
                {
                    name: 'isRemoved',
                    in: 'query',
                    required: false,
                    schema: { type: 'boolean' },
                    description: 'Filter by removal status (true or false)',
                }
            ],
            responses: {}
        }
    },
    '/api/mau-don/{id}': {
        put: {
            tags: ['MauDon'],
            summary: 'Update Mau Don',
            security: [{ bearerAuth: [] }],
            description: 'Update an existing Mau Don record by ID',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string' },
                    description: 'ID of the Mau Don to update',
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: MauDonSchemas.UpdateMauDonRequest,
                    }
                }
            },
            responses: {}
        },
        delete: {
            tags: ['MauDon'],
            summary: 'Delete Mau Don',
            security: [{ bearerAuth: [] }],
            description: 'Delete a Mau Don record by ID',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string' },
                    description: 'ID of the Mau Don to delete',
                }
            ],
            responses: {}
        }
    }
};
export default MauDonSwagger;