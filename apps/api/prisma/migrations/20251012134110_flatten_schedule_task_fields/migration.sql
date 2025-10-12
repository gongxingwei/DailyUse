/*
  Warnings:

  - You are about to drop the column `account_uuid` on the `schedule_executions` table. All the data in the column will be lost.
  - You are about to drop the column `completed_at` on the `schedule_executions` table. All the data in the column will be lost.
  - You are about to drop the column `duration_ms` on the `schedule_executions` table. All the data in the column will be lost.
  - You are about to drop the column `error_message` on the `schedule_executions` table. All the data in the column will be lost.
  - You are about to drop the column `started_at` on the `schedule_executions` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `schedule_executions` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `schedule_executions` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to drop the column `execution_history` on the `schedule_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `schedule_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `schedule_tasks` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `schedule_tasks` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `cron_expression` on the `schedule_tasks` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `name` on the `schedule_tasks` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `source_entity_id` on the `schedule_tasks` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `source_module` on the `schedule_tasks` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - Added the required column `execution_time` to the `schedule_executions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_uuid` to the `schedule_tasks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."schedule_executions" DROP CONSTRAINT "schedule_executions_account_uuid_fkey";

-- DropForeignKey
ALTER TABLE "public"."schedule_executions" DROP CONSTRAINT "schedule_executions_task_uuid_fkey";

-- DropIndex
DROP INDEX "public"."schedule_executions_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."schedule_executions_started_at_idx";

-- AlterTable
ALTER TABLE "public"."schedule_executions" DROP COLUMN "account_uuid",
DROP COLUMN "completed_at",
DROP COLUMN "duration_ms",
DROP COLUMN "error_message",
DROP COLUMN "started_at",
DROP COLUMN "updated_at",
ADD COLUMN     "accountUuid" TEXT,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "execution_time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "oldScheduleTaskUuid" TEXT,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "public"."schedule_tasks" DROP COLUMN "execution_history",
DROP COLUMN "metadata",
DROP COLUMN "version",
ADD COLUMN     "account_uuid" TEXT NOT NULL,
ADD COLUMN     "backoff_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
ADD COLUMN     "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "initial_delay_ms" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "last_execution_duration" INTEGER,
ADD COLUMN     "last_execution_status" VARCHAR(20),
ADD COLUMN     "max_delay_ms" INTEGER NOT NULL DEFAULT 60000,
ADD COLUMN     "max_executions" INTEGER,
ADD COLUMN     "max_retries" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "payload" JSONB,
ADD COLUMN     "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',
ADD COLUMN     "retryable_statuses" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "start_date" TIMESTAMP(3),
ADD COLUMN     "tags" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "timeout" INTEGER NOT NULL DEFAULT 30000,
ADD COLUMN     "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "cron_expression" DROP NOT NULL,
ALTER COLUMN "cron_expression" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "source_entity_id" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "source_module" SET DATA TYPE VARCHAR(50);

-- CreateTable
CREATE TABLE "public"."schedule_statistics" (
    "account_uuid" TEXT NOT NULL,
    "total_tasks" INTEGER NOT NULL DEFAULT 0,
    "active_tasks" INTEGER NOT NULL DEFAULT 0,
    "paused_tasks" INTEGER NOT NULL DEFAULT 0,
    "completed_tasks" INTEGER NOT NULL DEFAULT 0,
    "cancelled_tasks" INTEGER NOT NULL DEFAULT 0,
    "failed_tasks" INTEGER NOT NULL DEFAULT 0,
    "total_executions" INTEGER NOT NULL DEFAULT 0,
    "successful_executions" INTEGER NOT NULL DEFAULT 0,
    "failed_executions" INTEGER NOT NULL DEFAULT 0,
    "skipped_executions" INTEGER NOT NULL DEFAULT 0,
    "timeout_executions" INTEGER NOT NULL DEFAULT 0,
    "avg_execution_duration" INTEGER NOT NULL DEFAULT 0,
    "min_execution_duration" INTEGER NOT NULL DEFAULT 0,
    "max_execution_duration" INTEGER NOT NULL DEFAULT 0,
    "module_stats" JSONB NOT NULL DEFAULT '{}',
    "last_updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_statistics_pkey" PRIMARY KEY ("account_uuid")
);

-- CreateIndex
CREATE INDEX "schedule_statistics_account_uuid_idx" ON "public"."schedule_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "schedule_executions_execution_time_idx" ON "public"."schedule_executions"("execution_time");

-- CreateIndex
CREATE INDEX "schedule_tasks_account_uuid_idx" ON "public"."schedule_tasks"("account_uuid");

-- CreateIndex
CREATE INDEX "schedule_tasks_status_enabled_next_run_at_idx" ON "public"."schedule_tasks"("status", "enabled", "next_run_at");

-- CreateIndex
CREATE INDEX "schedule_tasks_created_at_idx" ON "public"."schedule_tasks"("created_at");

-- AddForeignKey
ALTER TABLE "public"."schedule_tasks" ADD CONSTRAINT "schedule_tasks_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_executions" ADD CONSTRAINT "schedule_executions_task_uuid_fkey" FOREIGN KEY ("task_uuid") REFERENCES "public"."schedule_tasks"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_executions" ADD CONSTRAINT "schedule_executions_accountUuid_fkey" FOREIGN KEY ("accountUuid") REFERENCES "public"."accounts"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_executions" ADD CONSTRAINT "schedule_executions_oldScheduleTaskUuid_fkey" FOREIGN KEY ("oldScheduleTaskUuid") REFERENCES "public"."old_schedule_tasks"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_statistics" ADD CONSTRAINT "schedule_statistics_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
