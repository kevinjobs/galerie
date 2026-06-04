import "dotenv/config";
import { db } from "../prisma/lib/db";
import { ROLES, ROLE_PERMISSIONS } from "../prisma/lib/roles";

const ALL_PHOTO_PERMS = ROLE_PERMISSIONS.contributor;

async function migrateRoles() {
  console.log("=== Role & Photo Ownership Migration ===\n");

  const users = await db.user.findMany();
  console.log(`Found ${users.length} users\n`);

  let superuserAssigned = false;
  const roleCounts: Record<string, number> = { admin: 0, contributor: 0, viewer: 0 };

  for (const user of users) {
    const perms = (user.permissions as string[] | null) ?? [];
    let inferredRole: string;

    const hasAllPerms = ROLE_PERMISSIONS.admin.every((p) => perms.includes(p));
    const hasAllPhotoPerms = ALL_PHOTO_PERMS.every((p) => perms.includes(p));

    if (hasAllPerms) {
      inferredRole = ROLES.ADMIN;
      if (!superuserAssigned) {
        superuserAssigned = true;
        await db.user.update({
          where: { id: user.id },
          data: { role: ROLES.ADMIN, isSuperuser: true },
        });
        console.log(`  [SUPERUSER] ${user.name} (${user.email})`);
      } else {
        await db.user.update({
          where: { id: user.id },
          data: { role: ROLES.ADMIN },
        });
        console.log(`  [ADMIN] ${user.name} (${user.email})`);
      }
    } else if (hasAllPhotoPerms) {
      inferredRole = ROLES.CONTRIBUTOR;
      await db.user.update({
        where: { id: user.id },
        data: { role: ROLES.CONTRIBUTOR },
      });
      console.log(`  [CONTRIBUTOR] ${user.name} (${user.email})`);
    } else {
      inferredRole = ROLES.VIEWER;
      await db.user.update({
        where: { id: user.id },
        data: { role: ROLES.VIEWER },
      });
      console.log(`  [VIEWER] ${user.name} (${user.email})`);
    }

    roleCounts[inferredRole] = (roleCounts[inferredRole] ?? 0) + 1;
  }

  console.log(`\n--- User role summary ---`);
  console.log(`  Admin: ${roleCounts.admin}`);
  console.log(`  Contributor: ${roleCounts.contributor}`);
  console.log(`  Viewer: ${roleCounts.viewer}`);

  // Try to match Photo.author to User for userId population
  console.log("\n--- Photo ownership matching ---");
  const photos = await db.photo.findMany({
    where: { userId: null },
    select: { id: true, author: true, uid: true },
  });

  let matched = 0;
  let unmatched = 0;

  for (const photo of photos) {
    if (!photo.author) {
      unmatched++;
      continue;
    }

    const author = photo.author.trim();
    const owner = await db.user.findFirst({
      where: {
        OR: [
          { name: author },
          { nickname: author },
        ],
      },
    });

    if (owner) {
      await db.photo.update({
        where: { id: photo.id },
        data: { userId: owner.id },
      });
      matched++;
    } else {
      unmatched++;
    }
  }

  console.log(`  Total photos without owner: ${photos.length}`);
  console.log(`  Matched: ${matched}`);
  console.log(`  Unmatched: ${unmatched}`);

  console.log("\n=== Migration complete ===");
}

migrateRoles()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
