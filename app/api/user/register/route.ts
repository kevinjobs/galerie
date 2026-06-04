import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/prisma/lib/userService";
import { ROLES } from "@/prisma/lib/roles";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, verifyCode } = body;

    const isValidCode = await UserService.checkVerifyCode(email, verifyCode);

    if (!isValidCode) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 418 }
      );
    }

    // 从 email 前缀生成默认用户名
    const defaultName = email.split("@")[0];
    const user = await UserService.add({
      name: defaultName,
      email,
      password,
      role: ROLES.CONTRIBUTOR,
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 418 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}