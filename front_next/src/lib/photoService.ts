import { db } from "./db";
import { Photo, Prisma } from "@prisma/client";
import path from "path";
import fs from "fs/promises";

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

    const where: Prisma.PhotoWhereInput = {};

    if (isSelected !== undefined) {
      where.isSelected = isSelected;
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    const orderByClause: Prisma.PhotoOrderByWithRelationInput = {};
    if (order === "random") {
      orderByClause.id = "asc";
    } else {
      orderByClause[orderBy as keyof Prisma.PhotoOrderByWithRelationInput] = order as "asc" | "desc";
    }

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
  ): Promise<Photo | null> {
    try {
      const updatedPhoto = await db.photo.update({
        where: { uid: photoUid },
        data: photo,
      });
      return updatedPhoto;
    } catch {
      throw new Error("Photo not found");
    }
  }

  static async deleteByUid(photoUid: string): Promise<void> {
    await db.photo.delete({
      where: { uid: photoUid },
    });
  }

  static async upload(file: File): Promise<string> {
    await ensureUploadDir();
    const filepath = path.join(uploadDir, file.name);

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filepath, buffer);
      return `/photo/file/${file.name}`;
    } catch {
      throw new Error("Failed to upload photo");
    }
  }

  static async getFile(filename: string): Promise<Buffer | null> {
    const filepath = path.join(uploadDir, filename);
    try {
      return await fs.readFile(filepath);
    } catch {
      return null;
    }
  }
}