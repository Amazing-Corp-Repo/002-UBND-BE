import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import uploadFile from '../middlewares/upload.middlware.js';
import FileController from '../controllers/file.controller.js';

const fileRoute = express.Router();

fileRoute.post('/upload', authenticate, uploadFile, FileController.uploadFiles);

export default fileRoute;