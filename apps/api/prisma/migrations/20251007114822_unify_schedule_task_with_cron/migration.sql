/*
  Warnings:

  - You are about to drop the column `account_uuid` on the `schedule_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `alert_config` on the `schedule_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `failure_count` on the `schedule_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `last_executed_at` on the `schedule_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `next_scheduled_at` on the `schedule_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `payload` on the `schedule_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `schedule_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `recurrence` on the `schedule_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `scheduled_time` on the `schedule_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `schedule_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `task_type` on the `schedule_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `schedule_tasks` table. All the data in the column will be lost.
  - Added the required column `cron_expression` to the `schedule_tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `schedule_tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source_entity_id` to the `schedule_tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source_module` to the `schedule_tasks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."schedule_executions" DROP CONSTRAINT "schedule_executions_task_uuid_fkey";

-- DropForeignKey
ALTER TABLE "public"."schedule_tasks" DROP CONSTRAINT "schedule_tasks_account_uuid_fkey";

-- DropIndex
DROP INDEX "public"."schedule_tasks_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."schedule_tasks_next_scheduled_at_idx";

-- DropIndex
DROP INDEX "public"."schedule_tasks_priority_idx";

-- DropIndex
DROP INDEX "public"."schedule_tasks_scheduled_time_idx";

-- DropIndex
DROP INDEX "public"."schedule_tasks_task_type_idx";

-- AlterTable
ALTER TABLE "public"."schedule_tasks" DROP COLUMN "account_uuid",
DROP COLUMN "alert_config",
DROP COLUMN "failure_count",
DROP COLUMN "last_executed_at",
DROP COLUMN "next_scheduled_at",
DROP COLUMN "payload",
DROP COLUMN "priority",
DROP COLUMN "recurrence",
DROP COLUMN "scheduled_time",
DROP COLUMN "tags",
DROP COLUMN "task_type",
DROP COLUMN "title",
ADD COLUMN     "cron_expression" TEXT NOT NULL,
ADD COLUMN     "execution_history" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "last_run_at" TIMESTAMP(3),
ADD COLUMN     "metadata" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "next_run_at" TIMESTAMP(3),
ADD COLUMN     "source_entity_id" TEXT NOT NULL,
ADD COLUMN     "source_module" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "status" SET DEFAULT 'active';

-- CreateTable
CREATE TABLE "public"."old_schedule_tasks" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "task_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "scheduled_time" TIMESTAMP(3) NOT NULL,
    "payload" JSONB,
    "recurrence" JSONB,
    "alert_config" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_executed_at" TIMESTAMP(3),
    "next_scheduled_at" TIMESTAMP(3),
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "old_schedule_tasks_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "old_schedule_tasks_account_uuid_idx" ON "public"."old_schedule_tasks"("account_uuid");

-- CreateIndex
CREATE INDEX "old_schedule_tasks_status_idx" ON "public"."old_schedule_tasks"("status");

-- CreateIndex
CREATE INDEX "old_schedule_tasks_task_type_idx" ON "public"."old_schedule_tasks"("task_type");

-- CreateIndex
CREATE INDEX "old_schedule_tasks_enabled_idx" ON "public"."old_schedule_tasks"("enabled");

-- CreateIndex
CREATE INDEX "old_schedule_tasks_scheduled_time_idx" ON "public"."old_schedule_tasks"("scheduled_time");

-- CreateIndex
CREATE INDEX "old_schedule_tasks_next_scheduled_at_idx" ON "public"."old_schedule_tasks"("next_scheduled_at");

-- CreateIndex
CREATE INDEX "old_schedule_tasks_priority_idx" ON "public"."old_schedule_tasks"("priority");

-- CreateIndex
CREATE INDEX "schedule_tasks_source_module_source_entity_id_idx" ON "public"."schedule_tasks"("source_module", "source_entity_id");

-- CreateIndex
CREATE INDEX "schedule_tasks_next_run_at_idx" ON "public"."schedule_tasks"("next_run_at");

-- AddForeignKey
ALTER TABLE "public"."old_schedule_tasks" ADD CONSTRAINT "old_schedule_tasks_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_executions" ADD CONSTRAINT "schedule_executions_task_uuid_fkey" FOREIGN KEY ("task_uuid") REFERENCES "public"."old_schedule_tasks"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
