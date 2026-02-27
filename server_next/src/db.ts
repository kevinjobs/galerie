import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({
  connectionString,
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
