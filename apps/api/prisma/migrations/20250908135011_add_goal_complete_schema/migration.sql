/*
  Warnings:

  - You are about to drop the column `due_date` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `goals` table. All the data in the column will be lost.
  - The `priority` column on the `goals` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `color` to the `goals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_time` to the `goals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `goals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `goals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."goals" DROP COLUMN "due_date",
DROP COLUMN "title",
ADD COLUMN     "analysis" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "attachments" TEXT,
ADD COLUMN     "category_uuid" TEXT,
ADD COLUMN     "color" TEXT NOT NULL,
ADD COLUMN     "directory_uuid" TEXT,
ADD COLUMN     "end_time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "feasibility_analysis" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "goal_type" TEXT NOT NULL DEFAULT 'personal',
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "motive_analysis" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "start_time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "tags" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "status" SET DEFAULT 'draft',
DROP COLUMN "priority",
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "public"."goal_directories" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "parent_uuid" TEXT,
    "category_uuid" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sort_key" TEXT NOT NULL DEFAULT 'default',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_directories_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."goal_categories" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "parent_uuid" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_categories_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."key_results" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "goal_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "target_value" DOUBLE PRECISION NOT NULL,
    "current_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT,
    "calculation_method" TEXT NOT NULL DEFAULT 'sum',
    "weight" INTEGER NOT NULL DEFAULT 5,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'active',
    "progress_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "deadline" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "tags" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "key_results_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."goal_records" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "goal_uuid" TEXT NOT NULL,
    "key_result_uuid" TEXT,
    "value" DOUBLE PRECISION,
    "notes" TEXT,
    "metadata" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_records_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."goal_reviews" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "goal_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "review_type" TEXT NOT NULL DEFAULT 'weekly',
    "review_date" TIMESTAMP(3) NOT NULL,
    "executive_rating" INTEGER,
    "progress_rating" INTEGER,
    "goal_reasonableness_rating" INTEGER,
    "achievements" TEXT,
    "challenges" TEXT,
    "learnings" TEXT,
    "next_steps" TEXT,
    "adjustment_recommendations" TEXT,
    "snapshot" TEXT NOT NULL DEFAULT '{}',
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_reviews_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."goal_relationships" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "source_goal_uuid" TEXT NOT NULL,
    "target_goal_uuid" TEXT NOT NULL,
    "relationship_type" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_relationships_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "goal_directories_account_uuid_idx" ON "public"."goal_directories"("account_uuid");

-- CreateIndex
CREATE INDEX "goal_directories_parent_uuid_idx" ON "public"."goal_directories"("parent_uuid");

-- CreateIndex
CREATE INDEX "goal_directories_category_uuid_idx" ON "public"."goal_directories"("category_uuid");

-- CreateIndex
CREATE INDEX "goal_directories_sort_order_idx" ON "public"."goal_directories"("sort_order");

-- CreateIndex
CREATE INDEX "goal_categories_account_uuid_idx" ON "public"."goal_categories"("account_uuid");

-- CreateIndex
CREATE INDEX "goal_categories_parent_uuid_idx" ON "public"."goal_categories"("parent_uuid");

-- CreateIndex
CREATE INDEX "goal_categories_sort_order_idx" ON "public"."goal_categories"("sort_order");

-- CreateIndex
CREATE INDEX "goal_categories_is_system_idx" ON "public"."goal_categories"("is_system");

-- CreateIndex
CREATE INDEX "key_results_account_uuid_idx" ON "public"."key_results"("account_uuid");

-- CreateIndex
CREATE INDEX "key_results_goal_uuid_idx" ON "public"."key_results"("goal_uuid");

-- CreateIndex
CREATE INDEX "key_results_status_idx" ON "public"."key_results"("status");

-- CreateIndex
CREATE INDEX "key_results_priority_idx" ON "public"."key_results"("priority");

-- CreateIndex
CREATE INDEX "key_results_weight_idx" ON "public"."key_results"("weight");

-- CreateIndex
CREATE INDEX "key_results_deadline_idx" ON "public"."key_results"("deadline");

-- CreateIndex
CREATE INDEX "key_results_completed_at_idx" ON "public"."key_results"("completed_at");

-- CreateIndex
CREATE INDEX "key_results_created_at_idx" ON "public"."key_results"("created_at");

-- CreateIndex
CREATE INDEX "goal_records_account_uuid_idx" ON "public"."goal_records"("account_uuid");

-- CreateIndex
CREATE INDEX "goal_records_goal_uuid_idx" ON "public"."goal_records"("goal_uuid");

-- CreateIndex
CREATE INDEX "goal_records_key_result_uuid_idx" ON "public"."goal_records"("key_result_uuid");

-- CreateIndex
CREATE INDEX "goal_records_created_at_idx" ON "public"."goal_records"("created_at");

-- CreateIndex
CREATE INDEX "goal_reviews_account_uuid_idx" ON "public"."goal_reviews"("account_uuid");

-- CreateIndex
CREATE INDEX "goal_reviews_goal_uuid_idx" ON "public"."goal_reviews"("goal_uuid");

-- CreateIndex
CREATE INDEX "goal_reviews_review_type_idx" ON "public"."goal_reviews"("review_type");

-- CreateIndex
CREATE INDEX "goal_reviews_review_date_idx" ON "public"."goal_reviews"("review_date");

-- CreateIndex
CREATE INDEX "goal_reviews_created_at_idx" ON "public"."goal_reviews"("created_at");

-- CreateIndex
CREATE INDEX "goal_relationships_account_uuid_idx" ON "public"."goal_relationships"("account_uuid");

-- CreateIndex
CREATE INDEX "goal_relationships_source_goal_uuid_idx" ON "public"."goal_relationships"("source_goal_uuid");

-- CreateIndex
CREATE INDEX "goal_relationships_target_goal_uuid_idx" ON "public"."goal_relationships"("target_goal_uuid");

-- CreateIndex
CREATE INDEX "goal_relationships_relationship_type_idx" ON "public"."goal_relationships"("relationship_type");

-- CreateIndex
CREATE UNIQUE INDEX "goal_relationships_source_goal_uuid_target_goal_uuid_relati_key" ON "public"."goal_relationships"("source_goal_uuid", "target_goal_uuid", "relationship_type");

-- CreateIndex
CREATE INDEX "goals_account_uuid_idx" ON "public"."goals"("account_uuid");

-- CreateIndex
CREATE INDEX "goals_directory_uuid_idx" ON "public"."goals"("directory_uuid");

-- CreateIndex
CREATE INDEX "goals_category_uuid_idx" ON "public"."goals"("category_uuid");

-- CreateIndex
CREATE INDEX "goals_status_idx" ON "public"."goals"("status");

-- CreateIndex
CREATE INDEX "goals_priority_idx" ON "public"."goals"("priority");

-- CreateIndex
CREATE INDEX "goals_goal_type_idx" ON "public"."goals"("goal_type");

-- CreateIndex
CREATE INDEX "goals_start_time_idx" ON "public"."goals"("start_time");

-- CreateIndex
CREATE INDEX "goals_end_time_idx" ON "public"."goals"("end_time");

-- CreateIndex
CREATE INDEX "goals_created_at_idx" ON "public"."goals"("created_at");

-- AddForeignKey
ALTER TABLE "public"."goals" ADD CONSTRAINT "goals_directory_uuid_fkey" FOREIGN KEY ("directory_uuid") REFERENCES "public"."goal_directories"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goals" ADD CONSTRAINT "goals_category_uuid_fkey" FOREIGN KEY ("category_uuid") REFERENCES "public"."goal_categories"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goal_directories" ADD CONSTRAINT "goal_directories_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goal_directories" ADD CONSTRAINT "goal_directories_parent_uuid_fkey" FOREIGN KEY ("parent_uuid") REFERENCES "public"."goal_directories"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goal_directories" ADD CONSTRAINT "goal_directories_category_uuid_fkey" FOREIGN KEY ("category_uuid") REFERENCES "public"."goal_categories"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goal_categories" ADD CONSTRAINT "goal_categories_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goal_categories" ADD CONSTRAINT "goal_categories_parent_uuid_fkey" FOREIGN KEY ("parent_uuid") REFERENCES "public"."goal_categories"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."key_results" ADD CONSTRAINT "key_results_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."key_results" ADD CONSTRAINT "key_results_goal_uuid_fkey" FOREIGN KEY ("goal_uuid") REFERENCES "public"."goals"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goal_records" ADD CONSTRAINT "goal_records_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goal_records" ADD CONSTRAINT "goal_records_goal_uuid_fkey" FOREIGN KEY ("goal_uuid") REFERENCES "public"."goals"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goal_records" ADD CONSTRAINT "goal_records_key_result_uuid_fkey" FOREIGN KEY ("key_result_uuid") REFERENCES "public"."key_results"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goal_reviews" ADD CONSTRAINT "goal_reviews_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goal_reviews" ADD CONSTRAINT "goal_reviews_goal_uuid_fkey" FOREIGN KEY ("goal_uuid") REFERENCES "public"."goals"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goal_relationships" ADD CONSTRAINT "goal_relationships_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goal_relationships" ADD CONSTRAINT "goal_relationships_source_goal_uuid_fkey" FOREIGN KEY ("source_goal_uuid") REFERENCES "public"."goals"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goal_relationships" ADD CONSTRAINT "goal_relationships_target_goal_uuid_fkey" FOREIGN KEY ("target_goal_uuid") REFERENCES "public"."goals"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
