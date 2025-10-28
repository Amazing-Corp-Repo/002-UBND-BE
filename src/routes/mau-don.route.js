import express from "express";
import MauDonController from "../controllers/mau-don.controller.js";
import { createUploader } from '../middlewares/upload.middleware.js';
import UPLOAD_TYPE from '../constants/upload.constant.js';
import ROLE from '../constants/role.constant.js';
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const mauDonRouter = express.Router();

mauDonRouter.post("/",
    authenticate,
    authorize([ROLE.ADMIN]),
    createUploader({
        type: UPLOAD_TYPE.MAU_DON,
        fieldName: "file",
        maxCount: 1,
        maxSizeMB: 10,
    }),
    MauDonController.createMauDon
);

mauDonRouter.put("/:id",
    authenticate,
    authorize([ROLE.ADMIN]),
    createUploader({
        type: UPLOAD_TYPE.MAU_DON,
        fieldName: "file",
        maxCount: 1,
        maxSizeMB: 10,
    }),
    MauDonController.updateMauDon
);

mauDonRouter.get("/",
    authenticate,
    MauDonController.getAllMauDon
);

mauDonRouter.delete("/:id",
    authenticate,
    authorize([ROLE.ADMIN]),
    MauDonController.deleteMauDon
);


export default mauDonRouter;