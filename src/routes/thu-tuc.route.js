import express from 'express';
import ThuTucController from '../controllers/thu-tuc.controller.js'

const thuTucRouter = express.Router();

thuTucRouter.get(
    '',  
    ThuTucController.getAllThuTuc
);

thuTucRouter.get(
    '/:id',
    ThuTucController.getThuTucBasicDetails
);

thuTucRouter.get(
    '/:id/details',
    ThuTucController.getFullThuTucDetails
);

export default thuTucRouter;