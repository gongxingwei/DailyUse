/*
  Warnings:

  - You are about to drop the column `send_attempts` on the `notification_channels` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."notification_channels" DROP COLUMN "send_attempts",
ADD COLUMN     "retry_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."notifications" ADD COLUMN     "is_read" BOOLEAN NOT NULL DEFAULT false;
