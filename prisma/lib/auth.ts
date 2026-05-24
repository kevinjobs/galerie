import jwt from "jsonwebtoken";
import { PermissionError } from "./errors";

export interface UserInfo {
  id: number;
  uid: string;
  name: string;
  email: string;
  permissions?: string[];
}

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

  static hasPermission(token: string | null | undefined, allow: string): boolean {
    if (!token) throw new Error("Unauthorized");
    const decoded = AuthTool.verify(token);
    const { permissions } = decoded;
    return permissions?.includes(allow) ?? false;
  }

  static checkPermission(bearer: string | null | undefined, permission: string): void {
    if (!bearer) throw new PermissionError("No Token Provided");

    const token = bearer.replace("Bearer ", "");
    const decoded = AuthTool.verify(token);

    const { permissions } = decoded;

    if (!permissions || !permissions.includes(permission)) {
      throw new PermissionError(`Permission denied: 缺少 ${permission} 权限`);
    }
  }

  static generateCode(): string {
    const code = Math.floor(Math.random() * 1000000).toString();
    return code.padStart(6, "0");
  }
}