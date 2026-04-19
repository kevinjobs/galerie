import "dotenv/config";
import { db } from "../prisma/lib/db";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const ALL_PERMISSIONS = [
  "photo.create",
  "photo.get",
  "photo.update",
  "photo.delete",
  "photo.upload",
  "user.create",
  "user.get",
  "user.update",
  "user.delete",
];

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

async function createSuperuser() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.log("Usage: npx tsx scripts/createSuperuser.ts <email> <password>");
    console.log("Example: npx tsx scripts/createSuperuser.ts admin@example.com mypassword123");
    process.exit(1);
  }

  try {
    const hashedPassword = await hashPassword(password);

    // 检查是否已存在用户
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    let user;
    if (existingUser) {
      // 更新现有用户
      user = await db.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          nickname: "Super Admin",
          permissions: ALL_PERMISSIONS,
        },
      });
      console.log("✅ User updated successfully!");
    } else {
      // 创建新用户
      user = await db.user.create({
        data: {
          name: "admin",
          email,
          password: hashedPassword,
          nickname: "Super Admin",
          permissions: ALL_PERMISSIONS,
        },
      });
      console.log("✅ Superuser created successfully!");
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign(userWithoutPassword, process.env.JWT_SECRET || "default-secret-key", { expiresIn: "7d" });

    console.log("\nUser info:");
    console.log(JSON.stringify(userWithoutPassword, null, 2));
    console.log("\nJWT Token:");
    console.log(token);
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Error:", error.message);
    } else {
      console.error("❌ Unknown error");
    }
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

createSuperuser();
