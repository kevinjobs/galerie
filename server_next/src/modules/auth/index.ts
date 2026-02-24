import { Elysia, t } from "elysia";
import { db } from "../../db";
import { MyError, NotFoundError, PermissionError, WrongPasswordError } from "../../errors";
import { AuthTool } from "../../utils/auth";
import { sendVerificationEmail } from "../../utils/email";
import { UserService } from "../user/service";
import { UserPlain } from "../../generated/prismabox/User";
import { VerifyCodePlain } from "../../generated/prismabox/VerifyCode";

const auth = new Elysia({ name: "auth", prefix: "/auth" })
  // 登录接口，返回 JWT token
  .post(
    "/sign-token",
    async ({ body: { email, password } }) => {
      const user = await UserService.getUserByEmail(email);

      if (!user) throw new NotFoundError("用户不存在");

      let verified = false;

      verified = await Bun.password.verify(password, user.password);
      if (!verified) {
        throw new WrongPasswordError("密码错误");
      }

      const token = await AuthTool.sign({ ...user, password: null });
      return { token, user: { ...user, password: null } };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
      response: t.Object({
        token: t.String(),
        user: t.Omit(UserPlain, ["password"]),
      }),
    },
  )
  // 验证 JWT token 是否有效，并返回用户信息
  .post(
    "/verify-token",
    async ({ body: { token } }) => {
      await AuthTool.verify(token);

      const decoded = await AuthTool.decode(token);

      if (!decoded) {
        throw new PermissionError("无效的 token");
      }

      return { ...decoded as typeof UserPlain.static };
    },
    {
      body: t.Object({
        token: t.String(),
      }),
      response: t.Omit(UserPlain, ["password"]),
    },
  )
  // 发送验证码接口
  .get("/send-verify-code",
    async ({ query }) => {
      const { email } = query;

      const code = AuthTool.generateCode();

      try {
        await sendVerificationEmail(email, `${code}`);
      } catch (error) {
        throw new MyError(`发送验证码邮件失败: ${error}`);
      }

      const vc = await db.verifyCode.create({
        data: {
          email,
          code,
        }
      });

      return vc;
    },
    {
      query: t.Object({
        email: t.String(),
      }),
      response: VerifyCodePlain,
    }
  );

export default auth;
