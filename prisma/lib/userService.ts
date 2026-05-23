import { db } from "./db";
import crypto from "crypto";
import { Photo, User } from "@prisma/client";

export abstract class UserService {
  static async add(input: {
    name: string;
    email: string;
    password: string;
    permissions?: string[];
    nickname?: string;
  }): Promise<Omit<User, "password">> {
    const hashedPassword = await this.hashPassword(input.password);

    const user = await db.user.create({
      data: {
        name: input.name || "",
        email: input.email,
        password: hashedPassword,
        nickname: input.nickname || "Nameless User",
        permissions: input.permissions || [
          "photo.create",
          "photo.get",
          "photo.update",
          "photo.delete",
          "photo.upload",
        ],
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  static async update(
    uid: string,
    input: {
      name?: string;
      email?: string;
      password?: string;
      nickname?: string;
      permissions?: string[];
    }
  ): Promise<Omit<User, "password"> | null> {
    const data: Record<string, unknown> = { ...input };

    if (input.password) {
      data.password = await this.hashPassword(input.password);
    } else {
      delete data.password;
    }

    const user = await db.user.update({
      where: { uid },
      data,
    });

    if (!user) return null;

    const { password: _, ...result } = user;
    return result;
  }

  static async deleteByUid(uid: string): Promise<void> {
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

  static async getUserByEmail(email: string): Promise<User | null> {
    const user = await db.user.findUnique({
      where: { email },
    });

    return user;
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

    return record !== null;
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