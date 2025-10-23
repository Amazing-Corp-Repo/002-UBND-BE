import OTP_TYPE from '../constants/otp.constants.js';
import AuthSchemas from '../schemas/auth.schema.js';

const AuthSwagger = {
    '/api/auths/login': {
        post: {
            tags: ['Auths'],
            summary: 'User login',
            description: 'Login with username/passwor',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: AuthSchemas.LoginRequest,
                    }
                }
            },
            responses: {}
        }
    },
    '/api/auths/refresh-token': {
        put: {
            tags: ['Auths'],
            summary: 'Refresh access token',
            description: 'Refresh access token using a valid refresh token',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: AuthSchemas.RefreshTokenRequest,
                    }
                }
            },
            responses: {}
        }
    },
    '/api/auths/logout': {
        post: {
            tags: ['Auths'],
            summary: 'User logout',
            description: 'Logout user by invalidating the refresh token',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: AuthSchemas.LogoutRequest,
                    }
                }
            },
            responses: {}
        }
    },
    '/api/auths/change-password': {
        put: {
            tags: ['Auths'],
            security: [{ bearerAuth: [] }],
            summary: 'Change user password',
            description: 'Change the password of the authenticated user',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: AuthSchemas.ChangePasswordRequest,
                    }
                }
            },
            responses: {}
        }
    },
    '/api/auths/enable-or-disable-2fa': {
        post: {
            tags: ['Auths'],
            security: [{ bearerAuth: [] }],
            summary: 'Enable or disable two-factor authentication (2FA)',
            description: 'Toggle the 2FA setting for the authenticated user',
            responses: {}
        }
    },
    '/api/auths/verify-2fa': {
        post: {
            tags: ['Auths'],
            summary: 'Verify Two-Factor Authentication (2FA)',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: AuthSchemas.VerifyTwoFactorAuthRequest,
                    }
                }
            },
            responses: {}
        }
    },
    '/api/auths/send-otp': {
        post: {
            tags: ['Auths'],
            summary: 'Send OTP to email',
            parameters: [
                {
                    name: 'type',
                    in: 'query',
                    required: true,
                    schema: {
                        type: 'string',
                        enum: [OTP_TYPE.RESET_PASSWORD],
                    },
                    description: 'Type of OTP to send',
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: AuthSchemas.SendOTPRequest,
                    }
                }
            },
            responses: {}
        }
    },
    '/api/auths/reset-password': {
        put: {
            tags: ['Auths'],
            summary: 'Reset user password using OTP',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: AuthSchemas.ResetPasswordRequest,
                    }
                }
            },
            responses: {}
        }
    },
    '/api/auths/verify-enable-or-disable-2fa': {
        post: {
            tags: ['Auths'],
            security: [{ bearerAuth: [] }],
            summary: 'Verify enabling or disabling two-factor authentication (2FA)',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: AuthSchemas.VerifyEnableOrDisable2FARequest,
                    }
                }
            },
            responses: {}
        }
    },
};

export default AuthSwagger;