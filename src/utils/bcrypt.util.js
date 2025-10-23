import bcrypt from 'bcrypt';

export const hash = async (plain) => {
    return bcrypt.hash(plain, 10);
};

export const compare = async (plain, hashed) => {
    return bcrypt.compare(plain, hashed);
};