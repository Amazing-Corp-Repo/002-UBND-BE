import VideoUploadSchemas from "../schemas/video-upload.schema.js";

const VideoUploadSwagger = {
    '/api/video/upload': {
        post: {
            tags: ['Video Upload'],
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
    }
};

export default VideoUploadSwagger;