-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "on_behalf_of" TEXT,
ADD COLUMN     "signature_path" TEXT,
ADD COLUMN     "terms_and_conditions_accepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "company_phone_number" TEXT;

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_name" TEXT,
    "file_path" TEXT NOT NULL,
    "file_type" TEXT,
    "mime_type" TEXT,
    "byte_size" BIGINT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
