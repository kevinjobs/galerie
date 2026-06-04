import { NextRequest, NextResponse } from "next/server";
import { PhotoService } from "@/prisma/lib/photoService";
import { AuthTool } from "@/prisma/lib/auth";
import { PermissionError } from "@/prisma/lib/errors";
import { Prisma } from "@prisma/client";
import { canModifyPhoto, ROLES, resolvePermissions } from "@/prisma/lib/roles";

function isPrismaUniqueError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
    }

    const photo = await PhotoService.getByUid(uid);

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Check access for non-public photos
    if (!photo.isPublic) {
      const authHeader = request.headers.get("authorization");
      const user = await AuthTool.getUserFromBearer(authHeader);

      if (!user) {
        return NextResponse.json({ error: "Photo not found" }, { status: 404 });
      }

      // Check if user can view this photo
      const effectivePermissions = resolvePermissions(user.role, user.permissions);
      if (!effectivePermissions.includes("photo.get")) {
        return NextResponse.json({ error: "Photo not found" }, { status: 404 });
      }

      // Non-admin users can only view their own photos
      if (user.role !== ROLES.ADMIN && !user.isSuperuser) {
        if (photo.userId !== user.id) {
          return NextResponse.json({ error: "Photo not found" }, { status: 404 });
        }
      }
    }

    return NextResponse.json(photo);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 418 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    await AuthTool.checkPermission(authHeader, "photo.create");

    // Get current user for userId injection
    const currentUser = await AuthTool.getUserFromBearer(authHeader);

    const body = await request.json();
    const photo = await PhotoService.add({
      title: body.title ?? "",
      src: body.src ?? "",
      description: body.description,
      location: body.location,
      shootTime: body.shootTime ? new Date(body.shootTime) : undefined,
      exif: body.exif,
      author: body.author,
      isPublic: body.isPublic,
      isSelected: body.isSelected,
      type: body.type,
      userId: currentUser?.id,
    });

    return NextResponse.json(photo);
  } catch (error) {
    if (error instanceof Error) {
      if (isPrismaUniqueError(error)) {
        return NextResponse.json({ error: "照片标题已存在，请使用其他标题" }, { status: 409 });
      }
      const status = error instanceof PermissionError ? 403 : 418;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    await AuthTool.checkPermission(authHeader, "photo.update");

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
    }

    // Get current user for resource-level permission check
    const currentUser = await AuthTool.getUserFromBearer(authHeader);
    const existingPhoto = await PhotoService.getByUid(uid);

    if (!existingPhoto) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Resource-level permission check
    if (currentUser) {
      if (!canModifyPhoto(currentUser, { userId: existingPhoto.userId }, "update")) {
        throw new PermissionError("无权修改他人照片");
      }
    }

    const body = await request.json();
    const photo = await PhotoService.updateByUid(uid, {
      title: body.title ?? "",
      src: body.src ?? "",
      description: body.description,
      location: body.location,
      shootTime: body.shootTime ? new Date(body.shootTime) : undefined,
      exif: body.exif,
      author: body.author,
      isPublic: body.isPublic,
      isSelected: body.isSelected,
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return NextResponse.json(photo);
  } catch (error) {
    if (error instanceof Error) {
      if (isPrismaUniqueError(error)) {
        return NextResponse.json({ error: "照片标题已存在，请使用其他标题" }, { status: 409 });
      }
      const status = error instanceof PermissionError ? 403 : 418;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    await AuthTool.checkPermission(authHeader, "photo.delete");

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
    }

    // Get current user for resource-level permission check
    const currentUser = await AuthTool.getUserFromBearer(authHeader);
    const existingPhoto = await PhotoService.getByUid(uid);

    if (!existingPhoto) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Resource-level permission check
    if (currentUser) {
      if (!canModifyPhoto(currentUser, { userId: existingPhoto.userId }, "delete")) {
        throw new PermissionError("无权删除他人照片");
      }
    }

    await PhotoService.deleteByUid(uid);

    return NextResponse.json({ msg: "success" });
  } catch (error) {
    if (error instanceof Error) {
      const status = error instanceof PermissionError ? 403 : 418;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}