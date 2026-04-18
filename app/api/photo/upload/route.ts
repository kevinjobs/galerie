import { NextRequest, NextResponse } from "next/server";
import { PhotoService } from "@/src/lib/photoService";
import { AuthTool } from "@/src/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const bearer = request.headers.get("Authorization")?.replace("Bearer ", "");
    AuthTool.checkPermission(bearer, "photo.upload");

    const formData = await request.formData();
    const image = formData.get("image") as File | null;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const src = await PhotoService.upload(image);
    return NextResponse.json({ src });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 418 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}