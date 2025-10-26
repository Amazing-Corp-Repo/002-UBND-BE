// src/routes/thu-tuc.route.js
import express from 'express';
import validate from '../middlewares/validate.middleware.js';
import ThuTucController from '../controllers/thu-tuc.controller.js';
import { GetThuTucQuerySchema, ThuTucIdParamSchema } from '../validators/thu-tuc.validator.js'; 


const router = express.Router();

router.get(
    '',  
    validate(GetThuTucQuerySchema, 'query'),
    ThuTucController.getAllThuTuc
);

router.get(
    '/:id',
    validate(ThuTucIdParamSchema, 'params'), // Validate ID trong URL params
    ThuTucController.getThuTucById
);

router.get(
    '/:id/details',
    validate(ThuTucIdParamSchema, 'params'), // Validate ID trong URL params
    ThuTucController.getFullThuTucDetails
);

export default router;