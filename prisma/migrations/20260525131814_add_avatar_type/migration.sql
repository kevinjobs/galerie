-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'photo';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT;
