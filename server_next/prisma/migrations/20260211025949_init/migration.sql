-- CreateTable
CREATE TABLE "Photo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "src" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Photo_title_key" ON "Photo"("title");
