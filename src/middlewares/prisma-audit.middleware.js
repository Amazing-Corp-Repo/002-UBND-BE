export const withAudit = async (actionFn, currentUserId) => {
    const now = new Date().toISOString();

    return actionFn({
        ngay_cap_nhap: now,
        nguoi_cap_nhap: currentUserId,
    });
};
