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

    return `${generateUniqueCode()}_${str}`;
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

export const parseStringToArray = (str) => {
    if (!str) return [];

    str = String(str).trim();

    if (!str) return [];

    if (str.includes(",")) {
        return str
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);
    }

    return [str];
}

export const nowVN = () => {
    const utc = new Date().toISOString();
    const date = new Date(utc);

    // cộng 7 giờ để thành giờ VN
    date.setHours(date.getHours() + 7);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
}

export const toUTCFromVN_Start = (dateStr) => {
    if (!dateStr) return null;

    const [year, month, day] = dateStr.split("-").map(Number);

    const d = new Date(Date.UTC(year, month - 1, day, -7, 0, 0));

    return d.toISOString();
};

export const toUTCFromVN_End = (dateStr) => {
    if (!dateStr) return null;

    const [year, month, day] = dateStr.split("-").map(Number);

    const d = new Date(Date.UTC(year, month - 1, day, 16, 59, 59));

    return d.toISOString();
};
