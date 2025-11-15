import VideoUploadSchemas from "../schemas/video-upload.schema.js";

const VideoUploadSwagger = {
    '/api/video/upload': {
        post: {
            tags: ['VideoUpload'],
            description: 'API for uploading videos related to citizen feedback',
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: VideoUploadSchemas.UploadVideoRequest,
                    },
                },
            },
            responses: {}
        }
    },

    '/api/video/{idVideo}': {
        get: {
            tags: ['VideoUpload'],
            description: 'API to get video upload details by ID',
            parameters: [
                {
                    name: 'idVideo',
                    in: 'path',
                    required: true,
                    schema: { type: 'string' },
                    description: 'Unique identifier for the video upload'
                }
            ],
            responses: {}
        }
    }
};

export default VideoUploadSwagger;