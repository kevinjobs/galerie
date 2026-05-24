import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/prisma/lib/userService";
import { AuthTool } from "@/prisma/lib/auth";
import { PermissionError, WrongPasswordError } from "@/prisma/lib/errors";

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) throw new PermissionError("No Token Provided");

    const token = authHeader.replace("Bearer ", "");
    const decoded = AuthTool.verify(token);

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    const user = await UserService.getUserByEmailWithPassword(decoded.email);
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const verified = await UserService.verifyPassword(oldPassword, user.password);
    if (!verified) throw new WrongPasswordError("旧密码错误");

    await UserService.update(decoded.uid, { password: newPassword });

    return NextResponse.json({ msg: "密码修改成功" });
  } catch (error) {
    if (error instanceof Error) {
      const status = error instanceof PermissionError ? 403 : 418;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
