import crypto from 'crypto';

export const sha256 = (str) => {
    return crypto.createHash('sha256').update(str).digest('hex');
}
