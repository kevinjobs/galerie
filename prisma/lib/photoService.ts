import { db } from "./db";
import { Photo, Prisma } from "@prisma/client";
import path from "path";
import fs from "fs/promises";

const ALLOWED_ORDER_FIELDS = ["id", "uid", "title", "shootTime", "createTime", "updateTime", "author", "location"] as const;
const ALLOWED_ORDER_DIRECTIONS = ["asc", "desc"] as const;

export interface PhotoCreateInput {
  title: string;
  src: string;
  description?: string;
  location?: string;
  shootTime?: Date;
  exif?: Prisma.InputJsonValue;
  author?: string;
  isPublic?: boolean;
  isSelected?: boolean;
  type?: string;
}

export interface PhotoListParams {
  offset?: number;
  limit?: number;
  orderBy?: string;
  order?: string;
  isSelected?: boolean;
  isPublic?: boolean;
}

const uploadDir = path.join(process.cwd(), "public/upload");

async function ensureUploadDir() {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
}

export abstract class PhotoService {
  static async add(
    photo: PhotoCreateInput
  ): Promise<Photo> {
    return await db.photo.create({
      data: photo,
    });
  }

  static async getByUid(photoUid: string): Promise<Photo | null> {
    return db.photo.findUnique({
      where: { uid: photoUid },
    });
  }

  static async getAll(params: PhotoListParams): Promise<{
    lists: Photo[];
    total: number;
    offset: number;
    limit: number;
  }> {
    const {
      offset = 0,
      limit = 10,
      orderBy = "shootTime",
      order = "desc",
      isSelected,
      isPublic,
    } = params;

    const where: Prisma.PhotoWhereInput = {
      type: { not: "avatar" },
    };

    if (isSelected !== undefined) {
      where.isSelected = isSelected;
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    if (order === "random") {
      const count = await db.photo.count({ where });
      const randomOffset = Math.floor(Math.random() * Math.max(count - limit + 1, 1));
      const photos = await db.photo.findMany({
        where,
        skip: randomOffset,
        take: limit,
        orderBy: { id: "asc" },
      });

      return {
        lists: photos,
        total: count,
        offset,
        limit,
      };
    }

    const orderByClause: Prisma.PhotoOrderByWithRelationInput = {};
    const safeOrderBy = ALLOWED_ORDER_FIELDS.includes(orderBy as typeof ALLOWED_ORDER_FIELDS[number]) ? orderBy : "shootTime";
    const safeOrder: "asc" | "desc" = ALLOWED_ORDER_DIRECTIONS.includes(order as typeof ALLOWED_ORDER_DIRECTIONS[number]) ? order as "asc" | "desc" : "desc";
    orderByClause[safeOrderBy as keyof Prisma.PhotoOrderByWithRelationInput] = safeOrder;

    const count = await db.photo.count({ where });
    const photos = await db.photo.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: orderByClause,
    });

    return {
      lists: photos,
      total: count,
      offset,
      limit,
    };
  }

  static async updateByUid(
    photoUid: string,
    photo: PhotoCreateInput
  ): Promise<Photo> {
    const updatedPhoto = await db.photo.update({
      where: { uid: photoUid },
      data: photo,
    });
    return updatedPhoto;
  }

  static async deleteByUid(photoUid: string): Promise<void> {
    const photo = await db.photo.findUnique({ where: { uid: photoUid } });
    if (photo?.src?.startsWith("local:")) {
      const filename = photo.src.replace("local:", "");
      const filepath = path.resolve(uploadDir, path.basename(filename));
      const resolvedUploadDir = path.resolve(uploadDir);
      if (filepath.startsWith(resolvedUploadDir + path.sep)) {
        fs.unlink(filepath).catch(() => {});
      }
    }
    await db.photo.delete({
      where: { uid: photoUid },
    });
  }

  static async upload(file: File): Promise<string> {
    await ensureUploadDir();
    const resolvedUploadDir = path.resolve(uploadDir);
    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext);
    let finalName = `${baseName}${ext}`;
    let counter = 0;

    while (true) {
      const filepath = path.resolve(uploadDir, finalName);
      if (!filepath.startsWith(resolvedUploadDir + path.sep) && filepath !== resolvedUploadDir) {
        throw new Error("Invalid file path");
      }
      try {
        await fs.access(filepath);
        counter++;
        finalName = `${baseName}_${counter}${ext}`;
      } catch {
        break;
      }
    }

    const finalPath = path.resolve(uploadDir, finalName);

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(finalPath, buffer);
      return `/photo/file/${finalName}`;
    } catch {
      throw new Error("Failed to upload photo");
    }
  }

  static async getFile(filename: string): Promise<Buffer | null> {
    const resolvedUploadDir = path.resolve(uploadDir);
    const filepath = path.resolve(uploadDir, filename);

    if (!filepath.startsWith(resolvedUploadDir + path.sep) && filepath !== resolvedUploadDir) {
      return null;
    }

    try {
      return await fs.readFile(filepath);
    } catch {
      return null;
    }
  }
}