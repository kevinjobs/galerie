import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/src/lib/userService";

const DEFAULT_PERMISSIONS = [
  "photo.create",
  "photo.get",
  "photo.update",
  "photo.delete",
  "photo.upload",
];

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

    const user = await UserService.add({
      name: "",
      email,
      password,
      permissions: DEFAULT_PERMISSIONS,
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 418 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}