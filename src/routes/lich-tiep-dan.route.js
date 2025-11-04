import express from "express";
import LichTiepDanController from "../controllers/lich-tiep-dan.controller.js";
import { createUploader } from "../middlewares/upload.middleware.js";
import UPLOAD_TYPE from "../constants/upload.constant.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import ROLE from "../constants/role.constant.js";

const lichTiepDanRouter = express.Router();

lichTiepDanRouter.post('/import',
    authenticate,
    authorize([ROLE.ADMIN]),
    createUploader({
        type: UPLOAD_TYPE.LICH_TIEP_DAN,
        fieldName: 'file',
        maxCount: 1,
        maxSizeMB: 10,
    }),
    LichTiepDanController.importLichTiepDan
);

lichTiepDanRouter.get('/',
    LichTiepDanController.getLichTiepDan
);

lichTiepDanRouter.delete('/:id',
    authenticate,
    authorize([ROLE.ADMIN]),
    LichTiepDanController.deleteLichTiepDan
);

export default lichTiepDanRouter;