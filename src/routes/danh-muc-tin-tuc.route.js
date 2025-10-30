import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import ROLE from "../constants/role.constant.js";
import DanhMucTinTucController from "../controllers/danh-muc-tin-tuc.controller.js";
import { CreateDanhMucTinTucRequest, UpdateDanhMucTinTucRequest } from "../validators/danh-muc-tin-tuc.validator.js";
import validate from '../middlewares/validate.middleware.js';


const danhMucTinTucRouter = express.Router();

danhMucTinTucRouter.post("", 
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(CreateDanhMucTinTucRequest),
    DanhMucTinTucController.create
);

danhMucTinTucRouter.put("/:id", 
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(UpdateDanhMucTinTucRequest),
    DanhMucTinTucController.update
);

danhMucTinTucRouter.delete("/:id", 
    authenticate,
    authorize([ROLE.ADMIN]),
    DanhMucTinTucController.delete
);

danhMucTinTucRouter.get("", 
    DanhMucTinTucController.findAll
);

danhMucTinTucRouter.get("/:id", 
    DanhMucTinTucController.findById
);

export default danhMucTinTucRouter;