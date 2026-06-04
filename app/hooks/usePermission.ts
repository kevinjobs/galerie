import { useAtom } from "jotai";
import { userAtom } from "@/app/store";
import { resolvePermissions, ROLES, type Role } from "@/prisma/lib/roles";
import { useMemo } from "react";

export function usePermission() {
  const [user] = useAtom(userAtom);

  const effectivePermissions = useMemo(() => {
    if (!user) return [];
    return resolvePermissions(user.role, user.permissions);
  }, [user]);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.isSuperuser) return true;
    return effectivePermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.isSuperuser) return true;
    return permissions.some((p) => effectivePermissions.includes(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.isSuperuser) return true;
    return permissions.every((p) => effectivePermissions.includes(p));
  };

  return {
    user,
    role: user?.role as Role | undefined,
    isSuperuser: user?.isSuperuser ?? false,
    isAuthenticated: !!user,
    effectivePermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    ROLES,
  };
}
