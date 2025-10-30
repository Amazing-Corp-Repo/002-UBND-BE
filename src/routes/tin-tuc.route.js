import TinTucController from "../controllers/tin-tuc.controller.js";
import { createUploader } from '../middlewares/upload.middleware.js';
import UPLOAD_TYPE from '../constants/upload.constant.js';
import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import ROLE from "../constants/role.constant.js";
import validate from '../middlewares/validate.middleware.js';
import { CreateTinTucRequest, UpdateTinTucRequest, UploadFileDinhKemRequest } from "../validators/tin-tuc.validator.js";

const tinTucRouter = express.Router();

tinTucRouter.post("/upload",
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(UploadFileDinhKemRequest),
    createUploader({
        type: UPLOAD_TYPE.TIN_TUC,
        fieldName: "file",
        maxCount: 1,
        maxSizeMB: 10,
    }),
    TinTucController.uploadFile
);

tinTucRouter.put("/:id",
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(UpdateTinTucRequest),
    createUploader({
        type: UPLOAD_TYPE.TIN_TUC,
        fieldName: "file",
        maxCount: 1,
        maxSizeMB: 10,
    }),
    TinTucController.updateTinTuc
);


tinTucRouter.get("/:id",
    TinTucController.getDetails
);

tinTucRouter.get("/",
    TinTucController.getAll
);

tinTucRouter.delete("/:id",
    authenticate,
    authorize([ROLE.ADMIN]),
    TinTucController.delete
);

tinTucRouter.post("/",
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(CreateTinTucRequest),
    createUploader({
        type: UPLOAD_TYPE.TIN_TUC,
        fieldName: "file",
        maxCount: 1,
        maxSizeMB: 10,
    }),
    TinTucController.create
);

export default tinTucRouter;