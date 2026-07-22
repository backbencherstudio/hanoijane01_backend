/*
  Warnings:

  - You are about to drop the column `exhibition_id` on the `stand_categories` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "stand_categories" DROP CONSTRAINT "stand_categories_exhibition_id_fkey";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "vat_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "contacts" ALTER COLUMN "phoneNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "exhibitions" ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "stand_categories" DROP COLUMN "exhibition_id",
ADD COLUMN     "hall_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "company_bio" TEXT;

-- CreateTable
CREATE TABLE "halls" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "title" TEXT,
    "exhibition_id" TEXT,

    CONSTRAINT "halls_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "halls" ADD CONSTRAINT "halls_exhibition_id_fkey" FOREIGN KEY ("exhibition_id") REFERENCES "exhibitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stand_categories" ADD CONSTRAINT "stand_categories_hall_id_fkey" FOREIGN KEY ("hall_id") REFERENCES "halls"("id") ON DELETE SET NULL ON UPDATE CASCADE;
