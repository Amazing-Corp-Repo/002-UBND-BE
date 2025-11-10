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
    FIREBASE_FIREBASE_TYPE: process.env.FIREBASE_FIREBASE_TYPE || 'service_account',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'my-app-test-62f4e',
    FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID || '70b67af77693490cb705815a00fbfaa59a79351c',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCfpWDUuIuXbGPA\ns0VtsT+Mr5fG4O8QJgZhxaEzx98/iSgTzfcM5CRNoCYh0IKsiVHmdFOVZTYW2kAT\nEqHBfsYW2T3+0ce/kKslUR1VcFYYo20oQJMNy5ytgn9XjZlBhhyuN81qCHoblS+E\ncjq74Xyb2+OkONc+q3WlB0JZPmQQ9JbNJSfGSb0aXqRdEi1uii2br0AkQt4sQX/E\n6ApVXSD9Nytsj3cQYzrdPBaXWGgbMhnLDE7rB0jGBRB1zY/3IqUfnt4DKL++B8H2\nZfeAOAtRAxaYhjnSKjEp/e7V2OKNcQbLKGicdw02MABEZ8UGQx9JxRGMUNELV4Jf\nyWjMIuDNAgMBAAECggEAJKra4TDb2vUpui5SwX2G/5yrCyJJtldNevJl8pszIwgx\nHM9fMWZLEks4xuZ5xQArP/ey5OrgsAID2n2ainNAMypFa3wqWUz0ijcluiR5meIb\nZbXjMLV18II7FlRvAVY4yykE9Jgq15/90HleFR4WvUOVdvgZNAs0k6llq1LBsATo\nKW4kGLL8R99tu0CaYIVow2NaoZPTrLBUY+g1tBc9c+A2mKQR30bVPLKlMFGpH1kZ\ny0FSf4pjtLBmAEp8QT5vOhHKADQiUX9NdAfScSVZCwSSgCaLKno/Jqw0C78tLrEq\nfTyCGpYP/2eUBFi53hHz4GmvwpQSwX8uLxMB0p/wbwKBgQDgVZYIhNTaD1mCOTKq\nWjRgdaOnqaLQyP+9RUBujKq09yE/jAWwgOkL1RLkNH9Z62q0WJVbKj9Ao38yATxb\n9aNVjCDWJKDmIjW6Hu8uRGu/S4epczUCl4X2HmIqWDpdY67jD83Hv1oWbRoxZHJc\nE/BXBZrbPry+qeqMIONLXTOEiwKBgQC2LkDNwpuAf2EdXdYUUXzr5Hjmcwyaxr11\nuXF7PoPQKxlOaRPDSgicG03xU273QsfT2ffYUHoEDUMhNIS+oI2qVa35AVEExUPI\nozAYqn4aeTAx5/aWeioo4hItEYbL4Yxx6CafjXUVyBSaGC4brZeRjnwqpg1pfW3R\nU85QsvnjBwKBgCjYzJm+ffc6hkTE32nPROwvX14e8Ctt/crbujCm4kpTGTW17C9I\nOabS5D6zJGEeEW7HFmLkHWJKotVbDj98SYJBIpV7U+SzY+8AxPI6uRe6y/fZp1RS\nfKzkuWEWcYIhrW1gqkptmByvPu6xaHVFmCRwO9Mh6EIbND7RmjFVxhSjAoGAPqEU\nAih+0OP5fOD/cai561Z2AbNXh/X+t/PygU3yfqPyZTRWaPKQlyoD14y5PyOkEr6C\nJ8kyySXOCCJH6EjFquMdldbQBXXTYaxIIpKqG2vCF8YIzZ5d1AQz/25hCsIVSCto\n67zznXNVMcxSPY2l55I2OWswfS1zjVzkNnXw1g0CgYACHYR+jz5Sd3lKGaBEPxrl\n1hNsDgZ8muzmTaap65ptzT2PtSkEDBcDMAkUeg9O9sFYh/eLzRzRnoEP1gtdnTXR\neS6OHr3UZqMiPRlvxHZH496IU0hwoEpGWE6b7vBf4JKvLpDrFvsJ0K98LTfl0H9d\njp6lfuE4geP+a9vJxCS6rQ==\n-----END PRIVATE KEY-----\n',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@my-app-test-62f4e.iam.gserviceaccount.com',
    FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID || '111740776077304382386',
    FIREBASE_AUTH_URI: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth' ,
    FIREBASE_TOKEN_URI: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
    FIREBASE_CLIENT_X509_CERT_URL: process.env.FIREBASE_CLIENT_X509_CERT_URL || 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40my-app-test-62f4e.iam.gserviceaccount.com',
    FIREBASE_UNIVERSE_DOMAIN: process.env.FIREBASE_UNIVERSE_DOMAIN || 'googleapis.com',
}

export default env;
