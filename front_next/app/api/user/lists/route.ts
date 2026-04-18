import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/src/lib/userService";
import { AuthTool } from "@/src/lib/auth";
import { PermissionError } from "@/src/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    AuthTool.checkPermission(authHeader, "user.get");

    const users = await UserService.getAll();
    return NextResponse.json(users);
  } catch (error) {
    if (error instanceof Error) {
      const status = error instanceof PermissionError ? 403 : 418;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}