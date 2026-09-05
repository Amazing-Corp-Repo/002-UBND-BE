export const normalizeKhuPhoLabel = (value) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

export const aggregatePhanAnhByKhuPho = (records) => {
  const groups = new Map();

  for (const record of records || []) {
    const label = normalizeKhuPhoLabel(record?.khu_pho);
    if (!label) continue;

    const key = label.normalize("NFC").toLocaleLowerCase("vi-VN");
    const current = groups.get(key);
    groups.set(key, {
      khu_pho: current?.khu_pho || label,
      count: (current?.count || 0) + 1,
    });
  }

  return [...groups.values()].sort((a, b) =>
    a.khu_pho.localeCompare(b.khu_pho, "vi-VN", {
      numeric: true,
      sensitivity: "base",
    }),
  );
};
