import { NextRequest, NextResponse } from "next/server";
import { PhotoService } from "@/prisma/lib/photoService";
import { AuthTool } from "@/prisma/lib/auth";
import { PermissionError } from "@/prisma/lib/errors";
import { Prisma } from "@prisma/client";

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
    AuthTool.checkPermission(authHeader, "photo.create");

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
    AuthTool.checkPermission(authHeader, "photo.update");

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
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
    AuthTool.checkPermission(authHeader, "photo.delete");

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
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