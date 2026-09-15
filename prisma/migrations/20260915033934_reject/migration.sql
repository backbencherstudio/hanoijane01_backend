/*
  Warnings:

  - You are about to drop the column `rejected_at` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `rejection_reason` on the `payment_transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "rejection_reason" TEXT;

-- AlterTable
ALTER TABLE "payment_transactions" DROP COLUMN "rejected_at",
DROP COLUMN "rejection_reason";
