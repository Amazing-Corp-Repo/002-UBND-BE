import express from 'express';
import authRoute from './auth.route.js';
import userRoute from './user.route.js';
import fileRoute from './file.route.js';
import thuTucRoute from './thu-tuc.route.js';

const rootRouter = express.Router();

rootRouter.use('/auths', authRoute);
rootRouter.use('/users', userRoute);
rootRouter.use('/files', fileRoute);
rootRouter.use('/thu-tuc', thuTucRoute);

export default rootRouter;

