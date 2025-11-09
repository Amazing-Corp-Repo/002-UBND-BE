import 'dotenv/config';

const env = {
    // Thêm giá trị mặc định để tránh undefined khi thiếu .env
    PORT: process.env.PORT || 8880,
    CORS_ORIGIN: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : ['*'],
    PREFIX_API: process.env.PREFIX_API || '/api',
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
    APP_NAME: process.env.APP_NAME,
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASS: process.env.MAIL_PASS,
    OTP_EXPIRE_MINUTES: process.env.OTP_EXPIRE_MINUTES,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    SWAGGER_USERNAME: process.env.SWAGGER_USERNAME,
    SWAGGER_PASSWORD: process.env.SWAGGER_PASSWORD,
    DATABASE_URL: process.env.DATABASE_URL,
    RABBITMQ_URL: process.env.RABBITMQ_URL,
    queues : {
        videoMerge: process.env.RABBITMQ_QUEUE_VIDEO_MERGE,
        videoHLS: process.env.RABBITMQ_QUEUE_VIDEO_HLS,
    },
}

export default env;
