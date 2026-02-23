import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const UserPlain = t.Object(
  {
    id: t.Integer(),
    uid: t.String(),
    name: t.String(),
    nickname: __nullable__(t.String()),
    email: t.String(),
    password: t.String(),
    permissions: __nullable__(t.Any()),
  },
  { additionalProperties: false },
);

export const UserRelations = t.Object({}, { additionalProperties: false });

export const UserPlainInputCreate = t.Object(
  {
    name: t.String(),
    nickname: t.Optional(__nullable__(t.String())),
    email: t.String(),
    password: t.String(),
    permissions: t.Optional(__nullable__(t.Any())),
  },
  { additionalProperties: false },
);

export const UserPlainInputUpdate = t.Object(
  {
    name: t.Optional(t.String()),
    nickname: t.Optional(__nullable__(t.String())),
    email: t.Optional(t.String()),
    password: t.Optional(t.String()),
    permissions: t.Optional(__nullable__(t.Any())),
  },
  { additionalProperties: false },
);

export const UserRelationsInputCreate = t.Object(
  {},
  { additionalProperties: false },
);

export const UserRelationsInputUpdate = t.Partial(
  t.Object({}, { additionalProperties: false }),
);

export const UserWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.Integer(),
          uid: t.String(),
          name: t.String(),
          nickname: t.String(),
          email: t.String(),
          password: t.String(),
          permissions: t.Any(),
        },
        { additionalProperties: false },
      ),
    { $id: "User" },
  ),
);

export const UserWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            {
              id: t.Integer(),
              uid: t.String(),
              name: t.String(),
              email: t.String(),
            },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [
            t.Object({ id: t.Integer() }),
            t.Object({ uid: t.String() }),
            t.Object({ name: t.String() }),
            t.Object({ email: t.String() }),
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
              name: t.String(),
              nickname: t.String(),
              email: t.String(),
              password: t.String(),
              permissions: t.Any(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "User" },
);

export const UserSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      uid: t.Boolean(),
      name: t.Boolean(),
      nickname: t.Boolean(),
      email: t.Boolean(),
      password: t.Boolean(),
      permissions: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const UserInclude = t.Partial(
  t.Object({ _count: t.Boolean() }, { additionalProperties: false }),
);

export const UserOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      uid: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      name: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      nickname: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      email: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      password: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      permissions: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const User = t.Composite([UserPlain, UserRelations], {
  additionalProperties: false,
});

export const UserInputCreate = t.Composite(
  [UserPlainInputCreate, UserRelationsInputCreate],
  { additionalProperties: false },
);

export const UserInputUpdate = t.Composite(
  [UserPlainInputUpdate, UserRelationsInputUpdate],
  { additionalProperties: false },
);
