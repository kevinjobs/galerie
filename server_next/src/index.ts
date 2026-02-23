import cors from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import photo from "./modules/photo";
import auth from "./modules/auth";
import user from "./modules/user";
import {
  PermissionError,
  UniqueError,
  NotFoundError,
  WrongPasswordError,
} from "./errors";

export const app = new Elysia()
  .error({
    PermissionError,
    UniqueError,
    NotFoundError,
    WrongPasswordError,
    Error,
  })
  .onError(({ error }) => error)
  .use(cors())
  .use(openapi())
  .use(auth)
  .use(photo)
  .use(user)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

export type App = typeof app;
