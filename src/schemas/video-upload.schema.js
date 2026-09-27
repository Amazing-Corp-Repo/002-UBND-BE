import { addFileToJoiSchema } from "../utils/swagger.util.js";
import JoiToSwagger from 'joi-to-swagger';
import { VideoUploadRequest } from "../validators/video-upload.validator.js";

const VideoUploadSchemas = {
    UploadVideoRequest: addFileToJoiSchema(VideoUploadRequest, {
        fieldName: "file",
        maxCount: 1,
        description: "Phần video được tải lên từng phần. Tổng dung lượng video tối đa 300 MB; mỗi request nhận một chunk.",
    }),
};

export default VideoUploadSchemas;
