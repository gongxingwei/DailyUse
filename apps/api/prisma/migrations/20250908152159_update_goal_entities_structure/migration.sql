/*
  Warnings:

  - You are about to drop the column `category_uuid` on the `goal_directories` table. All the data in the column will be lost.
  - You are about to drop the column `sort_key` on the `goal_directories` table. All the data in the column will be lost.
  - You are about to drop the column `sort_order` on the `goal_directories` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `goal_directories` table. All the data in the column will be lost.
  - You are about to drop the column `is_verified` on the `goal_records` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `goal_records` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `goal_records` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `goal_records` table. All the data in the column will be lost.
  - You are about to drop the column `verified_at` on the `goal_records` table. All the data in the column will be lost.
  - You are about to drop the column `verified_by` on the `goal_records` table. All the data in the column will be lost.
  - You are about to drop the column `account_uuid` on the `goal_relationships` table. All the data in the column will be lost.
  - You are about to drop the column `account_uuid` on the `goal_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `achievements` on the `goal_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `adjustment_recommendations` on the `goal_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `challenges` on the `goal_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `executive_rating` on the `goal_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `goal_reasonableness_rating` on the `goal_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `learnings` on the `goal_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `goal_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `next_steps` on the `goal_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `progress_rating` on the `goal_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `review_type` on the `goal_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `account_uuid` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `attachments` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `category_uuid` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `directory_uuid` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `feasibility_analysis` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `goal_type` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `motive_analysis` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `completed_at` on the `key_results` table. All the data in the column will be lost.
  - You are about to drop the column `deadline` on the `key_results` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `key_results` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `key_results` table. All the data in the column will be lost.
  - You are about to drop the column `progress_percentage` on the `key_results` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `key_results` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `key_results` table. All the data in the column will be lost.
  - Made the column `key_result_uuid` on table `goal_records` required. This step will fail if there are existing NULL values in that column.
  - Made the column `value` on table `goal_records` required. This step will fail if there are existing NULL values in that column.
  - Made the column `unit` on table `key_results` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."goal_directories" DROP CONSTRAINT "goal_directories_category_uuid_fkey";

-- DropForeignKey
ALTER TABLE "public"."goal_records" DROP CONSTRAINT "goal_records_key_result_uuid_fkey";

-- DropForeignKey
ALTER TABLE "public"."goal_relationships" DROP CONSTRAINT "goal_relationships_account_uuid_fkey";

-- DropForeignKey
ALTER TABLE "public"."goal_reviews" DROP CONSTRAINT "goal_reviews_account_uuid_fkey";

-- DropForeignKey
ALTER TABLE "public"."goals" DROP CONSTRAINT "goals_account_uuid_fkey";

-- DropForeignKey
ALTER TABLE "public"."goals" DROP CONSTRAINT "goals_category_uuid_fkey";

-- DropForeignKey
ALTER TABLE "public"."goals" DROP CONSTRAINT "goals_directory_uuid_fkey";

-- DropIndex
DROP INDEX "public"."goal_directories_category_uuid_idx";

-- DropIndex
DROP INDEX "public"."goal_directories_sort_order_idx";

-- DropIndex
DROP INDEX "public"."goal_relationships_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."goal_reviews_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."goal_reviews_review_type_idx";

-- DropIndex
DROP INDEX "public"."goals_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."goals_category_uuid_idx";

-- DropIndex
DROP INDEX "public"."goals_directory_uuid_idx";

-- DropIndex
DROP INDEX "public"."goals_goal_type_idx";

-- DropIndex
DROP INDEX "public"."goals_priority_idx";

-- DropIndex
DROP INDEX "public"."goals_status_idx";

-- DropIndex
DROP INDEX "public"."key_results_completed_at_idx";

-- DropIndex
DROP INDEX "public"."key_results_deadline_idx";

-- DropIndex
DROP INDEX "public"."key_results_priority_idx";

-- DropIndex
DROP INDEX "public"."key_results_status_idx";

-- AlterTable
ALTER TABLE "public"."goal_directories" DROP COLUMN "category_uuid",
DROP COLUMN "sort_key",
DROP COLUMN "sort_order",
DROP COLUMN "status",
ADD COLUMN     "lifecycle" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "sort_config" TEXT NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "public"."goal_records" DROP COLUMN "is_verified",
DROP COLUMN "metadata",
DROP COLUMN "notes",
DROP COLUMN "updated_at",
DROP COLUMN "verified_at",
DROP COLUMN "verified_by",
ADD COLUMN     "note" TEXT,
ALTER COLUMN "key_result_uuid" SET NOT NULL,
ALTER COLUMN "value" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."goal_relationships" DROP COLUMN "account_uuid";

-- AlterTable
ALTER TABLE "public"."goal_reviews" DROP COLUMN "account_uuid",
DROP COLUMN "achievements",
DROP COLUMN "adjustment_recommendations",
DROP COLUMN "challenges",
DROP COLUMN "executive_rating",
DROP COLUMN "goal_reasonableness_rating",
DROP COLUMN "learnings",
DROP COLUMN "metadata",
DROP COLUMN "next_steps",
DROP COLUMN "progress_rating",
DROP COLUMN "review_type",
ADD COLUMN     "content" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "rating" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'weekly';

-- AlterTable
ALTER TABLE "public"."goals" DROP COLUMN "account_uuid",
DROP COLUMN "attachments",
DROP COLUMN "category_uuid",
DROP COLUMN "directory_uuid",
DROP COLUMN "feasibility_analysis",
DROP COLUMN "goal_type",
DROP COLUMN "icon",
DROP COLUMN "motive_analysis",
DROP COLUMN "notes",
DROP COLUMN "priority",
DROP COLUMN "status",
DROP COLUMN "tags",
ADD COLUMN     "dir_uuid" TEXT,
ADD COLUMN     "lifecycle" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "metadata" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "public"."key_results" DROP COLUMN "completed_at",
DROP COLUMN "deadline",
DROP COLUMN "notes",
DROP COLUMN "priority",
DROP COLUMN "progress_percentage",
DROP COLUMN "status",
DROP COLUMN "tags",
ADD COLUMN     "lifecycle" TEXT NOT NULL DEFAULT '{}',
ALTER COLUMN "unit" SET NOT NULL,
ALTER COLUMN "weight" SET DEFAULT 1.0,
ALTER COLUMN "weight" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "goal_reviews_type_idx" ON "public"."goal_reviews"("type");

-- CreateIndex
CREATE INDEX "goals_dir_uuid_idx" ON "public"."goals"("dir_uuid");

-- AddForeignKey
ALTER TABLE "public"."goals" ADD CONSTRAINT "goals_dir_uuid_fkey" FOREIGN KEY ("dir_uuid") REFERENCES "public"."goal_directories"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goal_records" ADD CONSTRAINT "goal_records_key_result_uuid_fkey" FOREIGN KEY ("key_result_uuid") REFERENCES "public"."key_results"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
