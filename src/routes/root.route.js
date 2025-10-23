import express from 'express';
import authRoute from './auth.route.js';
import userRoute from './user.route.js';
import fileRoute from './file.route.js';

const rootRouter = express.Router();

rootRouter.use('/auths', authRoute);
rootRouter.use('/users', userRoute);
rootRouter.use('/files', fileRoute);

export default rootRouter;

