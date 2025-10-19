/*
  Warnings:

  - You are about to drop the column `created_at` on the `notification_channels` table. All the data in the column will be lost.
  - You are about to drop the column `delivered_at` on the `notification_channels` table. All the data in the column will be lost.
  - You are about to drop the column `failed_at` on the `notification_channels` table. All the data in the column will be lost.
  - You are about to drop the column `sent_at` on the `notification_channels` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."goals" ADD COLUMN     "color" TEXT,
ADD COLUMN     "feasibility_analysis" TEXT,
ADD COLUMN     "motivation" TEXT;

-- AlterTable
ALTER TABLE "public"."notification_channels" DROP COLUMN "created_at",
DROP COLUMN "delivered_at",
DROP COLUMN "failed_at",
DROP COLUMN "sent_at";

-- CreateTable
CREATE TABLE "public"."focus_sessions" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "goal_uuid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "duration_minutes" INTEGER NOT NULL,
    "actual_duration_minutes" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "started_at" TIMESTAMP(3),
    "paused_at" TIMESTAMP(3),
    "resumed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "pause_count" INTEGER NOT NULL DEFAULT 0,
    "paused_duration_minutes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."task_templates" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "task_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "importance" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "color" TEXT,
    "tags" TEXT NOT NULL,
    "folder_uuid" TEXT,
    "last_generated_date" TIMESTAMP(3),
    "generate_ahead_days" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "time_config_type" TEXT NOT NULL,
    "time_config_start_time" TIMESTAMP(3),
    "time_config_end_time" TIMESTAMP(3),
    "time_config_duration_minutes" INTEGER,
    "recurrence_rule_type" TEXT,
    "recurrence_rule_interval" INTEGER,
    "recurrence_rule_days_of_week" TEXT,
    "recurrence_rule_day_of_month" INTEGER,
    "recurrence_rule_month_of_year" INTEGER,
    "recurrence_rule_end_date" TIMESTAMP(3),
    "recurrence_rule_count" INTEGER,
    "reminder_config_enabled" BOOLEAN,
    "reminder_config_time_offset_minutes" INTEGER,
    "reminder_config_unit" TEXT,
    "reminder_config_channel" TEXT,
    "goal_binding_goal_uuid" TEXT,
    "goal_binding_key_result_uuid" TEXT,
    "goal_binding_increment_value" DOUBLE PRECISION,

    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."task_instances" (
    "uuid" TEXT NOT NULL,
    "template_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "instance_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "actual_start_time" TIMESTAMP(3),
    "actual_end_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "time_config" TEXT NOT NULL,
    "completion_record" TEXT,
    "skip_record" TEXT,

    CONSTRAINT "task_instances_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."task_template_history" (
    "uuid" TEXT NOT NULL,
    "template_uuid" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_template_history_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."task_statistics" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL,
    "template_total" INTEGER NOT NULL,
    "template_active" INTEGER NOT NULL,
    "template_paused" INTEGER NOT NULL,
    "template_archived" INTEGER NOT NULL,
    "template_one_time" INTEGER NOT NULL,
    "template_recurring" INTEGER NOT NULL,
    "instance_total" INTEGER NOT NULL,
    "instance_today" INTEGER NOT NULL,
    "instance_week" INTEGER NOT NULL,
    "instance_month" INTEGER NOT NULL,
    "instance_pending" INTEGER NOT NULL,
    "instance_in_progress" INTEGER NOT NULL,
    "instance_completed" INTEGER NOT NULL,
    "instance_skipped" INTEGER NOT NULL,
    "instance_expired" INTEGER NOT NULL,
    "completion_today" INTEGER NOT NULL,
    "completion_week" INTEGER NOT NULL,
    "completion_month" INTEGER NOT NULL,
    "completion_total" INTEGER NOT NULL,
    "completion_avg_time" DOUBLE PRECISION,
    "completion_rate" DOUBLE PRECISION NOT NULL,
    "time_all_day" INTEGER NOT NULL,
    "time_point" INTEGER NOT NULL,
    "time_range" INTEGER NOT NULL,
    "time_overdue" INTEGER NOT NULL,
    "time_upcoming" INTEGER NOT NULL,
    "distribution_by_importance" TEXT NOT NULL,
    "distribution_by_urgency" TEXT NOT NULL,
    "distribution_by_folder" TEXT NOT NULL,
    "distribution_by_tag" TEXT NOT NULL,

    CONSTRAINT "task_statistics_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."reminder_templates" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "self_enabled" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "group_uuid" TEXT,
    "importance_level" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "next_trigger_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "trigger" TEXT NOT NULL,
    "recurrence" TEXT,
    "active_time" TEXT NOT NULL,
    "active_hours" TEXT,
    "notification_config" TEXT NOT NULL,
    "stats" TEXT NOT NULL,

    CONSTRAINT "reminder_templates_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."reminder_groups" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "control_mode" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "stats" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "reminder_groups_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."reminder_history" (
    "uuid" TEXT NOT NULL,
    "template_uuid" TEXT NOT NULL,
    "triggered_at" TIMESTAMP(3) NOT NULL,
    "result" TEXT NOT NULL,
    "error" TEXT,
    "notification_sent" BOOLEAN NOT NULL,
    "notification_channels" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_history_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."reminder_instances" (
    "uuid" TEXT NOT NULL,
    "template_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "trigger_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "result" TEXT,
    "processed_at" TIMESTAMP(3),
    "note" TEXT,
    "payload" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_instances_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."schedule_tasks" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source_module" TEXT NOT NULL,
    "source_entity_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "cron_expression" TEXT,
    "timezone" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "max_executions" INTEGER,
    "next_run_at" TIMESTAMP(3),
    "last_run_at" TIMESTAMP(3),
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "last_execution_status" TEXT,
    "last_execution_duration" INTEGER,
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL,
    "initial_delay_ms" INTEGER NOT NULL,
    "max_delay_ms" INTEGER NOT NULL,
    "backoff_multiplier" DOUBLE PRECISION NOT NULL,
    "retryable_statuses" TEXT NOT NULL DEFAULT '[]',
    "payload" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "priority" TEXT NOT NULL,
    "timeout" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_tasks_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."schedule_executions" (
    "uuid" TEXT NOT NULL,
    "task_uuid" TEXT NOT NULL,
    "execution_time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "duration" INTEGER,
    "result" TEXT,
    "error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_executions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."schedule_statistics" (
    "id" SERIAL NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "total_tasks" INTEGER NOT NULL,
    "active_tasks" INTEGER NOT NULL,
    "paused_tasks" INTEGER NOT NULL,
    "completed_tasks" INTEGER NOT NULL,
    "cancelled_tasks" INTEGER NOT NULL,
    "failed_tasks" INTEGER NOT NULL,
    "total_executions" INTEGER NOT NULL,
    "successful_executions" INTEGER NOT NULL,
    "failed_executions" INTEGER NOT NULL,
    "skipped_executions" INTEGER NOT NULL,
    "timeout_executions" INTEGER NOT NULL,
    "avg_execution_duration" DOUBLE PRECISION NOT NULL,
    "min_execution_duration" DOUBLE PRECISION NOT NULL,
    "max_execution_duration" DOUBLE PRECISION NOT NULL,
    "module_statistics" TEXT NOT NULL DEFAULT '{}',
    "last_updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "focus_sessions_account_uuid_idx" ON "public"."focus_sessions"("account_uuid");

-- CreateIndex
CREATE INDEX "focus_sessions_goal_uuid_idx" ON "public"."focus_sessions"("goal_uuid");

-- CreateIndex
CREATE INDEX "focus_sessions_status_idx" ON "public"."focus_sessions"("status");

-- CreateIndex
CREATE INDEX "focus_sessions_account_uuid_status_idx" ON "public"."focus_sessions"("account_uuid", "status");

-- CreateIndex
CREATE INDEX "focus_sessions_created_at_idx" ON "public"."focus_sessions"("created_at");

-- CreateIndex
CREATE INDEX "task_templates_account_uuid_idx" ON "public"."task_templates"("account_uuid");

-- CreateIndex
CREATE INDEX "task_templates_status_idx" ON "public"."task_templates"("status");

-- CreateIndex
CREATE INDEX "task_templates_task_type_idx" ON "public"."task_templates"("task_type");

-- CreateIndex
CREATE INDEX "task_instances_template_uuid_idx" ON "public"."task_instances"("template_uuid");

-- CreateIndex
CREATE INDEX "task_instances_account_uuid_idx" ON "public"."task_instances"("account_uuid");

-- CreateIndex
CREATE INDEX "task_instances_instance_date_idx" ON "public"."task_instances"("instance_date");

-- CreateIndex
CREATE INDEX "task_instances_status_idx" ON "public"."task_instances"("status");

-- CreateIndex
CREATE INDEX "task_template_history_template_uuid_idx" ON "public"."task_template_history"("template_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "task_statistics_account_uuid_key" ON "public"."task_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "task_statistics_account_uuid_idx" ON "public"."task_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "reminder_templates_account_uuid_idx" ON "public"."reminder_templates"("account_uuid");

-- CreateIndex
CREATE INDEX "reminder_templates_group_uuid_idx" ON "public"."reminder_templates"("group_uuid");

-- CreateIndex
CREATE INDEX "reminder_templates_status_idx" ON "public"."reminder_templates"("status");

-- CreateIndex
CREATE INDEX "reminder_templates_next_trigger_at_idx" ON "public"."reminder_templates"("next_trigger_at");

-- CreateIndex
CREATE INDEX "reminder_groups_account_uuid_idx" ON "public"."reminder_groups"("account_uuid");

-- CreateIndex
CREATE INDEX "reminder_history_template_uuid_idx" ON "public"."reminder_history"("template_uuid");

-- CreateIndex
CREATE INDEX "reminder_instances_template_uuid_idx" ON "public"."reminder_instances"("template_uuid");

-- CreateIndex
CREATE INDEX "reminder_instances_account_uuid_idx" ON "public"."reminder_instances"("account_uuid");

-- CreateIndex
CREATE INDEX "reminder_instances_trigger_at_idx" ON "public"."reminder_instances"("trigger_at");

-- CreateIndex
CREATE INDEX "reminder_instances_status_idx" ON "public"."reminder_instances"("status");

-- CreateIndex
CREATE INDEX "schedule_tasks_account_uuid_idx" ON "public"."schedule_tasks"("account_uuid");

-- CreateIndex
CREATE INDEX "schedule_tasks_source_module_idx" ON "public"."schedule_tasks"("source_module");

-- CreateIndex
CREATE INDEX "schedule_tasks_source_entity_id_idx" ON "public"."schedule_tasks"("source_entity_id");

-- CreateIndex
CREATE INDEX "schedule_tasks_status_idx" ON "public"."schedule_tasks"("status");

-- CreateIndex
CREATE INDEX "schedule_tasks_enabled_idx" ON "public"."schedule_tasks"("enabled");

-- CreateIndex
CREATE INDEX "schedule_tasks_next_run_at_idx" ON "public"."schedule_tasks"("next_run_at");

-- CreateIndex
CREATE INDEX "schedule_executions_task_uuid_idx" ON "public"."schedule_executions"("task_uuid");

-- CreateIndex
CREATE INDEX "schedule_executions_execution_time_idx" ON "public"."schedule_executions"("execution_time");

-- CreateIndex
CREATE INDEX "schedule_executions_status_idx" ON "public"."schedule_executions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_statistics_account_uuid_key" ON "public"."schedule_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "schedule_statistics_account_uuid_idx" ON "public"."schedule_statistics"("account_uuid");

-- AddForeignKey
ALTER TABLE "public"."focus_sessions" ADD CONSTRAINT "focus_sessions_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."focus_sessions" ADD CONSTRAINT "focus_sessions_goal_uuid_fkey" FOREIGN KEY ("goal_uuid") REFERENCES "public"."goals"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_templates" ADD CONSTRAINT "task_templates_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_instances" ADD CONSTRAINT "task_instances_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "public"."task_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_instances" ADD CONSTRAINT "task_instances_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."task_template_history" ADD CONSTRAINT "task_template_history_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "public"."task_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_statistics" ADD CONSTRAINT "task_statistics_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminder_templates" ADD CONSTRAINT "reminder_templates_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminder_templates" ADD CONSTRAINT "reminder_templates_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "public"."reminder_groups"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminder_groups" ADD CONSTRAINT "reminder_groups_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminder_history" ADD CONSTRAINT "reminder_history_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "public"."reminder_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminder_instances" ADD CONSTRAINT "reminder_instances_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "public"."reminder_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminder_instances" ADD CONSTRAINT "reminder_instances_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."schedule_tasks" ADD CONSTRAINT "schedule_tasks_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_executions" ADD CONSTRAINT "schedule_executions_task_uuid_fkey" FOREIGN KEY ("task_uuid") REFERENCES "public"."schedule_tasks"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_statistics" ADD CONSTRAINT "schedule_statistics_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
