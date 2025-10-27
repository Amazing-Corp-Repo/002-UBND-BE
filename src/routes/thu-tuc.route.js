import express from 'express';
import ThuTucController from '../controllers/thu-tuc.controller.js'
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import ROLE from '../constants/role.constant.js';
import validate from '../middlewares/validate.middleware.js';
import { CreateThuTucRequest, UpdateThuTucRequest } from '../validators/thu-tuc.validator.js';

const thuTucRoute = express.Router();

thuTucRoute.get(
    '/:id',
    ThuTucController.getThuTucById
);

thuTucRoute.get(
    "",
    ThuTucController.getAll
);

thuTucRoute.post("",
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(CreateThuTucRequest),
    ThuTucController.createThuTuc
);

thuTucRoute.delete("/:id",
    authenticate,
    authorize([ROLE.ADMIN]),
    ThuTucController.hardDeleteThuTuc
);

thuTucRoute.put("/:id",
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(UpdateThuTucRequest),
    ThuTucController.updateThuTuc
);

thuTucRoute.get('/:id/mau-don', ThuTucController.getMauDonByThuTucId);

export default thuTucRoute;