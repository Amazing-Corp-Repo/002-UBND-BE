import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import UserController from '../controllers/user.controller.js';
import ROLE from '../constants/role.constant.js';
import validate from '../middlewares/validate.middleware.js';
import { CreateAccountRequest } from '../validators/user.validator.js';


const userRoute = express.Router();

userRoute.get('/my-profile', authenticate, UserController.getMyProfile);
userRoute.get('', authenticate, UserController.getAllUsers);
userRoute.post('/create-account', authenticate, authorize([ROLE.ADMIN]), validate(CreateAccountRequest), UserController.createAccount);
userRoute.put('', authenticate, UserController.updateProfile);

export default userRoute;