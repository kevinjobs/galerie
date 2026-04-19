import { NextRequest, NextResponse } from "next/server";
import { AuthTool } from "@/prisma/lib/auth";
import { PermissionError } from "@/prisma/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    const decoded = AuthTool.verify(token);

    if (!decoded) {
      throw new PermissionError("无效的 token");
    }

    return NextResponse.json(decoded);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 418 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}