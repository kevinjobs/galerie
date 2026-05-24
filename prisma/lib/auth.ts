import jwt from "jsonwebtoken";
import { PermissionError } from "./errors";

export interface UserInfo {
  id: number;
  uid: string;
  name: string;
  email: string;
  permissions?: string[];
}

export abstract class AuthTool {
  static sign(payload: object): string {
    const key = process.env.JWT_SECRET || "default-secret-key-change-in-production";
    return jwt.sign(payload, key, { expiresIn: "7d", algorithm: "HS256" });
  }

  static verify(token: string): UserInfo {
    const key = process.env.JWT_SECRET || "default-secret-key-change-in-production";
    try {
      return jwt.verify(token, key) as UserInfo;
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