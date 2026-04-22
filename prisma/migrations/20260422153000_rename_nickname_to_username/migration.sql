-- DropIndex
DROP INDEX "User_nickname_key";

-- AlterTable
ALTER TABLE "User" RENAME COLUMN "nickname" TO "username";

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
