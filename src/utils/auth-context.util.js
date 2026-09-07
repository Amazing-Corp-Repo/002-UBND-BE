export function normalizeRoleNames(roles) {
  if (Array.isArray(roles)) {
    return roles.map((role) => String(role).trim()).filter(Boolean);
  }
  if (typeof roles === "string") {
    return roles.split(",").map((role) => role.trim()).filter(Boolean);
  }
  return [];
}

export function normalizePermissionCodes(permissions) {
  if (Array.isArray(permissions)) {
    return permissions.map((permission) => String(permission).trim()).filter(Boolean);
  }
  if (typeof permissions === "string") {
    return permissions.split(",").map((permission) => permission.trim()).filter(Boolean);
  }
  return [];
}

export function hasPermission(currentUser, permissionCode) {
  const roles = normalizeRoleNames(currentUser?.roles || currentUser?.role);
  if (roles.some((r) => r.toUpperCase() === "ADMIN" || r.toUpperCase() === "SUPER_ADMIN")) {
    return true;
  }
  return normalizePermissionCodes(currentUser?.permissions).includes(permissionCode);
}
