import UPLOAD_TYPE from "../constants/upload-type.constant.js";

const UploadFileSwagger = {
    '/api/files/upload': {
        post: {
            tags: ['File'],
            summary: '',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'type',
                    in: 'query',
                    required: true,
                    schema: {
                        type: "string",
                        enum: [UPLOAD_TYPE.AVATAR],
                    },
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: {
                                file: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        format: 'binary'
                                    },
                                    description: 'Mảng file hình ảnh để upload'
                                }
                            },
                            required: ['file']
                        }
                    }
                }
            },
            responses: {}
        }
    }
}

export default UploadFileSwagger;