/*
  Warnings:

  - You are about to drop the `admins` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[login]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "login" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'client',
ALTER COLUMN "phone" SET DEFAULT '',
ALTER COLUMN "email" DROP NOT NULL;

-- DropTable
DROP TABLE "admins";

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");
