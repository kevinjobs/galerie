import { db } from "./db";
import crypto from "crypto";
import { Photo, User, Prisma } from "@prisma/client";
import { PermissionError } from "./errors";
import { ROLES, ROLE_PERMISSIONS, isValidRole } from "./roles";

type UserUpdateInput = {
  name?: string;
  email?: string;
  password?: string;
  nickname?: string;
  role?: string;
  permissions?: string[];
  avatar?: string;
};

const ROLE_HIERARCHY: Record<string, number> = {
  [ROLES.ADMIN]: 3,
  [ROLES.CONTRIBUTOR]: 2,
  [ROLES.VIEWER]: 1,
};

export abstract class UserService {
  static async add(input: {
    name: string;
    email: string;
    password: string;
    role?: string;
    permissions?: string[];
    nickname?: string;
  }): Promise<Omit<User, "password">> {
    const hashedPassword = await this.hashPassword(input.password);
    const role = input.role && isValidRole(input.role) ? input.role : ROLES.CONTRIBUTOR;

    const user = await db.user.create({
      data: {
        name: input.name || "",
        email: input.email,
        password: hashedPassword,
        nickname: input.nickname || "Nameless User",
        role,
        permissions: input.permissions || ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS],
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  static async update(
    uid: string,
    input: UserUpdateInput,
    operatorUid?: string,
  ): Promise<Omit<User, "password">> {
    // Prevent privilege escalation
    if (operatorUid) {
      const operator = await db.user.findUnique({ where: { uid: operatorUid } });
      if (!operator) throw new PermissionError("操作者不存在");

      // Non-admin cannot modify anyone's role
      if (input.role !== undefined && operator.role !== ROLES.ADMIN && !operator.isSuperuser) {
        throw new PermissionError("只有管理员可以修改用户角色");
      }

      // Cannot modify own role (prevent self-escalation and admin lock-out)
      if (operator.uid === uid && input.role !== undefined) {
        const target = await db.user.findUnique({ where: { uid } });
        if (target && target.role !== input.role) {
          throw new PermissionError("不能修改自己的角色，请让其他管理员操作");
        }
      }

      // Non-admin cannot grant admin role
      if (input.role === ROLES.ADMIN && !operator.isSuperuser && operator.role !== ROLES.ADMIN) {
        throw new PermissionError("只有超级管理员可以授予管理员角色");
      }
    }

    const data: Prisma.UserUpdateInput = { ...input };

    if (input.password) {
      data.password = await this.hashPassword(input.password);
    } else {
      delete data.password;
    }

    const user = await db.user.update({
      where: { uid },
      data,
    });

    const { password: _, ...result } = user;
    return result;
  }

  static async deleteByUid(uid: string, operatorUid?: string): Promise<void> {
    // Cannot delete yourself
    if (operatorUid && operatorUid === uid) {
      throw new PermissionError("不能删除自己的账户");
    }
    await db.user.delete({ where: { uid } });
  }

  static async getUserByUid(uid: string): Promise<Omit<User, "password"> | null> {
    const user = await db.user.findUnique({
      where: { uid },
    });

    if (!user) return null;

    const { password: _, ...result } = user;
    return result;
  }

  static async getUserByName(name: string): Promise<Omit<User, "password"> | null> {
    const user = await db.user.findUnique({
      where: { name },
    });

    if (!user) return null;

    const { password: _, ...result } = user;
    return result;
  }

  static async getUserByEmailWithPassword(email: string): Promise<User | null> {
    const user = await db.user.findUnique({
      where: { email },
    });
    return user;
  }

  static async getUserByEmail(email: string): Promise<Omit<User, "password"> | null> {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) return null;

    const { password: _, ...result } = user;
    return result;
  }

  static async getAll(): Promise<Omit<User, "password">[]> {
    const users = await db.user.findMany({});
    return users.map((user: User) => {
      const { password: _, ...result } = user;
      return result;
    });
  }

  static async checkVerifyCode(
    email: string,
    verifyCode: string
  ): Promise<boolean> {
    const record = await db.verifyCode.findFirst({
      where: { email, code: verifyCode },
    });

    if (!record) return false;

    const now = Date.now();
    const createdAt = new Date(record.createTime).getTime();
    const TEN_MINUTES = 10 * 60 * 1000;
    if (now - createdAt > TEN_MINUTES) return false;

    await db.verifyCode.delete({ where: { uid: record.uid } });

    return true;
  }

  static async hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString("hex");
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(`${salt}:${derivedKey.toString("hex")}`);
      });
    });
  }

  static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [salt, key] = hash.split(":");
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(key === derivedKey.toString("hex"));
      });
    });
  }
}