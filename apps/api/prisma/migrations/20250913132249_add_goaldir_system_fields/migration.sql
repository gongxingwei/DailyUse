/*
  Warnings:

  - You are about to drop the column `account_uuid` on the `goal_records` table. All the data in the column will be lost.
  - You are about to drop the column `goal_uuid` on the `goal_records` table. All the data in the column will be lost.
  - You are about to drop the column `account_uuid` on the `key_results` table. All the data in the column will be lost.
  - You are about to drop the `tasks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."goal_records" DROP CONSTRAINT "goal_records_account_uuid_fkey";

-- DropForeignKey
ALTER TABLE "public"."goal_records" DROP CONSTRAINT "goal_records_goal_uuid_fkey";

-- DropForeignKey
ALTER TABLE "public"."key_results" DROP CONSTRAINT "key_results_account_uuid_fkey";

-- DropForeignKey
ALTER TABLE "public"."tasks" DROP CONSTRAINT "tasks_account_uuid_fkey";

-- DropForeignKey
ALTER TABLE "public"."tasks" DROP CONSTRAINT "tasks_goal_uuid_fkey";

-- DropIndex
DROP INDEX "public"."goal_records_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."goal_records_goal_uuid_idx";

-- DropIndex
DROP INDEX "public"."key_results_account_uuid_idx";

-- AlterTable
ALTER TABLE "public"."goal_directories" ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "system_type" TEXT;

-- AlterTable
ALTER TABLE "public"."goal_records" DROP COLUMN "account_uuid",
DROP COLUMN "goal_uuid";

-- AlterTable
ALTER TABLE "public"."key_results" DROP COLUMN "account_uuid";

-- DropTable
DROP TABLE "public"."tasks";

-- CreateTable
CREATE TABLE "public"."task_templates" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "time_type" TEXT NOT NULL DEFAULT 'allDay',
    "start_time" TEXT,
    "end_time" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "schedule_mode" TEXT NOT NULL DEFAULT 'once',
    "interval_days" INTEGER,
    "weekdays" TEXT NOT NULL DEFAULT '[]',
    "month_days" TEXT NOT NULL DEFAULT '[]',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "reminder_enabled" BOOLEAN NOT NULL DEFAULT false,
    "reminder_minutes_before" INTEGER NOT NULL DEFAULT 15,
    "reminder_methods" TEXT NOT NULL DEFAULT '[]',
    "importance" TEXT NOT NULL DEFAULT 'moderate',
    "urgency" TEXT NOT NULL DEFAULT 'medium',
    "location" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "total_instances" INTEGER NOT NULL DEFAULT 0,
    "completed_instances" INTEGER NOT NULL DEFAULT 0,
    "completion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "last_instance_date" TIMESTAMP(3),
    "goal_links" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."task_instances" (
    "uuid" TEXT NOT NULL,
    "template_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "time_type" TEXT NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    "estimated_duration" INTEGER,
    "timezone" TEXT NOT NULL,
    "reminder_enabled" BOOLEAN NOT NULL DEFAULT false,
    "reminder_status" TEXT NOT NULL DEFAULT 'pending',
    "reminder_scheduled_time" TIMESTAMP(3),
    "reminder_triggered_at" TIMESTAMP(3),
    "reminder_snooze_count" INTEGER NOT NULL DEFAULT 0,
    "reminder_snooze_until" TIMESTAMP(3),
    "execution_status" TEXT NOT NULL DEFAULT 'pending',
    "actual_start_time" TIMESTAMP(3),
    "actual_end_time" TIMESTAMP(3),
    "actual_duration" INTEGER,
    "progress_percentage" INTEGER NOT NULL DEFAULT 0,
    "execution_notes" TEXT,
    "importance" TEXT NOT NULL DEFAULT 'moderate',
    "urgency" TEXT NOT NULL DEFAULT 'medium',
    "location" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "lifecycle_events" TEXT NOT NULL DEFAULT '[]',
    "goal_links" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_instances_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."task_meta_templates" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "category" TEXT NOT NULL,
    "default_time_type" TEXT NOT NULL DEFAULT 'allDay',
    "default_schedule_mode" TEXT NOT NULL DEFAULT 'once',
    "default_timezone" TEXT NOT NULL DEFAULT 'UTC',
    "default_start_time" TEXT,
    "default_end_time" TEXT,
    "default_reminder_enabled" BOOLEAN NOT NULL DEFAULT false,
    "default_reminder_minutes_before" INTEGER NOT NULL DEFAULT 15,
    "default_reminder_methods" TEXT NOT NULL DEFAULT '[]',
    "default_importance" TEXT NOT NULL DEFAULT 'moderate',
    "default_urgency" TEXT NOT NULL DEFAULT 'medium',
    "default_tags" TEXT NOT NULL DEFAULT '[]',
    "default_location" TEXT,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMP(3),
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_meta_templates_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."reminder_template_groups" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "parent_uuid" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "enable_mode" TEXT NOT NULL DEFAULT 'group',
    "icon" TEXT,
    "color" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_template_groups_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."reminder_templates" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "group_uuid" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "message" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "self_enabled" BOOLEAN NOT NULL DEFAULT true,
    "importance_level" TEXT NOT NULL DEFAULT 'moderate',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "time_config_type" TEXT NOT NULL DEFAULT 'daily',
    "time_config_times" TEXT NOT NULL DEFAULT '[]',
    "time_config_weekdays" TEXT NOT NULL DEFAULT '[]',
    "time_config_month_days" TEXT NOT NULL DEFAULT '[]',
    "time_config_duration" INTEGER,
    "time_config_schedule" TEXT NOT NULL DEFAULT '{}',
    "notification_sound" BOOLEAN NOT NULL DEFAULT true,
    "notification_vibration" BOOLEAN NOT NULL DEFAULT true,
    "notification_popup" BOOLEAN NOT NULL DEFAULT true,
    "notification_sound_file" TEXT,
    "notification_custom_icon" TEXT,
    "snooze_enabled" BOOLEAN NOT NULL DEFAULT true,
    "snooze_default_minutes" INTEGER NOT NULL DEFAULT 10,
    "snooze_max_count" INTEGER NOT NULL DEFAULT 5,
    "snooze_preset_options" TEXT NOT NULL DEFAULT '[]',
    "last_triggered" TIMESTAMP(3),
    "trigger_count" INTEGER NOT NULL DEFAULT 0,
    "total_triggers" INTEGER NOT NULL DEFAULT 0,
    "acknowledged_count" INTEGER NOT NULL DEFAULT 0,
    "dismissed_count" INTEGER NOT NULL DEFAULT 0,
    "snooze_count_total" INTEGER NOT NULL DEFAULT 0,
    "avg_response_time" DOUBLE PRECISION,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_templates_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."reminder_instances" (
    "uuid" TEXT NOT NULL,
    "template_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT,
    "message" TEXT NOT NULL,
    "scheduled_time" TIMESTAMP(3) NOT NULL,
    "triggered_time" TIMESTAMP(3),
    "acknowledged_time" TIMESTAMP(3),
    "dismissed_time" TIMESTAMP(3),
    "snoozed_until" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "source_type" TEXT,
    "source_id" TEXT,
    "snooze_history" TEXT NOT NULL DEFAULT '[]',
    "current_snooze_count" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_instances_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."reminder_schedules" (
    "uuid" TEXT NOT NULL,
    "template_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "next_execution_time" TIMESTAMP(3) NOT NULL,
    "last_execution_time" TIMESTAMP(3),
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "max_executions" INTEGER,
    "recurrence_rule" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_schedules_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."setting_definitions" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'string',
    "scope" TEXT NOT NULL DEFAULT 'user',
    "category" TEXT NOT NULL DEFAULT 'general',
    "default_value" TEXT NOT NULL,
    "current_value" TEXT,
    "options" TEXT NOT NULL DEFAULT '[]',
    "validation_rules" TEXT NOT NULL DEFAULT '[]',
    "readonly" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "requires_restart" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "depends_on" TEXT NOT NULL DEFAULT '[]',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setting_definitions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."setting_groups" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "icon" TEXT,
    "collapsible" BOOLEAN NOT NULL DEFAULT true,
    "default_expanded" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "setting_keys" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setting_groups_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."setting_values" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "setting_key" TEXT NOT NULL,
    "definition_uuid" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'user',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "last_modified" TIMESTAMP(3) NOT NULL,
    "modified_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setting_values_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."setting_change_records" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "setting_key" TEXT NOT NULL,
    "definition_uuid" TEXT NOT NULL,
    "old_value" TEXT NOT NULL,
    "new_value" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'user',
    "changed_at" TIMESTAMP(3) NOT NULL,
    "changed_by" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "setting_change_records_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."setting_backups" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "settings_data" TEXT NOT NULL,
    "app_version" TEXT NOT NULL,
    "settings_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "setting_backups_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."editor_sessions" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active_group_id" TEXT,
    "activity_bar_width" INTEGER NOT NULL DEFAULT 48,
    "sidebar_width" INTEGER NOT NULL DEFAULT 300,
    "min_sidebar_width" INTEGER NOT NULL DEFAULT 200,
    "resize_handle_width" INTEGER NOT NULL DEFAULT 4,
    "min_editor_width" INTEGER NOT NULL DEFAULT 300,
    "editor_tab_width" INTEGER NOT NULL DEFAULT 120,
    "window_width" INTEGER NOT NULL DEFAULT 1200,
    "window_height" INTEGER NOT NULL DEFAULT 800,
    "auto_save" BOOLEAN NOT NULL DEFAULT true,
    "auto_save_interval" INTEGER NOT NULL DEFAULT 30,
    "last_saved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editor_sessions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."editor_groups" (
    "uuid" TEXT NOT NULL,
    "session_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER NOT NULL DEFAULT 400,
    "active_tab_id" TEXT,
    "title" TEXT,
    "last_accessed" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editor_groups_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."editor_tabs" (
    "uuid" TEXT NOT NULL,
    "group_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "is_preview" BOOLEAN NOT NULL DEFAULT false,
    "is_dirty" BOOLEAN NOT NULL DEFAULT false,
    "file_type" TEXT,
    "last_modified" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editor_tabs_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."editor_file_contents" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "encoding" TEXT NOT NULL DEFAULT 'utf8',
    "is_temporary" BOOLEAN NOT NULL DEFAULT false,
    "is_cached" BOOLEAN NOT NULL DEFAULT false,
    "last_modified" TIMESTAMP(3) NOT NULL,
    "last_accessed" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editor_file_contents_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "task_templates_account_uuid_idx" ON "public"."task_templates"("account_uuid");

-- CreateIndex
CREATE INDEX "task_templates_status_idx" ON "public"."task_templates"("status");

-- CreateIndex
CREATE INDEX "task_templates_schedule_mode_idx" ON "public"."task_templates"("schedule_mode");

-- CreateIndex
CREATE INDEX "task_templates_start_date_idx" ON "public"."task_templates"("start_date");

-- CreateIndex
CREATE INDEX "task_templates_end_date_idx" ON "public"."task_templates"("end_date");

-- CreateIndex
CREATE INDEX "task_templates_importance_idx" ON "public"."task_templates"("importance");

-- CreateIndex
CREATE INDEX "task_templates_urgency_idx" ON "public"."task_templates"("urgency");

-- CreateIndex
CREATE INDEX "task_instances_template_uuid_idx" ON "public"."task_instances"("template_uuid");

-- CreateIndex
CREATE INDEX "task_instances_account_uuid_idx" ON "public"."task_instances"("account_uuid");

-- CreateIndex
CREATE INDEX "task_instances_execution_status_idx" ON "public"."task_instances"("execution_status");

-- CreateIndex
CREATE INDEX "task_instances_scheduled_date_idx" ON "public"."task_instances"("scheduled_date");

-- CreateIndex
CREATE INDEX "task_instances_reminder_status_idx" ON "public"."task_instances"("reminder_status");

-- CreateIndex
CREATE INDEX "task_instances_importance_idx" ON "public"."task_instances"("importance");

-- CreateIndex
CREATE INDEX "task_instances_urgency_idx" ON "public"."task_instances"("urgency");

-- CreateIndex
CREATE INDEX "task_meta_templates_account_uuid_idx" ON "public"."task_meta_templates"("account_uuid");

-- CreateIndex
CREATE INDEX "task_meta_templates_category_idx" ON "public"."task_meta_templates"("category");

-- CreateIndex
CREATE INDEX "task_meta_templates_is_active_idx" ON "public"."task_meta_templates"("is_active");

-- CreateIndex
CREATE INDEX "task_meta_templates_is_favorite_idx" ON "public"."task_meta_templates"("is_favorite");

-- CreateIndex
CREATE INDEX "task_meta_templates_usage_count_idx" ON "public"."task_meta_templates"("usage_count");

-- CreateIndex
CREATE INDEX "reminder_template_groups_account_uuid_idx" ON "public"."reminder_template_groups"("account_uuid");

-- CreateIndex
CREATE INDEX "reminder_template_groups_parent_uuid_idx" ON "public"."reminder_template_groups"("parent_uuid");

-- CreateIndex
CREATE INDEX "reminder_template_groups_enabled_idx" ON "public"."reminder_template_groups"("enabled");

-- CreateIndex
CREATE INDEX "reminder_template_groups_sort_order_idx" ON "public"."reminder_template_groups"("sort_order");

-- CreateIndex
CREATE INDEX "reminder_templates_account_uuid_idx" ON "public"."reminder_templates"("account_uuid");

-- CreateIndex
CREATE INDEX "reminder_templates_group_uuid_idx" ON "public"."reminder_templates"("group_uuid");

-- CreateIndex
CREATE INDEX "reminder_templates_enabled_idx" ON "public"."reminder_templates"("enabled");

-- CreateIndex
CREATE INDEX "reminder_templates_category_idx" ON "public"."reminder_templates"("category");

-- CreateIndex
CREATE INDEX "reminder_templates_priority_idx" ON "public"."reminder_templates"("priority");

-- CreateIndex
CREATE INDEX "reminder_templates_last_triggered_idx" ON "public"."reminder_templates"("last_triggered");

-- CreateIndex
CREATE INDEX "reminder_instances_template_uuid_idx" ON "public"."reminder_instances"("template_uuid");

-- CreateIndex
CREATE INDEX "reminder_instances_account_uuid_idx" ON "public"."reminder_instances"("account_uuid");

-- CreateIndex
CREATE INDEX "reminder_instances_status_idx" ON "public"."reminder_instances"("status");

-- CreateIndex
CREATE INDEX "reminder_instances_priority_idx" ON "public"."reminder_instances"("priority");

-- CreateIndex
CREATE INDEX "reminder_instances_scheduled_time_idx" ON "public"."reminder_instances"("scheduled_time");

-- CreateIndex
CREATE INDEX "reminder_instances_category_idx" ON "public"."reminder_instances"("category");

-- CreateIndex
CREATE INDEX "reminder_schedules_template_uuid_idx" ON "public"."reminder_schedules"("template_uuid");

-- CreateIndex
CREATE INDEX "reminder_schedules_account_uuid_idx" ON "public"."reminder_schedules"("account_uuid");

-- CreateIndex
CREATE INDEX "reminder_schedules_enabled_idx" ON "public"."reminder_schedules"("enabled");

-- CreateIndex
CREATE INDEX "reminder_schedules_next_execution_time_idx" ON "public"."reminder_schedules"("next_execution_time");

-- CreateIndex
CREATE UNIQUE INDEX "setting_definitions_key_key" ON "public"."setting_definitions"("key");

-- CreateIndex
CREATE INDEX "setting_definitions_account_uuid_idx" ON "public"."setting_definitions"("account_uuid");

-- CreateIndex
CREATE INDEX "setting_definitions_type_idx" ON "public"."setting_definitions"("type");

-- CreateIndex
CREATE INDEX "setting_definitions_scope_idx" ON "public"."setting_definitions"("scope");

-- CreateIndex
CREATE INDEX "setting_definitions_category_idx" ON "public"."setting_definitions"("category");

-- CreateIndex
CREATE INDEX "setting_definitions_sort_order_idx" ON "public"."setting_definitions"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "setting_groups_id_key" ON "public"."setting_groups"("id");

-- CreateIndex
CREATE INDEX "setting_groups_account_uuid_idx" ON "public"."setting_groups"("account_uuid");

-- CreateIndex
CREATE INDEX "setting_groups_category_idx" ON "public"."setting_groups"("category");

-- CreateIndex
CREATE INDEX "setting_groups_sort_order_idx" ON "public"."setting_groups"("sort_order");

-- CreateIndex
CREATE INDEX "setting_values_account_uuid_idx" ON "public"."setting_values"("account_uuid");

-- CreateIndex
CREATE INDEX "setting_values_setting_key_idx" ON "public"."setting_values"("setting_key");

-- CreateIndex
CREATE INDEX "setting_values_scope_idx" ON "public"."setting_values"("scope");

-- CreateIndex
CREATE INDEX "setting_values_is_default_idx" ON "public"."setting_values"("is_default");

-- CreateIndex
CREATE UNIQUE INDEX "setting_values_account_uuid_setting_key_scope_key" ON "public"."setting_values"("account_uuid", "setting_key", "scope");

-- CreateIndex
CREATE INDEX "setting_change_records_account_uuid_idx" ON "public"."setting_change_records"("account_uuid");

-- CreateIndex
CREATE INDEX "setting_change_records_setting_key_idx" ON "public"."setting_change_records"("setting_key");

-- CreateIndex
CREATE INDEX "setting_change_records_scope_idx" ON "public"."setting_change_records"("scope");

-- CreateIndex
CREATE INDEX "setting_change_records_changed_at_idx" ON "public"."setting_change_records"("changed_at");

-- CreateIndex
CREATE INDEX "setting_backups_account_uuid_idx" ON "public"."setting_backups"("account_uuid");

-- CreateIndex
CREATE INDEX "setting_backups_created_at_idx" ON "public"."setting_backups"("created_at");

-- CreateIndex
CREATE INDEX "editor_sessions_account_uuid_idx" ON "public"."editor_sessions"("account_uuid");

-- CreateIndex
CREATE INDEX "editor_sessions_active_group_id_idx" ON "public"."editor_sessions"("active_group_id");

-- CreateIndex
CREATE INDEX "editor_groups_session_uuid_idx" ON "public"."editor_groups"("session_uuid");

-- CreateIndex
CREATE INDEX "editor_groups_account_uuid_idx" ON "public"."editor_groups"("account_uuid");

-- CreateIndex
CREATE INDEX "editor_groups_active_idx" ON "public"."editor_groups"("active");

-- CreateIndex
CREATE INDEX "editor_tabs_group_uuid_idx" ON "public"."editor_tabs"("group_uuid");

-- CreateIndex
CREATE INDEX "editor_tabs_account_uuid_idx" ON "public"."editor_tabs"("account_uuid");

-- CreateIndex
CREATE INDEX "editor_tabs_active_idx" ON "public"."editor_tabs"("active");

-- CreateIndex
CREATE INDEX "editor_tabs_path_idx" ON "public"."editor_tabs"("path");

-- CreateIndex
CREATE UNIQUE INDEX "editor_file_contents_path_key" ON "public"."editor_file_contents"("path");

-- CreateIndex
CREATE INDEX "editor_file_contents_account_uuid_idx" ON "public"."editor_file_contents"("account_uuid");

-- CreateIndex
CREATE INDEX "editor_file_contents_path_idx" ON "public"."editor_file_contents"("path");

-- CreateIndex
CREATE INDEX "editor_file_contents_is_temporary_idx" ON "public"."editor_file_contents"("is_temporary");

-- CreateIndex
CREATE INDEX "editor_file_contents_last_accessed_idx" ON "public"."editor_file_contents"("last_accessed");

-- CreateIndex
CREATE INDEX "goal_directories_system_type_idx" ON "public"."goal_directories"("system_type");

-- CreateIndex
CREATE INDEX "goal_directories_is_default_idx" ON "public"."goal_directories"("is_default");

-- AddForeignKey
ALTER TABLE "public"."task_templates" ADD CONSTRAINT "task_templates_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_instances" ADD CONSTRAINT "task_instances_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "public"."task_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_instances" ADD CONSTRAINT "task_instances_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_meta_templates" ADD CONSTRAINT "task_meta_templates_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminder_template_groups" ADD CONSTRAINT "reminder_template_groups_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminder_template_groups" ADD CONSTRAINT "reminder_template_groups_parent_uuid_fkey" FOREIGN KEY ("parent_uuid") REFERENCES "public"."reminder_template_groups"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminder_templates" ADD CONSTRAINT "reminder_templates_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminder_templates" ADD CONSTRAINT "reminder_templates_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "public"."reminder_template_groups"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminder_instances" ADD CONSTRAINT "reminder_instances_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "public"."reminder_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminder_instances" ADD CONSTRAINT "reminder_instances_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminder_schedules" ADD CONSTRAINT "reminder_schedules_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "public"."reminder_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminder_schedules" ADD CONSTRAINT "reminder_schedules_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."setting_definitions" ADD CONSTRAINT "setting_definitions_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."setting_groups" ADD CONSTRAINT "setting_groups_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."setting_values" ADD CONSTRAINT "setting_values_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."setting_values" ADD CONSTRAINT "setting_values_definition_uuid_fkey" FOREIGN KEY ("definition_uuid") REFERENCES "public"."setting_definitions"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."setting_change_records" ADD CONSTRAINT "setting_change_records_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."setting_change_records" ADD CONSTRAINT "setting_change_records_definition_uuid_fkey" FOREIGN KEY ("definition_uuid") REFERENCES "public"."setting_definitions"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."setting_backups" ADD CONSTRAINT "setting_backups_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."editor_sessions" ADD CONSTRAINT "editor_sessions_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."editor_groups" ADD CONSTRAINT "editor_groups_session_uuid_fkey" FOREIGN KEY ("session_uuid") REFERENCES "public"."editor_sessions"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."editor_groups" ADD CONSTRAINT "editor_groups_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."editor_tabs" ADD CONSTRAINT "editor_tabs_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "public"."editor_groups"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."editor_tabs" ADD CONSTRAINT "editor_tabs_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."editor_file_contents" ADD CONSTRAINT "editor_file_contents_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
