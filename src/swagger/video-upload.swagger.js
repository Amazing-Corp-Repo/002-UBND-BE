import VideoUploadSchemas from "../schemas/video-upload.schema.js";

const VideoUploadSwagger = {
    '/api/video/upload': {
        post: {
            tags: ['VideoUpload'],
            summary: 'Tải video phản ánh',
            description: 'Tải video phản ánh theo từng chunk. Tổng dung lượng mỗi video tối đa 300 MB; mỗi request chỉ nhận một chunk video MP4, MOV, AVI hoặc MKV.',
            security: [ { bearerAuth: [] } ],
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
            summary: 'Lấy thông tin video đã tải',
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
