import { NextRequest, NextResponse } from "next/server";
import { AuthTool } from "@/src/lib/auth";
import { sendVerificationEmail } from "@/src/lib/email";
import { db } from "@/src/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const code = AuthTool.generateCode();

    try {
      await sendVerificationEmail(email, code);
    } catch (error) {
      return NextResponse.json(
        { error: `发送验证码邮件失败: ${error}` },
        { status: 418 }
      );
    }

    const vc = await db.verifyCode.create({
      data: {
        email,
        code,
      },
    });

    return NextResponse.json(vc);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 418 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}