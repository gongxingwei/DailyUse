/*
  Warnings:

  - You are about to drop the column `is_archived` on the `goal_folders` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `goal_folders` table. All the data in the column will be lost.
  - You are about to drop the column `parent_uuid` on the `goal_folders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."goal_folders" DROP CONSTRAINT "goal_folders_parent_uuid_fkey";

-- DropIndex
DROP INDEX "public"."goal_folders_account_uuid_is_archived_idx";

-- DropIndex
DROP INDEX "public"."goal_folders_account_uuid_order_idx";

-- DropIndex
DROP INDEX "public"."goal_folders_parent_uuid_idx";

-- AlterTable
ALTER TABLE "goal_folders" DROP COLUMN "is_archived",
DROP COLUMN "order",
DROP COLUMN "parent_uuid",
ADD COLUMN     "completed_goal_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "folder_type" TEXT,
ADD COLUMN     "goal_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_system_folder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parent_folder_uuid" TEXT,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "goal_folders_parent_folder_uuid_idx" ON "goal_folders"("parent_folder_uuid");

-- CreateIndex
CREATE INDEX "goal_folders_account_uuid_deleted_at_idx" ON "goal_folders"("account_uuid", "deleted_at");

-- CreateIndex
CREATE INDEX "goal_folders_account_uuid_sort_order_idx" ON "goal_folders"("account_uuid", "sort_order");

-- AddForeignKey
ALTER TABLE "goal_folders" ADD CONSTRAINT "goal_folders_parent_folder_uuid_fkey" FOREIGN KEY ("parent_folder_uuid") REFERENCES "goal_folders"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;
