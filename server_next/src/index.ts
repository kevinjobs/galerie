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
import { listen } from "bun";

const app = new Elysia()
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
  .use(user);

if (process.env.NODE_ENV === "development") {
  app.listen(3000);
  console.log(`Server running on http://localhost:3000`);
}

export default app;

export type App = typeof app;
