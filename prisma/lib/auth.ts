import jwt from "jsonwebtoken";
import crypto from "crypto";
import { PermissionError } from "./errors";
import { resolvePermissions, ROLES } from "./roles";

export interface UserInfo {
  id: number;
  uid: string;
  name: string;
  email: string;
  role: string;
  isSuperuser: boolean;
  permissions?: string[];
}

export const JWT_ONLY_PERMISSIONS: string[] = [
  "user.get",
  "user.create",
  "user.update",
  "user.delete",
];

function getJwtSecret(): string {
  const key = process.env.JWT_SECRET;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required in production");
    }
    console.warn("WARNING: JWT_SECRET not set, using insecure default key. Set JWT_SECRET in production!");
    return "insecure-dev-secret-key-change-in-production";
  }
  return key;
}

export abstract class AuthTool {
  static sign(payload: object): string {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d", algorithm: "HS256" });
  }

  static verify(token: string): UserInfo {
    try {
      return jwt.verify(token, getJwtSecret()) as UserInfo;
    } catch {
      throw new PermissionError("无效的 Token");
    }
  }

  static decode(token: string): UserInfo | null {
    try {
      return jwt.decode(token) as UserInfo;
    } catch {
      return null;
    }
  }

  static async checkPermission(bearer: string | null | undefined, permission: string): Promise<void> {
    if (!bearer) throw new PermissionError("No Token Provided");

    const token = bearer.replace(/^Bearer\s+/i, "").trim();

    // Try JWT first
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as UserInfo;
      const effectivePermissions = resolvePermissions(decoded.role, decoded.permissions);
      if (!effectivePermissions.includes(permission)) {
        throw new PermissionError(`Permission denied: 缺少 ${permission} 权限`);
      }
      return;
    } catch (e) {
      if (e instanceof jwt.JsonWebTokenError || e instanceof jwt.TokenExpiredError) {
        const { ApiTokenService } = await import("./apiTokenService");
        const ok = await ApiTokenService.checkPermission(token, permission);
        if (!ok) throw new PermissionError(`Permission denied: 缺少 ${permission} 权限`);
        return;
      }
      throw e;
    }
  }

  static async getUserFromBearer(bearer: string | null | undefined): Promise<UserInfo | null> {
    if (!bearer) return null;

    const token = bearer.replace(/^Bearer\s+/i, "").trim();

    try {
      return jwt.verify(token, getJwtSecret()) as UserInfo;
    } catch (e) {
      if (e instanceof jwt.JsonWebTokenError || e instanceof jwt.TokenExpiredError) {
        const { ApiTokenService } = await import("./apiTokenService");
        return ApiTokenService.getUserFromApiToken(token);
      }
      return null;
    }
  }

  static generateCode(): string {
    const code = crypto.randomInt(0, 1000000);
    return code.toString().padStart(6, "0");
  }
}
