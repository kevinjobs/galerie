import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/prisma/lib/userService";
import { AuthTool } from "@/prisma/lib/auth";
import { PermissionError } from "@/prisma/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    AuthTool.checkPermission(authHeader, "user.get");

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (uid) {
      const user = await UserService.getUserByUid(uid);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json(user);
    }

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

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    AuthTool.checkPermission(authHeader, "user.create");

    const body = await request.json();
    const user = await UserService.add(body);

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof Error) {
      const status = error instanceof PermissionError ? 403 : 418;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    AuthTool.checkPermission(authHeader, "user.update");

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
    }

    const body = await request.json();
    // 过滤空密码，避免覆盖已有密码
    if (body.password === "" || body.password === undefined) {
      delete body.password;
    }
    const user = await UserService.update(uid, body);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof Error) {
      const status = error instanceof PermissionError ? 403 : 418;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    AuthTool.checkPermission(authHeader, "user.delete");

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
    }

    await UserService.deleteByUid(uid);

    return NextResponse.json({ msg: "User deleted successfully" });
  } catch (error) {
    if (error instanceof Error) {
      const status = error instanceof PermissionError ? 403 : 418;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}