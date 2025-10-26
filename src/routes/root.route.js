import express from 'express';
import authRoute from './auth.route.js';
import userRoute from './user.route.js';
import mauDonRouter from './mau-don.route.js';
import uyBanRouter from './uy-ban.route.js';
import thuTucRoute from './thu-tuc.route.js';

const rootRouter = express.Router();

rootRouter.use('/auths', authRoute);
rootRouter.use('/users', userRoute);
rootRouter.use('/mau-don', mauDonRouter);
rootRouter.use('/uy-ban', uyBanRouter);
rootRouter.use('/thu-tuc', thuTucRoute);

export default rootRouter;

