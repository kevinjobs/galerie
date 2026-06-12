import { NextRequest, NextResponse } from "next/server";
import { AuthTool, JWT_ONLY_PERMISSIONS } from "@/prisma/lib/auth";
import { PermissionError } from "@/prisma/lib/errors";
import { ApiTokenService } from "@/prisma/lib/apiTokenService";
import { resolvePermissions } from "@/prisma/lib/roles";

function isSensitivePermission(perm: string): boolean {
  return JWT_ONLY_PERMISSIONS.includes(perm);
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const currentUser = await AuthTool.getUserFromBearer(authHeader);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, permissions, expiresIn } = body;

    if (!name || !permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json({ error: "name and permissions are required" }, { status: 400 });
    }

    // Resolve effective permissions from role
    const effectivePermissions = resolvePermissions(currentUser.role, currentUser.permissions);

    for (const perm of permissions) {
      if (isSensitivePermission(perm)) {
        return NextResponse.json({ error: `权限 "${perm}" 仅限 JWT 使用，不能用于 API Token` }, { status: 400 });
      }
      if (!effectivePermissions.includes(perm)) {
        return NextResponse.json({ error: `权限 "${perm}" 超出了当前用户的权限范围` }, { status: 400 });
      }
    }

    let expiresAt: Date | null = null;
    if (expiresIn === "7d") {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      expiresAt = d;
    } else if (expiresIn === "30d") {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      expiresAt = d;
    } else if (expiresIn === "1y") {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      expiresAt = d;
    }

    const result = await ApiTokenService.create({
      name,
      permissions,
      expiresAt,
      userPermissions: effectivePermissions,
      userId: currentUser.id,
    });

    return NextResponse.json({
      token: result.token,
      uid: result.uid,
      name: result.name,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    if (error instanceof Error) {
      const status = error instanceof PermissionError ? 403 : 418;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const currentUser = await AuthTool.getUserFromBearer(authHeader);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokens = await ApiTokenService.getAllByUser(currentUser.id);
    return NextResponse.json(tokens);
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
    const currentUser = await AuthTool.getUserFromBearer(authHeader);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
    }

    await ApiTokenService.deleteByUid(uid, currentUser.id);

    return NextResponse.json({ msg: "Token revoked successfully" });
  } catch (error) {
    if (error instanceof Error) {
      const status = error instanceof PermissionError ? 403 : 418;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
