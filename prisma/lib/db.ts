import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function parseDatabaseUrl(url: string) {
  // 支持 postgres:// 和 postgresql:// 前缀
  const match = url.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(?:\?(.*))?/);
  if (!match) {
    throw new Error("Invalid DATABASE_URL format");
  }
  
  // 解析查询参数
  const queryParams = match[6] ? Object.fromEntries(
    match[6].split('&').map(param => {
      const [key, value] = param.split('=');
      return [key, decodeURIComponent(value)];
    })
  ) : {};
  
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
    ssl: queryParams.sslmode === 'require'
  };
}

const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL || "");

const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  ssl: dbConfig.ssl ? true : false
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
