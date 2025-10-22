/*
  Warnings:

  - You are about to drop the column `language` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `notifications` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `preferences` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `privacy` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `theme` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `user_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_settings" DROP COLUMN "language",
DROP COLUMN "notifications",
DROP COLUMN "preferences",
DROP COLUMN "privacy",
DROP COLUMN "theme",
DROP COLUMN "timezone",
ADD COLUMN     "appearance_accent_color" TEXT NOT NULL DEFAULT '#3B82F6',
ADD COLUMN     "appearance_compact_mode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "appearance_font_family" TEXT,
ADD COLUMN     "appearance_font_size" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "appearance_theme" TEXT NOT NULL DEFAULT 'AUTO',
ADD COLUMN     "experimental_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "experimental_features" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "locale_currency" TEXT NOT NULL DEFAULT 'CNY',
ADD COLUMN     "locale_date_format" TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
ADD COLUMN     "locale_language" TEXT NOT NULL DEFAULT 'zh-CN',
ADD COLUMN     "locale_time_format" TEXT NOT NULL DEFAULT '24H',
ADD COLUMN     "locale_timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
ADD COLUMN     "locale_week_starts_on" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "privacy_allow_search_by_email" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "privacy_allow_search_by_phone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "privacy_profile_visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN     "privacy_share_usage_data" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "privacy_show_online_status" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shortcuts_custom" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "shortcuts_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "workflow_auto_save" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "workflow_auto_save_interval" INTEGER NOT NULL DEFAULT 30000,
ADD COLUMN     "workflow_confirm_before_delete" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "workflow_default_goal_view" TEXT NOT NULL DEFAULT 'LIST',
ADD COLUMN     "workflow_default_schedule_view" TEXT NOT NULL DEFAULT 'WEEK',
ADD COLUMN     "workflow_default_task_view" TEXT NOT NULL DEFAULT 'LIST';

-- CreateTable
CREATE TABLE "key_results" (
    "uuid" TEXT NOT NULL,
    "goal_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "value_type" TEXT NOT NULL,
    "aggregation_method" TEXT NOT NULL,
    "target_value" DOUBLE PRECISION NOT NULL,
    "current_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "key_results_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "goal_records" (
    "uuid" TEXT NOT NULL,
    "key_result_uuid" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_records_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "goal_reviews" (
    "uuid" TEXT NOT NULL,
    "goal_uuid" TEXT NOT NULL,
    "review_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "achievements" TEXT,
    "challenges" TEXT,
    "lessons_learned" TEXT,
    "next_steps" TEXT,
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_reviews_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "key_results_goal_uuid_idx" ON "key_results"("goal_uuid");

-- CreateIndex
CREATE INDEX "goal_records_key_result_uuid_idx" ON "goal_records"("key_result_uuid");

-- CreateIndex
CREATE INDEX "goal_records_recorded_at_idx" ON "goal_records"("recorded_at");

-- CreateIndex
CREATE INDEX "goal_reviews_goal_uuid_idx" ON "goal_reviews"("goal_uuid");

-- CreateIndex
CREATE INDEX "goal_reviews_created_at_idx" ON "goal_reviews"("created_at");

-- AddForeignKey
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_goal_uuid_fkey" FOREIGN KEY ("goal_uuid") REFERENCES "goals"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_records" ADD CONSTRAINT "goal_records_key_result_uuid_fkey" FOREIGN KEY ("key_result_uuid") REFERENCES "key_results"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_reviews" ADD CONSTRAINT "goal_reviews_goal_uuid_fkey" FOREIGN KEY ("goal_uuid") REFERENCES "goals"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
