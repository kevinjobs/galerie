import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/prisma/lib/userService";
import { AuthTool } from "@/prisma/lib/auth";
import { PermissionError } from "@/prisma/lib/errors";
import { ROLES, ROLE_PERMISSIONS } from "@/prisma/lib/roles";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    await AuthTool.checkPermission(authHeader, "user.get");

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
    await AuthTool.checkPermission(authHeader, "user.create");

    // Get current operator info
    const operator = await AuthTool.getUserFromBearer(authHeader);
    if (!operator) {
      throw new PermissionError("无法获取操作者信息");
    }

    const body = await request.json();

    // Validate role - only admin can create admin users
    const targetRole = body.role || ROLES.CONTRIBUTOR;
    if (targetRole === ROLES.ADMIN && !operator.isSuperuser && operator.role !== ROLES.ADMIN) {
      throw new PermissionError("只有管理员可以创建管理员用户");
    }

    // Auto-derive permissions from role (don't accept raw permissions from frontend)
    const rolePermissions = ROLE_PERMISSIONS[targetRole as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.contributor;

    const user = await UserService.add({
      ...body,
      role: targetRole,
      permissions: rolePermissions,
    });

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
    await AuthTool.checkPermission(authHeader, "user.update");

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
    }

    // Get current operator info
    const operator = await AuthTool.getUserFromBearer(authHeader);

    const body = await request.json();
    // 过滤空密码，避免覆盖已有密码
    if (body.password === "" || body.password === undefined) {
      delete body.password;
    }

    // If changing role, derive permissions from role
    if (body.role) {
      const rolePermissions = ROLE_PERMISSIONS[body.role as keyof typeof ROLE_PERMISSIONS];
      if (rolePermissions) {
        body.permissions = rolePermissions;
      }
    }

    const user = await UserService.update(uid, body, operator?.uid);

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
    await AuthTool.checkPermission(authHeader, "user.delete");

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
    }

    // Get current operator info to prevent self-deletion
    const operator = await AuthTool.getUserFromBearer(authHeader);

    await UserService.deleteByUid(uid, operator?.uid);

    return NextResponse.json({ msg: "User deleted successfully" });
  } catch (error) {
    if (error instanceof Error) {
      const status = error instanceof PermissionError ? 403 : 418;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}