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
