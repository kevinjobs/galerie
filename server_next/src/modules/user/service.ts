import { db } from "../../db";
import {
  UserPlainInputCreate,
  UserPlain,
  UserInputUpdate,
} from "../../generated/prismabox/User";

export abstract class UserService {
  static async add(
    input: typeof UserPlainInputCreate.static,
  ): Promise<Omit<typeof UserPlain.static, "password">> {
    const user = await db.user.create({
      data: {
        ...input,
        password: await Bun.password.hash(input.password),
      },
      omit: {
        // 默认创建用户时需要输入密码，但返回时不包含密码
        password: false,
      },
    });

    user.password = ""; // 确保返回的用户对象不包含密码

    return user;
  }

  static async update(
    uid: string,
    input: typeof UserInputUpdate.static,
  ): Promise<Omit<typeof UserPlain.static, "password">> {
    const data = { ...input };

    let user = null;

    if (input.password) {
      const hashedPass = await Bun.password.hash(input.password);

      user = await db.user.update({
        where: { uid },
        data: {
          ...data,
          password: hashedPass,
        }, // 只更新除 password 以外的字段
        omit: {
          // 更新用户时，如果输入了密码，则更新密码；
          // 如果没有输入密码，则保持原有密码不变。返回时不包含密码。
          password: false,
        }
      });
    } else {
      const { password, ...dataWithoutPassword } = data;

      user = await db.user.update({
        where: { uid },
        data: dataWithoutPassword, // 只更新除 password 以外的字段
        omit: {
          // 更新用户时，如果输入了密码，则更新密码；
          // 如果没有输入密码，则保持原有密码不变。返回时不包含密码。
          password: false,
        }
      });
    }

    user.password = ""; // 确保返回的用户对象不包含密码

    return user;
  }

  static async deleteByUid(uid: string): Promise<void> {
    await db.user.delete({ where: { uid } });
  }

  static async getUserByUid(
    uid: string,
  ): Promise<Omit<typeof UserPlain.static, "password"> | null> {
    const user = await db.user.findUnique({
      where: { uid },
    });
    return user;
  }

  static async getUserByName(
    name: string,
  ): Promise<typeof UserPlain.static | null> {
    const user = await db.user.findUnique({
      where: { name },
      omit: {
        password: false,
      },
    });
    return user;
  }

  static async getUserByEmail(email: string): Promise<typeof UserPlain.static | null> {
    const user = await db.user.findUnique({
      where: { email },
      omit: {
        password: false,
      },
    });
    return user;
  }

  static async getAll(): Promise<Omit<typeof UserPlain.static, "password">[]> {
    const users = await db.user.findMany({});
    return users;
  }

  static async checkVerifyCode(email: string, verifyCode: string): Promise<boolean> {
    const record = await db.verifyCode.findFirst({
      where: { email, code: verifyCode },
    });

    return record !== null;
  }
}
