/*
  Warnings:

  - You are about to drop the column `provider` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `provider_account_id` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `session_state` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `token_type` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `order_id` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `store_id` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `withdraw_via` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `payment_transactions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `paid_amount` on the `payment_transactions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to drop the `ucodes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_payment_methods` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[provider_id,account_id]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `account_id` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider_id` to the `accounts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ucodes" DROP CONSTRAINT "ucodes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_payment_methods" DROP CONSTRAINT "user_payment_methods_user_id_fkey";

-- DropIndex
DROP INDEX "accounts_provider_provider_account_id_key";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "provider",
DROP COLUMN "provider_account_id",
DROP COLUMN "session_state",
DROP COLUMN "token_type",
DROP COLUMN "type",
ADD COLUMN     "access_token_expires_at" TIMESTAMP(3),
ADD COLUMN     "account_id" TEXT NOT NULL,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "provider_id" TEXT NOT NULL,
ADD COLUMN     "refresh_token_expires_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "payment_transactions" DROP COLUMN "order_id",
DROP COLUMN "store_id",
DROP COLUMN "type",
DROP COLUMN "withdraw_via",
ADD COLUMN     "booking_id" TEXT,
ADD COLUMN     "receipt_url" TEXT,
ADD COLUMN     "stripe_charge_id" TEXT,
ADD COLUMN     "stripe_checkout_session_id" TEXT,
ADD COLUMN     "stripe_customer_id" TEXT,
ADD COLUMN     "stripe_payment_intent_id" TEXT,
ALTER COLUMN "provider" SET DEFAULT 'stripe',
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "currency" SET DEFAULT 'usd',
ALTER COLUMN "paid_amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "website_link" TEXT;

-- DropTable
DROP TABLE "ucodes";

-- DropTable
DROP TABLE "user_payment_methods";

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exhibitions" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "booking_stated_at" TIMESTAMP(3),
    "booking_ended_at" TIMESTAMP(3),
    "title" TEXT,
    "description" TEXT,
    "slug" TEXT,

    CONSTRAINT "exhibitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stand_categories" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "title" TEXT,
    "slug" TEXT NOT NULL,
    "size" TEXT,
    "price_in_minor_unit" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "vat_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "exhibition_id" TEXT,

    CONSTRAINT "stand_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stands" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "title" TEXT,
    "stand_number" INTEGER,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "is_available" SMALLINT NOT NULL DEFAULT 1,
    "exhibition_id" TEXT,
    "category_id" TEXT,

    CONSTRAINT "stands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "status" SMALLINT NOT NULL DEFAULT 1,
    "user_name" TEXT,
    "company_name" TEXT,
    "company_address" TEXT,
    "email" TEXT,
    "phone_number" TEXT,
    "sub_total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "vat_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "payment_status" TEXT DEFAULT 'unpaid',
    "payment_method" TEXT DEFAULT 'stripe',
    "currency" TEXT DEFAULT 'usd',
    "stripe_customer_id" TEXT,
    "stripe_payment_intent_id" TEXT,
    "stripe_checkout_session_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "user_id" TEXT,
    "stand_id" TEXT,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "companyName" TEXT,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE INDEX "verifications_expires_at_idx" ON "verifications"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "stand_categories_slug_key" ON "stand_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "stands_slug_key" ON "stands"("slug");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE INDEX "accounts_provider_id_idx" ON "accounts"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_id_account_id_key" ON "accounts"("provider_id", "account_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stand_categories" ADD CONSTRAINT "stand_categories_exhibition_id_fkey" FOREIGN KEY ("exhibition_id") REFERENCES "exhibitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stands" ADD CONSTRAINT "stands_exhibition_id_fkey" FOREIGN KEY ("exhibition_id") REFERENCES "exhibitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stands" ADD CONSTRAINT "stands_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "stand_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_stand_id_fkey" FOREIGN KEY ("stand_id") REFERENCES "stands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
