import { PrismaClient } from "./generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const dbUrl = `${process.env.DATABASE_URL}`;

const adapter = new PrismaLibSql({
  url: dbUrl ?? "file:./dev.db",
});

const db = new PrismaClient({
  adapter,
  omit: {
    user: {
      password: true,
    },
  } as const,
});

export { db };
