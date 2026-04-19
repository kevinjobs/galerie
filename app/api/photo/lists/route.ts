import { NextRequest, NextResponse } from "next/server";
import { PhotoService } from "@/prisma/lib/photoService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const offset = searchParams.get("offset")
      ? Number(searchParams.get("offset"))
      : 0;
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : 10;
    const orderBy = searchParams.get("orderBy") || "shootTime";
    const order = searchParams.get("order") || "desc";
    const isSelected = searchParams.get("isSelected");
    const isPublic = searchParams.get("isPublic");

    const result = await PhotoService.getAll({
      offset,
      limit,
      orderBy,
      order,
      isSelected: isSelected === "true" ? true : isSelected === "false" ? false : undefined,
      isPublic: isPublic === "true" ? true : isPublic === "false" ? false : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 418 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}