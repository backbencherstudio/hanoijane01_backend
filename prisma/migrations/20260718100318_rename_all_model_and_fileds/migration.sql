/*
  Warnings:

  - You are about to drop the column `address` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `availability` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `date_of_birth` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `domain` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `zip_code` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `_PermissionToRole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `attachments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contacts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conversations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `faqs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permission_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `social_medias` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `website_infos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PermissionToRole" DROP CONSTRAINT "_PermissionToRole_A_fkey";

-- DropForeignKey
ALTER TABLE "_PermissionToRole" DROP CONSTRAINT "_PermissionToRole_B_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_creator_id_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_participant_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_attachment_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_receiver_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "permission_roles" DROP CONSTRAINT "permission_roles_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "permission_roles" DROP CONSTRAINT "permission_roles_role_id_fkey";

-- DropForeignKey
ALTER TABLE "role_users" DROP CONSTRAINT "role_users_role_id_fkey";

-- DropForeignKey
ALTER TABLE "role_users" DROP CONSTRAINT "role_users_user_id_fkey";

-- DropForeignKey
ALTER TABLE "roles" DROP CONSTRAINT "roles_user_id_fkey";

-- DropIndex
DROP INDEX "users_domain_key";

-- DropIndex
DROP INDEX "users_username_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "address",
DROP COLUMN "availability",
DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "date_of_birth",
DROP COLUMN "domain",
DROP COLUMN "first_name",
DROP COLUMN "gender",
DROP COLUMN "last_name",
DROP COLUMN "state",
DROP COLUMN "username",
DROP COLUMN "zip_code",
ADD COLUMN     "company_address" TEXT,
ADD COLUMN     "company_name" VARCHAR(255),
ALTER COLUMN "name" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "_PermissionToRole";

-- DropTable
DROP TABLE "attachments";

-- DropTable
DROP TABLE "contacts";

-- DropTable
DROP TABLE "conversations";

-- DropTable
DROP TABLE "faqs";

-- DropTable
DROP TABLE "messages";

-- DropTable
DROP TABLE "permission_roles";

-- DropTable
DROP TABLE "permissions";

-- DropTable
DROP TABLE "role_users";

-- DropTable
DROP TABLE "roles";

-- DropTable
DROP TABLE "social_medias";

-- DropTable
DROP TABLE "website_infos";

-- DropEnum
DROP TYPE "MessageStatus";
