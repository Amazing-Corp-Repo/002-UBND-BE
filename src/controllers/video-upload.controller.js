import { successResponse } from "../utils/response.util.js";
import VideoUploadService from "../services/video-upload.service.js";

const VideoUploadController = {
    async uploadVideo(req, res) {
        const file = req.files;
        const { idVideo, currentIndex, totalChunks } = req.body;
        let result = await VideoUploadService.handleUploadChunk(file, idVideo, currentIndex, totalChunks);
        return successResponse(res, null, result);
    },

    async getVideoUpload(req, res) {
        const { idVideo } = req.params;
        const videoUpload = await VideoUploadService.getVideoUploadById(idVideo);
        return successResponse(res, videoUpload, 'Lấy thông tin video upload thành công');
    }
};

export default VideoUploadController;