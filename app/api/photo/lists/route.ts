import { NextRequest, NextResponse } from "next/server";
import { PhotoService } from "@/prisma/lib/photoService";
import { AuthTool } from "@/prisma/lib/auth";
import { ROLES } from "@/prisma/lib/roles";

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

    // Determine access level based on user role
    const authHeader = request.headers.get("authorization");
    const user = await AuthTool.getUserFromBearer(authHeader);

    let ownerUserId: number | undefined;
    let isPublicFilter: boolean | undefined = isPublic === "true" ? true : isPublic === "false" ? false : undefined;

    if (!user) {
      // Unauthenticated: only public photos
      isPublicFilter = true;
    } else if (user.role === ROLES.ADMIN || user.isSuperuser) {
      // Admin: can see all photos (respect user's isPublic filter if provided)
      // ownerUserId stays undefined
    } else {
      // Contributor/Viewer: show public + own photos
      ownerUserId = user.id;
    }

    const result = await PhotoService.getAll({
      offset,
      limit,
      orderBy,
      order,
      isSelected: isSelected === "true" ? true : isSelected === "false" ? false : undefined,
      isPublic: isPublicFilter,
      ownerUserId,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 418 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}