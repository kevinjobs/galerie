import { Elysia, t } from "elysia";
import { UserService } from "./service";
import {
  UserInputCreate,
  UserPlain,
  UserInputUpdate,
} from "../../generated/prismabox/User";
import { AuthTool } from "../../utils/auth";
import { bearer } from "@elysiajs/bearer";

const DEFAULT_PERMISSIONS = [
  "photo.create",
  "photo.get",
  "photo.update",
  "photo.delete",
  "photo.upload",
];

const User = new Elysia({
  name: "user",
  prefix: "/user",
})
  .use(bearer())
  // 用户注册接口
  .post("/register", async ({ body }) => {
    const { email, password, verifyCode } = body;

    const isValidCode = await UserService.checkVerifyCode(email, verifyCode);

    if (!isValidCode) {
      throw new Error("Invalid verification code");
    }

    const user = await UserService.add({
      name: "",
      email,
      password,
      permissions: DEFAULT_PERMISSIONS
    });

    return user;

  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
      verifyCode: t.String(),
    })
  })
  // 管理员接口
  .post(
    "/",
    async ({ body, bearer }) => {
      await AuthTool.checkPermission(bearer, "user.create");

      const user = await UserService.add(body);
      return user;
    },
    {
      body: UserInputCreate,
      response: t.Omit(UserPlain, ["password"]),
    },
  )
  // 获取用户列表接口
  .get(
    "/lists",
    async ({ bearer }) => {
      await AuthTool.checkPermission(bearer, "user.get");

      const users = await UserService.getAll();
      return users;
    },
    {
      response: t.Array(t.Omit(UserPlain, ["password"])),
    },
  )
  // 获取单个用户信息接口
  .get(
    "/",
    async ({ query, bearer }) => {
      await AuthTool.checkPermission(bearer, "user.get");

      const { uid } = query;
      const user = await UserService.getUserByUid(uid);
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    },
    {
      query: t.Object({
        uid: t.String(),
      }),
      response: t.Omit(UserPlain, ["password"]),
    },
  )
  // 更新用户信息接口
  .put(
    "/",
    async ({ body, query, bearer }) => {
      await AuthTool.checkPermission(bearer, "user.update");

      const { uid } = query;
      const user = await UserService.update(uid, body);
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    },
    {
      body: UserInputUpdate,
      query: t.Object({
        uid: t.String(),
      }),
      response: t.Omit(UserPlain, ["password"]),
    },
  )
  // 删除用户接口
  .delete(
    "/",
    async ({ query, bearer }) => {
      await AuthTool.checkPermission(bearer, "user.delete");

      const { uid } = query;

      try {
        const user = await UserService.deleteByUid(uid);
        return {
          msg: "User deleted successfully",
        };
      } catch (error) {
        throw new Error("Failed to delete user");
      }
    },
    {
      query: t.Object({
        uid: t.String(),
      }),
      response: t.Object({
        msg: t.String(),
      }),
    },
  );

export default User;
