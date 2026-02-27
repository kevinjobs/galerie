import { ElysiaFile, file } from "elysia";
import { db } from "../../db";
import {
  PhotoPlain,
  PhotoPlainInputCreate,
} from "../../generated/prismabox/Photo";
import { ensureDirs } from "../../utils";

export abstract class PhotoService {
  static async add(
    photo: typeof PhotoPlainInputCreate.static,
  ): Promise<typeof PhotoPlain.static> {
    return await db.photo.create({
      data: photo,
    });
  }

  static async getByUid(
    photoUid: string,
  ): Promise<typeof PhotoPlain.static | null> {
    return db.photo.findUnique({
      where: { uid: photoUid },
    });
  }

  static async getAll({
    offset,
    limit,
    orderBy,
    order,
    isSelected,
    isPublic,
  }: {
    offset: number;
    limit: number;
    orderBy: string;
    order: string;
    isSelected?: boolean;
    isPublic?: boolean;
  }): Promise<{
    lists: (typeof PhotoPlain.static)[];
    total: number;
    offset: number;
    limit: number;
  }> {
    const conditions = {
      skip: offset,
      take: limit,
      orderBy: {
        [orderBy]: order,
      },
      where: {
        OR: [
          { isSelected: true },
          { isSelected: false },
          { isPublic: true },
          { isPublic: false },
        ],
      },
    };

    if (isSelected !== undefined) {
      conditions.where = {
        // @ts-ignore
        ...conditions.where,
        // @ts-ignore
        isSelected,
      };
    }

    if (isPublic !== undefined) {
      conditions.where = {
        // @ts-ignore
        ...conditions.where,
        // @ts-ignore
        isPublic,
      };
    }

    //to-do: 暂无较好方案实现随机选取 2026-02-19
    if (order === "random") {
      conditions.orderBy[orderBy] = "asc";
    }

    const count = await db.photo.count(conditions);
    const photos = await db.photo.findMany(conditions);
    return {
      lists: photos,
      total: count,
      offset,
      limit,
    };
  }

  static async updateByUid(
    photoUid: string,
    photo: typeof PhotoPlainInputCreate.static,
  ): Promise<typeof PhotoPlain.static | null> {
    try {
      const updatedPhoto = await db.photo.update({
        where: { uid: photoUid },
        data: photo,
      });
      return updatedPhoto;
    } catch (error) {
      throw new Error("Photo not found");
    }
  }

  static async deleteByUid(photoUid: string): Promise<void> {
    await db.photo.delete({
      where: { uid: photoUid },
    });
  }

  static async upload(file: File): Promise<string> {
    const uploadDirs = "./public/upload";
    await ensureDirs(uploadDirs);

    try {
      Bun.write(`${uploadDirs}/${file.name}`, await file.arrayBuffer());
      return `/photo/file/${file.name}`;
    } catch (error) {
      throw new Error("Failed to upload photo");
    }
  }

  static async getFile(filename: string): Promise<ElysiaFile | null> {
    return file(`./public/upload/${filename}`);
  }
}
