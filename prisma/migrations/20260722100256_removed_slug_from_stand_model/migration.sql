/*
  Warnings:

  - You are about to drop the column `slug` on the `stands` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stand_number]` on the table `stands` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "stands_slug_key";

-- AlterTable
ALTER TABLE "stands" DROP COLUMN "slug",
ALTER COLUMN "stand_number" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "stands_stand_number_key" ON "stands"("stand_number");
