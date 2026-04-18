import { db } from "./db";
import { Photo, Prisma } from "@prisma/client";

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
}