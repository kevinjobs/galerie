export const ROLES = {
  ADMIN: "admin",
  CONTRIBUTOR: "contributor",
  VIEWER: "viewer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "管理员",
  contributor: "贡献者",
  viewer: "观察者",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "全权管理：用户管理 + 所有照片管理",
  contributor: "照片管理：创建、查看、编辑自己的照片，删除自己上传的照片",
  viewer: "只读：仅可查看后台照片信息",
};

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    "photo.create",
    "photo.get",
    "photo.update",
    "photo.delete",
    "photo.upload",
    "user.create",
    "user.get",
    "user.update",
    "user.delete",
  ],
  contributor: [
    "photo.create",
    "photo.get",
    "photo.update",
    "photo.delete",
    "photo.upload",
  ],
  viewer: ["photo.get"],
};

export const ALL_PERMISSIONS = ROLE_PERMISSIONS.admin;

export function isValidRole(role: string): role is Role {
  return role in ROLE_PERMISSIONS;
}

/**
 * Resolve the effective permission set for a user based on role + optional extra permissions.
 */
export function resolvePermissions(
  role: string,
  extraPermissions?: string[],
): string[] {
  const base = ROLE_PERMISSIONS[role as Role] ?? [];
  if (!extraPermissions?.length) return [...base];
  return [...new Set([...base, ...extraPermissions])];
}

export interface UserContext {
  id: number;
  role: string;
  isSuperuser?: boolean;
  permissions?: string[];
}

export interface PhotoContext {
  userId?: number | null;
}

/**
 * Check whether a user can perform the given action on a specific photo.
 * @param action - "update" or "delete"
 */
export function canModifyPhoto(
  user: UserContext,
  photo: PhotoContext,
  action: "update" | "delete" = "update",
): boolean {
  if (user.isSuperuser || user.role === ROLES.ADMIN) {
    return true;
  }

  const effectivePermissions = resolvePermissions(user.role, user.permissions);

  // contributor can delete own photos
  if (action === "delete" && user.role === ROLES.CONTRIBUTOR) {
    return photo.userId != null && photo.userId === user.id;
  }

  if (!effectivePermissions.includes(`photo.${action}`)) {
    return false;
  }

  // contributor can only modify own photos
  if (user.role === ROLES.CONTRIBUTOR) {
    return photo.userId != null && photo.userId === user.id;
  }

  return false;
}
