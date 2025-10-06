/*
  Warnings:

  - You are about to drop the `reminder_instances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reminder_schedules` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."reminder_instances" DROP CONSTRAINT "reminder_instances_account_uuid_fkey";

-- DropForeignKey
ALTER TABLE "public"."reminder_instances" DROP CONSTRAINT "reminder_instances_template_uuid_fkey";

-- DropForeignKey
ALTER TABLE "public"."reminder_schedules" DROP CONSTRAINT "reminder_schedules_account_uuid_fkey";

-- DropForeignKey
ALTER TABLE "public"."reminder_schedules" DROP CONSTRAINT "reminder_schedules_template_uuid_fkey";

-- DropTable
DROP TABLE "public"."reminder_instances";

-- DropTable
DROP TABLE "public"."reminder_schedules";

-- CreateTable
CREATE TABLE "public"."recurring_schedule_tasks" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger_type" TEXT NOT NULL,
    "cron_expression" TEXT,
    "scheduled_time" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "source_module" TEXT NOT NULL,
    "source_entity_id" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "next_run_at" TIMESTAMP(3),
    "last_run_at" TIMESTAMP(3),
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "execution_history" TEXT NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_schedule_tasks_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "recurring_schedule_tasks_source_module_source_entity_id_idx" ON "public"."recurring_schedule_tasks"("source_module", "source_entity_id");

-- CreateIndex
CREATE INDEX "recurring_schedule_tasks_status_idx" ON "public"."recurring_schedule_tasks"("status");

-- CreateIndex
CREATE INDEX "recurring_schedule_tasks_enabled_idx" ON "public"."recurring_schedule_tasks"("enabled");

-- CreateIndex
CREATE INDEX "recurring_schedule_tasks_next_run_at_idx" ON "public"."recurring_schedule_tasks"("next_run_at");

-- CreateIndex
CREATE INDEX "recurring_schedule_tasks_trigger_type_idx" ON "public"."recurring_schedule_tasks"("trigger_type");
