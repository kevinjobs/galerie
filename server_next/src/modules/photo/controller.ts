import { Elysia, t } from "elysia";
import { PhotoService } from "./service";
import { PhotoInputCreate, PhotoPlain } from "../../generated/prismabox/Photo";
import { AuthTool } from "../../utils/auth";
import { PermissionError } from "../../errors";
import { bearer } from "@elysiajs/bearer";

const photo = new Elysia({
  name: "photo",
  prefix: "/photo",
})
  .use(bearer())
  .get(
    "/lists",
    async ({ query }) => {
      const {
        offset = 0,
        limit = 10,
        orderBy = "shootTime",
        order = "desc",
        isSelected,
        isPublic,
      } = query;
      const { lists, total } = await PhotoService.getAll({
        offset,
        limit,
        orderBy,
        order,
        isSelected:
          isSelected === undefined ? undefined : isSelected === "true",
        isPublic: isPublic === undefined ? undefined : isPublic === "true",
      });
      return {
        lists,
        total,
        offset,
        limit,
      };
    },
    {
      query: t.Object({
        offset: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
        orderBy: t.Optional(t.String()),
        order: t.Optional(t.String()),
        isSelected: t.Optional(t.String()),
        isPublic: t.Optional(t.String()),
      }),
      response: t.Object({
        offset: t.Number(),
        limit: t.Number(),
        total: t.Number(),
        lists: t.Array(PhotoPlain),
      }),
    },
  )
  .post(
    "/",
    async ({ body, bearer }) => {
      await AuthTool.checkPermission(bearer, "photo.create");

      const photo = await PhotoService.add(body);
      return photo;
    },
    {
      body: PhotoInputCreate,
      response: PhotoPlain,
    },
  )
  .get(
    "/",
    async ({ query }) => {
      // no need to check auth
      const { uid } = query;
      const photo = await PhotoService.getByUid(uid);
      if (photo) return photo;
      else throw new Error("Photo not found");
    },
    {
      query: t.Object({
        uid: t.String(),
      }),
      response: PhotoPlain,
    },
  )
  .put(
    "/",
    async ({ query, body, bearer }) => {
      await AuthTool.checkPermission(bearer, "photo.update")

      const { uid } = query;
      const photo = await PhotoService.updateByUid(uid, body);
      if (photo) return photo;
      else throw new Error("Photo not found");
    },
    {
      query: t.Object({
        uid: t.String(),
      }),
      body: PhotoInputCreate,
      response: PhotoPlain,

    },
  )
  .delete(
    "/",
    async ({ query, bearer }) => {
      await AuthTool.checkPermission(bearer, "photo.delete")

      const { uid } = query;
      try {
        await PhotoService.deleteByUid(uid);
        return {
          msg: "success",
        };
      } catch (error) {
        throw new Error("Photo not found");
      }
    },
    {
      query: t.Object({
        uid: t.String(),
      }),
      response: t.Object({
        msg: t.String(),
      }),

    },
  )
  .post(
    "/upload",
    async ({ body: { image }, bearer }) => {
      await AuthTool.checkPermission(bearer, "photo.upload")

      try {
        return {
          src: await PhotoService.upload(image),
        };
      } catch (error) {
        throw new Error("Failed to upload photo");
      }
    },
    {
      body: t.Object({
        image: t.File(),
      }),
      response: t.Object({
        src: t.String(),
      }),

    },
  )
  .get(
    "/file/:filename",
    async ({ params }) => {
      const { filename } = params;
      try {
        return await PhotoService.getFile(filename);
      } catch (error) {
        throw new Error("Photo not found");
      }
    },
    {
      params: t.Object({
        filename: t.String(),
      }),
      response: t.Any(),
    },
  );

export default photo;
