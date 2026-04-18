import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/src/lib/userService";
import { AuthTool } from "@/src/lib/auth";
import { NotFoundError, WrongPasswordError } from "@/src/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const user = await UserService.getUserByEmail(email);

    if (!user) {
      throw new NotFoundError("用户不存在");
    }

    const verified = await UserService.verifyPassword(password, user.password);

    if (!verified) {
      throw new WrongPasswordError("密码错误");
    }

    const { password: _pwd, ...userWithoutPassword } = user;
    const token = AuthTool.sign(userWithoutPassword);

    return NextResponse.json({ token, user: userWithoutPassword });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 418 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}