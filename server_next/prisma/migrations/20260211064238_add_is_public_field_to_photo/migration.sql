-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Photo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "createTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" DATETIME,
    "exif" JSONB,
    "author" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Photo" ("author", "createTime", "exif", "id", "src", "title", "updateTime") SELECT "author", "createTime", "exif", "id", "src", "title", "updateTime" FROM "Photo";
DROP TABLE "Photo";
ALTER TABLE "new_Photo" RENAME TO "Photo";
CREATE UNIQUE INDEX "Photo_title_key" ON "Photo"("title");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
