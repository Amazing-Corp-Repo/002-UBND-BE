import AuthSwagger from '../swagger/auth.swagger.js';
import env from '../config/environment.config.js';
import UserSwagger from './user.swagger.js';
import MauDonSwagger from './mau-don.swagger.js';
import UyBanSwagger from './uy-ban.swagger.js';
import ThuTucSwagger from './thu-tuc.swagger.js';

const swaggerDocument = {

    openapi: '3.0.0',
    info: {
        title: `${env.APP_NAME} API Documentation`,
        version: '1.0.0',
    },

    // servers: [
    //     {
    //         url: 'http://localhost:8880',  // Địa chỉ API cho môi trường phát triển
    //         description: 'Local Development',
    //     },
    // ],

    paths: {
        ...AuthSwagger,
        ...UserSwagger,
        ...MauDonSwagger,
        ...UyBanSwagger,
        ...ThuTucSwagger,
    },

    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
};
export default swaggerDocument;

