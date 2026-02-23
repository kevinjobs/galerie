import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const PhotoPlain = t.Object(
  {
    id: t.Integer(),
    uid: t.String(),
    title: t.String(),
    src: t.String(),
    description: __nullable__(t.String()),
    location: __nullable__(t.String()),
    shootTime: t.Date(),
    createTime: t.Date(),
    updateTime: __nullable__(t.Date()),
    exif: __nullable__(t.Any()),
    author: __nullable__(t.String()),
    isPublic: t.Boolean(),
    isSelected: t.Boolean(),
  },
  { additionalProperties: false },
);

export const PhotoRelations = t.Object({}, { additionalProperties: false });

export const PhotoPlainInputCreate = t.Object(
  {
    title: t.String(),
    src: t.String(),
    description: t.Optional(__nullable__(t.String())),
    location: t.Optional(__nullable__(t.String())),
    shootTime: t.Optional(t.Date()),
    createTime: t.Optional(t.Date()),
    exif: t.Optional(__nullable__(t.Any())),
    author: t.Optional(__nullable__(t.String())),
    isPublic: t.Optional(t.Boolean()),
    isSelected: t.Optional(t.Boolean()),
  },
  { additionalProperties: false },
);

export const PhotoPlainInputUpdate = t.Object(
  {
    title: t.Optional(t.String()),
    src: t.Optional(t.String()),
    description: t.Optional(__nullable__(t.String())),
    location: t.Optional(__nullable__(t.String())),
    shootTime: t.Optional(t.Date()),
    createTime: t.Optional(t.Date()),
    exif: t.Optional(__nullable__(t.Any())),
    author: t.Optional(__nullable__(t.String())),
    isPublic: t.Optional(t.Boolean()),
    isSelected: t.Optional(t.Boolean()),
  },
  { additionalProperties: false },
);

export const PhotoRelationsInputCreate = t.Object(
  {},
  { additionalProperties: false },
);

export const PhotoRelationsInputUpdate = t.Partial(
  t.Object({}, { additionalProperties: false }),
);

export const PhotoWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.Integer(),
          uid: t.String(),
          title: t.String(),
          src: t.String(),
          description: t.String(),
          location: t.String(),
          shootTime: t.Date(),
          createTime: t.Date(),
          updateTime: t.Date(),
          exif: t.Any(),
          author: t.String(),
          isPublic: t.Boolean(),
          isSelected: t.Boolean(),
        },
        { additionalProperties: false },
      ),
    { $id: "Photo" },
  ),
);

export const PhotoWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            { id: t.Integer(), uid: t.String(), title: t.String() },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [
            t.Object({ id: t.Integer() }),
            t.Object({ uid: t.String() }),
            t.Object({ title: t.String() }),
          ],
          { additionalProperties: false },
        ),
        t.Partial(
          t.Object({
            AND: t.Union([
              Self,
              t.Array(Self, { additionalProperties: false }),
            ]),
            NOT: t.Union([
              Self,
              t.Array(Self, { additionalProperties: false }),
            ]),
            OR: t.Array(Self, { additionalProperties: false }),
          }),
          { additionalProperties: false },
        ),
        t.Partial(
          t.Object(
            {
              id: t.Integer(),
              uid: t.String(),
              title: t.String(),
              src: t.String(),
              description: t.String(),
              location: t.String(),
              shootTime: t.Date(),
              createTime: t.Date(),
              updateTime: t.Date(),
              exif: t.Any(),
              author: t.String(),
              isPublic: t.Boolean(),
              isSelected: t.Boolean(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "Photo" },
);

export const PhotoSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      uid: t.Boolean(),
      title: t.Boolean(),
      src: t.Boolean(),
      description: t.Boolean(),
      location: t.Boolean(),
      shootTime: t.Boolean(),
      createTime: t.Boolean(),
      updateTime: t.Boolean(),
      exif: t.Boolean(),
      author: t.Boolean(),
      isPublic: t.Boolean(),
      isSelected: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const PhotoInclude = t.Partial(
  t.Object({ _count: t.Boolean() }, { additionalProperties: false }),
);

export const PhotoOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      uid: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      title: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      src: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      description: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      location: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      shootTime: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createTime: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      updateTime: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      exif: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      author: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      isPublic: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      isSelected: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const Photo = t.Composite([PhotoPlain, PhotoRelations], {
  additionalProperties: false,
});

export const PhotoInputCreate = t.Composite(
  [PhotoPlainInputCreate, PhotoRelationsInputCreate],
  { additionalProperties: false },
);

export const PhotoInputUpdate = t.Composite(
  [PhotoPlainInputUpdate, PhotoRelationsInputUpdate],
  { additionalProperties: false },
);
