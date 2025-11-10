import crypto from 'crypto';

export const toSnakeCaseNonAccent = (str) => {
    if (!str) return "";

    let result = str.toLowerCase().trim();

    result = result
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    result = result
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

    result = result.replace(/_+/g, "_");

    return result;
}

export const capitalizeWords = (str) => {
    if (!str) return '';
    return str
        .trim()
        .toLowerCase()
        .split(' ')
        .filter(Boolean) // loại bỏ khoảng trắng thừa
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export const appendDeleteSuffixc = (str) => {
    if (typeof str !== 'string') {
        return str;
    }

    return `${new Date().getTime()}_delete_${str}`;
}

export const generateUniqueCode = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const alphabetLength = alphabet.length;
    const size = 8;

    const randomBytes = crypto.randomBytes(size);
    let result = '';

    for (let i = 0; i < size; i++) {
        const index = randomBytes[i] % alphabetLength;
        result += alphabet[index];
    }

    return result;
}