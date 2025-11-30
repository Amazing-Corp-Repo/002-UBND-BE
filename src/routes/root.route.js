import express from 'express';
import authRoute from './auth.route.js';
import userRoute from './user.route.js';
import mauDonRouter from './mau-don.route.js';
import uyBanRouter from './uy-ban.route.js';
import thuTucRoute from './thu-tuc.route.js';
import linhVucRoute from './linh-vuc.route.js';
import coSoDichVuCongRoute from './co-so-dich-vu-cong.route.js';
import tinTucRouter from './tin-tuc.route.js';
import danhMucTinTucRouter from './danh-muc-tin-tuc.route.js';
import lichTiepDanRouter from './lich-tiep-dan.route.js';
import linhVucPhanAnh from './linh-vuc-phan-anh.route.js';
import phanAnhRouter from './phan-anh.route.js';
import videoUploadRouter from './video-upload.route.js';
import logRouter from './log.route.js';
import reportRouter from './report.route.js';
import notificationRouter from './notification.route.js';
import permissionRouter from './permission.route.js';
import roleRouter from './role.route.js';

const rootRouter = express.Router();

rootRouter.use('/auths', authRoute);
rootRouter.use('/users', userRoute);
rootRouter.use('/mau-don', mauDonRouter);
rootRouter.use('/uy-ban', uyBanRouter);
rootRouter.use('/thu-tuc', thuTucRoute);
rootRouter.use('/linh-vuc', linhVucRoute);
rootRouter.use('/co-so-dich-vu-cong', coSoDichVuCongRoute);
rootRouter.use('/tin-tuc', tinTucRouter);
rootRouter.use('/danh-muc-tin-tuc', danhMucTinTucRouter);
rootRouter.use('/lich-tiep-dan', lichTiepDanRouter);
rootRouter.use('/linh-vuc-phan-anh', linhVucPhanAnh);
rootRouter.use('/phan-anh', phanAnhRouter);
rootRouter.use('/video', videoUploadRouter);
rootRouter.use('/logs', logRouter);
rootRouter.use('/report', reportRouter);
rootRouter.use('/permission', permissionRouter);
rootRouter.use('/role', roleRouter);
rootRouter.use('/report', reportRouter)
rootRouter.use('/notifications', notificationRouter)

export default rootRouter;

