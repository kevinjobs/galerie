import { sign, verify, decode } from "jsonwebtoken";
import { PermissionError } from "../errors";
import { UserPlain } from "../generated/prismabox/User";

type UserInfo = typeof UserPlain.static;

export abstract class AuthTool {
  static async sign(payload: object) {
    const key = await Bun.file("./key.pem").text();
    return sign(payload, key, { expiresIn: "7d", algorithm: "HS256" });
  }

  static async verify(token: string) {
    const key = await Bun.file("./key.pem").text();
    return verify(token, key);
  }

  static async decode(token: string) {
    return decode(token);
  }

  static async hasPermission(token: string | undefined, allow: string) {
    if (!token) throw new Error("Unauthorized");
    const decoded: UserInfo = (await AuthTool.decode(token)) as UserInfo;
    const { permissions } = decoded;
    return permissions?.includes(allow);
  }

  static async checkPermission(
    bearer: string | undefined,
    permission: string,
  ) {
    if (!bearer) throw new PermissionError("No Token Provided");

    const decoded: UserInfo = await AuthTool.decode(bearer.replace("Bearer ", '')) as UserInfo;

    if (!decoded) throw new PermissionError("无效的 Token");

    const { permissions } = decoded;

    if (!permissions || !permissions.includes(permission)) {
      throw new PermissionError(
        `Permission denied: 缺少 ${permission} 权限`,
      );
    }
  }

  static generateCode() {
    let code = Math.floor(Math.random() * 1000000).toString();
    return code.padStart(6, '0');
  }
}
