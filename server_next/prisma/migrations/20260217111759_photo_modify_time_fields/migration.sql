-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Photo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "shootTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" DATETIME,
    "exif" JSONB,
    "author" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isSelected" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Photo" ("author", "createTime", "description", "exif", "id", "isPublic", "isSelected", "location", "shootTime", "src", "title", "uid", "updateTime") SELECT "author", "createTime", "description", "exif", "id", "isPublic", "isSelected", "location", coalesce("shootTime", CURRENT_TIMESTAMP) AS "shootTime", "src", "title", "uid", "updateTime" FROM "Photo";
DROP TABLE "Photo";
ALTER TABLE "new_Photo" RENAME TO "Photo";
CREATE UNIQUE INDEX "Photo_uid_key" ON "Photo"("uid");
CREATE UNIQUE INDEX "Photo_title_key" ON "Photo"("title");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
