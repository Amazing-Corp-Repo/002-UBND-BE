export function normalizeRoleNames(roles) {
  if (Array.isArray(roles)) {
    return roles.map((role) => String(role).trim()).filter(Boolean);
  }
  if (typeof roles === "string") {
    return roles.split(",").map((role) => role.trim()).filter(Boolean);
  }
  return [];
}
