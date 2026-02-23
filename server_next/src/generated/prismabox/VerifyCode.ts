import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const VerifyCodePlain = t.Object(
  {
    id: t.Integer(),
    uid: t.String(),
    email: t.String(),
    code: t.String(),
    createTime: t.Date(),
  },
  { additionalProperties: false },
);

export const VerifyCodeRelations = t.Object(
  {},
  { additionalProperties: false },
);

export const VerifyCodePlainInputCreate = t.Object(
  { email: t.String(), code: t.String(), createTime: t.Optional(t.Date()) },
  { additionalProperties: false },
);

export const VerifyCodePlainInputUpdate = t.Object(
  {
    email: t.Optional(t.String()),
    code: t.Optional(t.String()),
    createTime: t.Optional(t.Date()),
  },
  { additionalProperties: false },
);

export const VerifyCodeRelationsInputCreate = t.Object(
  {},
  { additionalProperties: false },
);

export const VerifyCodeRelationsInputUpdate = t.Partial(
  t.Object({}, { additionalProperties: false }),
);

export const VerifyCodeWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.Integer(),
          uid: t.String(),
          email: t.String(),
          code: t.String(),
          createTime: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "VerifyCode" },
  ),
);

export const VerifyCodeWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            { id: t.Integer(), uid: t.String() },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [t.Object({ id: t.Integer() }), t.Object({ uid: t.String() })],
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
              email: t.String(),
              code: t.String(),
              createTime: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "VerifyCode" },
);

export const VerifyCodeSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      uid: t.Boolean(),
      email: t.Boolean(),
      code: t.Boolean(),
      createTime: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const VerifyCodeInclude = t.Partial(
  t.Object({ _count: t.Boolean() }, { additionalProperties: false }),
);

export const VerifyCodeOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      uid: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      email: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      code: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createTime: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const VerifyCode = t.Composite([VerifyCodePlain, VerifyCodeRelations], {
  additionalProperties: false,
});

export const VerifyCodeInputCreate = t.Composite(
  [VerifyCodePlainInputCreate, VerifyCodeRelationsInputCreate],
  { additionalProperties: false },
);

export const VerifyCodeInputUpdate = t.Composite(
  [VerifyCodePlainInputUpdate, VerifyCodeRelationsInputUpdate],
  { additionalProperties: false },
);
