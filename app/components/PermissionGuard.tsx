"use client";
import { usePermission } from "@/app/hooks/usePermission";
import { ReactNode } from "react";

interface PermissionGuardProps {
  permission?: string | string[];
  role?: string | string[];
  mode?: "hide" | "disable";
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({
  permission,
  role,
  mode = "hide",
  fallback,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, user } = usePermission();

  // Check role requirement
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!user || !roles.includes(user.role)) {
      if (mode === "disable") {
        return <div className="opacity-50 pointer-events-none">{children}</div>;
      }
      return fallback ? <>{fallback}</> : null;
    }
  }

  // Check permission requirement
  if (permission) {
    const perms = Array.isArray(permission) ? permission : [permission];
    if (!hasAnyPermission(perms)) {
      if (mode === "disable") {
        return <div className="opacity-50 pointer-events-none">{children}</div>;
      }
      return fallback ? <>{fallback}</> : null;
    }
  }

  return <>{children}</>;
}
