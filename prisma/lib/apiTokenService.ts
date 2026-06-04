import { db } from "./db";
import crypto from "crypto";
import { ApiToken, Prisma } from "@prisma/client";
import { AuthTool, UserInfo } from "./auth";

const SENSITIVE_PERMISSIONS = ["user.get", "user.create", "user.update", "user.delete"];

export interface ApiTokenCreateInput {
  name: string;
  permissions: string[];
  expiresAt?: Date | null;
  userPermissions: string[];
  userId: number;
}

export interface ApiTokenListOutput {
  uid: string;
  name: string;
  permissions: string[];
  expiresAt: Date | null;
  createdAt: Date;
  lastUsedAt: Date | null;
}

function hashToken(token: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(token, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export abstract class ApiTokenService {
  static async create(input: ApiTokenCreateInput): Promise<{ token: string; uid: string; name: string; expiresAt: Date | null }> {
    const { name, permissions, expiresAt, userPermissions } = input;

    for (const perm of permissions) {
      if (SENSITIVE_PERMISSIONS.includes(perm)) {
        throw new Error(`权限 "${perm}" 仅限 JWT 使用，不能用于 API Token`);
      }
      if (!userPermissions.includes(perm)) {
        throw new Error(`权限 "${perm}" 超出了当前用户的权限范围`);
      }
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = await hashToken(token);

    const apiToken = await db.apiToken.create({
      data: {
        name,
        tokenHash,
        permissions,
        expiresAt: expiresAt ?? null,
        userId: input.userId,
      },
    });

    return {
      token,
      uid: apiToken.uid,
      name: apiToken.name,
      expiresAt: apiToken.expiresAt,
    };
  }

  static async getAllByUser(userId: number): Promise<ApiTokenListOutput[]> {
    const tokens = await db.apiToken.findMany({
      where: { userId },
      select: {
        uid: true,
        name: true,
        permissions: true,
        expiresAt: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return tokens.map((t) => ({
      uid: t.uid,
      name: t.name,
      permissions: t.permissions as string[],
      expiresAt: t.expiresAt,
      createdAt: t.createdAt,
      lastUsedAt: t.lastUsedAt,
    }));
  }

  static async deleteByUid(uid: string, userId: number): Promise<void> {
    const token = await db.apiToken.findUnique({ where: { uid } });
    if (!token || token.userId !== userId) {
      throw new Error("API Token not found or unauthorized");
    }
    await db.apiToken.delete({ where: { uid } });
  }

  static async checkPermission(tokenValue: string, permission: string): Promise<boolean> {
    if (SENSITIVE_PERMISSIONS.includes(permission)) {
      return false;
    }

    const tokenHash = await hashToken(tokenValue);
    const apiToken = await db.apiToken.findUnique({ where: { tokenHash } });

    if (!apiToken) return false;
    if (apiToken.expiresAt && new Date() > apiToken.expiresAt) return false;

    const permissions = apiToken.permissions as string[];
    if (!permissions.includes(permission)) return false;

    // Update lastUsedAt asynchronously
    db.apiToken.update({
      where: { uid: apiToken.uid },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    return true;
  }

  static async getUserFromApiToken(tokenValue: string): Promise<UserInfo | null> {
    const tokenHash = await hashToken(tokenValue);
    const apiToken = await db.apiToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!apiToken) return null;
    if (apiToken.expiresAt && new Date() > apiToken.expiresAt) return null;

    const permissions = apiToken.permissions as string[];
    return {
      id: apiToken.user.id,
      uid: apiToken.user.uid,
      name: apiToken.user.name,
      email: apiToken.user.email,
      role: apiToken.user.role,
      isSuperuser: apiToken.user.isSuperuser,
      permissions,
    };
  }
}
