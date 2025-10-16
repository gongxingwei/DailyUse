-- CreateTable
CREATE TABLE "public"."accounts" (
    "uuid" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_number" TEXT,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "profile" TEXT NOT NULL,
    "preferences" TEXT NOT NULL,
    "subscription" TEXT,
    "storage" TEXT NOT NULL,
    "security" TEXT NOT NULL,
    "history" TEXT NOT NULL DEFAULT '[]',
    "stats" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_active_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."auth_credentials" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "history" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "auth_credentials_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."auth_sessions" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "access_token" TEXT NOT NULL,
    "access_token_expires_at" TIMESTAMP(3) NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "refresh_token_expires_at" TIMESTAMP(3) NOT NULL,
    "device" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "history" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_accessed_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."repositories" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT,
    "config" TEXT NOT NULL,
    "related_goals" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "git" TEXT,
    "sync_status" TEXT,
    "stats" TEXT NOT NULL,
    "last_accessed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."repository_resources" (
    "uuid" TEXT NOT NULL,
    "repository_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER,
    "description" TEXT,
    "author" TEXT,
    "version" TEXT,
    "tags" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "modified_at" TIMESTAMP(3),

    CONSTRAINT "repository_resources_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."resource_references" (
    "uuid" TEXT NOT NULL,
    "source_resource_uuid" TEXT NOT NULL,
    "target_resource_uuid" TEXT NOT NULL,
    "reference_type" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_verified_at" TIMESTAMP(3),

    CONSTRAINT "resource_references_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."linked_contents" (
    "uuid" TEXT NOT NULL,
    "resource_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "author" TEXT,
    "published_at" TIMESTAMP(3),
    "is_accessible" BOOLEAN NOT NULL DEFAULT true,
    "last_checked_at" TIMESTAMP(3),
    "cached_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linked_contents_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."repository_explorers" (
    "uuid" TEXT NOT NULL,
    "repository_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "current_path" TEXT NOT NULL,
    "filters" TEXT,
    "view_config" TEXT,
    "pinned_paths" TEXT,
    "recent_paths" TEXT,
    "last_scan_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repository_explorers_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."repository_statistics" (
    "id" SERIAL NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "total_repositories" INTEGER NOT NULL DEFAULT 0,
    "active_repositories" INTEGER NOT NULL DEFAULT 0,
    "archived_repositories" INTEGER NOT NULL DEFAULT 0,
    "total_resources" INTEGER NOT NULL DEFAULT 0,
    "total_files" INTEGER NOT NULL DEFAULT 0,
    "total_folders" INTEGER NOT NULL DEFAULT 0,
    "git_enabled_repos" INTEGER NOT NULL DEFAULT 0,
    "total_commits" INTEGER NOT NULL DEFAULT 0,
    "total_references" INTEGER NOT NULL DEFAULT 0,
    "total_linked_contents" INTEGER NOT NULL DEFAULT 0,
    "total_size_bytes" BIGINT NOT NULL DEFAULT 0,
    "last_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repository_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."editor_workspaces" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "project_path" TEXT NOT NULL,
    "project_type" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "settings" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "editor_workspaces_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."editor_workspace_sessions" (
    "uuid" TEXT NOT NULL,
    "workspace_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editor_workspace_sessions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."editor_workspace_session_groups" (
    "uuid" TEXT NOT NULL,
    "session_uuid" TEXT NOT NULL,
    "workspace_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "group_index" INTEGER NOT NULL,
    "name" TEXT,
    "split_direction" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editor_workspace_session_groups_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."editor_workspace_session_group_tabs" (
    "uuid" TEXT NOT NULL,
    "group_uuid" TEXT NOT NULL,
    "session_uuid" TEXT NOT NULL,
    "workspace_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "document_uuid" TEXT,
    "tab_index" INTEGER NOT NULL,
    "tab_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "view_state" JSONB NOT NULL,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editor_workspace_session_group_tabs_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."settings" (
    "uuid" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "value_type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "default_value" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "account_uuid" TEXT,
    "device_id" TEXT,
    "group_uuid" TEXT,
    "validation" TEXT,
    "ui" TEXT,
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "is_read_only" BOOLEAN NOT NULL DEFAULT false,
    "is_system_setting" BOOLEAN NOT NULL DEFAULT false,
    "sync_config" TEXT,
    "history_data" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "settings_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."setting_groups" (
    "uuid" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parent_uuid" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "is_collapsed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setting_groups_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."setting_items" (
    "uuid" TEXT NOT NULL,
    "group_uuid" TEXT NOT NULL,
    "setting_key" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "custom_label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setting_items_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."app_configs" (
    "uuid" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "description" TEXT,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_configs_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."user_settings" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "preferences" TEXT NOT NULL DEFAULT '{}',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "language" TEXT NOT NULL DEFAULT 'zh-CN',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "notifications" TEXT NOT NULL DEFAULT '{}',
    "privacy" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."reminder_statistics" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "template_stats" TEXT NOT NULL,
    "group_stats" TEXT NOT NULL,
    "trigger_stats" TEXT NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_statistics_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."goals" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "importance" INTEGER NOT NULL DEFAULT 2,
    "urgency" INTEGER NOT NULL DEFAULT 2,
    "category" TEXT,
    "tags" TEXT,
    "start_date" TIMESTAMP(3),
    "target_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "folder_uuid" TEXT,
    "parent_goal_uuid" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "reminder_config" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "goals_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "importance" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "related_entity_type" TEXT,
    "related_entity_uuid" TEXT,
    "metadata" TEXT,
    "actions" TEXT,
    "read_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."notification_channels" (
    "uuid" TEXT NOT NULL,
    "notification_uuid" TEXT NOT NULL,
    "channel_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recipient" TEXT,
    "send_attempts" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),

    CONSTRAINT "notification_channels_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."notification_history" (
    "uuid" TEXT NOT NULL,
    "notification_uuid" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "actor_uuid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_history_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."notification_preferences" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "channels" TEXT NOT NULL,
    "categories" TEXT NOT NULL,
    "do_not_disturb" TEXT,
    "rate_limit" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."notification_templates" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title_template" TEXT NOT NULL,
    "content_template" TEXT NOT NULL,
    "variables" TEXT,
    "default_actions" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_username_key" ON "public"."accounts"("username");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "public"."accounts"("email");

-- CreateIndex
CREATE INDEX "accounts_username_idx" ON "public"."accounts"("username");

-- CreateIndex
CREATE INDEX "accounts_email_idx" ON "public"."accounts"("email");

-- CreateIndex
CREATE INDEX "accounts_status_idx" ON "public"."accounts"("status");

-- CreateIndex
CREATE INDEX "accounts_created_at_idx" ON "public"."accounts"("created_at");

-- CreateIndex
CREATE INDEX "accounts_last_active_at_idx" ON "public"."accounts"("last_active_at");

-- CreateIndex
CREATE INDEX "auth_credentials_account_uuid_idx" ON "public"."auth_credentials"("account_uuid");

-- CreateIndex
CREATE INDEX "auth_credentials_type_idx" ON "public"."auth_credentials"("type");

-- CreateIndex
CREATE INDEX "auth_credentials_expires_at_idx" ON "public"."auth_credentials"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_access_token_key" ON "public"."auth_sessions"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_refresh_token_key" ON "public"."auth_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "auth_sessions_account_uuid_idx" ON "public"."auth_sessions"("account_uuid");

-- CreateIndex
CREATE INDEX "auth_sessions_status_idx" ON "public"."auth_sessions"("status");

-- CreateIndex
CREATE INDEX "auth_sessions_access_token_idx" ON "public"."auth_sessions"("access_token");

-- CreateIndex
CREATE INDEX "auth_sessions_refresh_token_idx" ON "public"."auth_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "auth_sessions_access_token_expires_at_idx" ON "public"."auth_sessions"("access_token_expires_at");

-- CreateIndex
CREATE INDEX "auth_sessions_last_accessed_at_idx" ON "public"."auth_sessions"("last_accessed_at");

-- CreateIndex
CREATE INDEX "repositories_account_uuid_idx" ON "public"."repositories"("account_uuid");

-- CreateIndex
CREATE INDEX "repositories_type_idx" ON "public"."repositories"("type");

-- CreateIndex
CREATE INDEX "repositories_status_idx" ON "public"."repositories"("status");

-- CreateIndex
CREATE INDEX "repositories_path_idx" ON "public"."repositories"("path");

-- CreateIndex
CREATE INDEX "repositories_created_at_idx" ON "public"."repositories"("created_at");

-- CreateIndex
CREATE INDEX "repositories_last_accessed_at_idx" ON "public"."repositories"("last_accessed_at");

-- CreateIndex
CREATE UNIQUE INDEX "repositories_account_uuid_path_key" ON "public"."repositories"("account_uuid", "path");

-- CreateIndex
CREATE INDEX "repository_resources_repository_uuid_idx" ON "public"."repository_resources"("repository_uuid");

-- CreateIndex
CREATE INDEX "repository_resources_type_idx" ON "public"."repository_resources"("type");

-- CreateIndex
CREATE INDEX "repository_resources_status_idx" ON "public"."repository_resources"("status");

-- CreateIndex
CREATE INDEX "repository_resources_path_idx" ON "public"."repository_resources"("path");

-- CreateIndex
CREATE INDEX "repository_resources_created_at_idx" ON "public"."repository_resources"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "repository_resources_repository_uuid_path_key" ON "public"."repository_resources"("repository_uuid", "path");

-- CreateIndex
CREATE INDEX "resource_references_source_resource_uuid_idx" ON "public"."resource_references"("source_resource_uuid");

-- CreateIndex
CREATE INDEX "resource_references_target_resource_uuid_idx" ON "public"."resource_references"("target_resource_uuid");

-- CreateIndex
CREATE INDEX "resource_references_reference_type_idx" ON "public"."resource_references"("reference_type");

-- CreateIndex
CREATE UNIQUE INDEX "resource_references_source_resource_uuid_target_resource_uu_key" ON "public"."resource_references"("source_resource_uuid", "target_resource_uuid", "reference_type");

-- CreateIndex
CREATE INDEX "linked_contents_resource_uuid_idx" ON "public"."linked_contents"("resource_uuid");

-- CreateIndex
CREATE INDEX "linked_contents_content_type_idx" ON "public"."linked_contents"("content_type");

-- CreateIndex
CREATE INDEX "linked_contents_url_idx" ON "public"."linked_contents"("url");

-- CreateIndex
CREATE INDEX "repository_explorers_repository_uuid_idx" ON "public"."repository_explorers"("repository_uuid");

-- CreateIndex
CREATE INDEX "repository_explorers_account_uuid_idx" ON "public"."repository_explorers"("account_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "repository_explorers_repository_uuid_account_uuid_key" ON "public"."repository_explorers"("repository_uuid", "account_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "repository_statistics_account_uuid_key" ON "public"."repository_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "repository_statistics_account_uuid_idx" ON "public"."repository_statistics"("account_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "editor_workspaces_project_path_key" ON "public"."editor_workspaces"("project_path");

-- CreateIndex
CREATE INDEX "editor_workspaces_account_uuid_idx" ON "public"."editor_workspaces"("account_uuid");

-- CreateIndex
CREATE INDEX "editor_workspaces_is_active_idx" ON "public"."editor_workspaces"("is_active");

-- CreateIndex
CREATE INDEX "editor_workspaces_accessed_at_idx" ON "public"."editor_workspaces"("accessed_at");

-- CreateIndex
CREATE INDEX "editor_workspace_sessions_workspace_uuid_idx" ON "public"."editor_workspace_sessions"("workspace_uuid");

-- CreateIndex
CREATE INDEX "editor_workspace_sessions_account_uuid_idx" ON "public"."editor_workspace_sessions"("account_uuid");

-- CreateIndex
CREATE INDEX "editor_workspace_sessions_is_active_idx" ON "public"."editor_workspace_sessions"("is_active");

-- CreateIndex
CREATE INDEX "editor_workspace_session_groups_session_uuid_idx" ON "public"."editor_workspace_session_groups"("session_uuid");

-- CreateIndex
CREATE INDEX "editor_workspace_session_groups_workspace_uuid_idx" ON "public"."editor_workspace_session_groups"("workspace_uuid");

-- CreateIndex
CREATE INDEX "editor_workspace_session_groups_account_uuid_idx" ON "public"."editor_workspace_session_groups"("account_uuid");

-- CreateIndex
CREATE INDEX "editor_workspace_session_group_tabs_group_uuid_idx" ON "public"."editor_workspace_session_group_tabs"("group_uuid");

-- CreateIndex
CREATE INDEX "editor_workspace_session_group_tabs_session_uuid_idx" ON "public"."editor_workspace_session_group_tabs"("session_uuid");

-- CreateIndex
CREATE INDEX "editor_workspace_session_group_tabs_workspace_uuid_idx" ON "public"."editor_workspace_session_group_tabs"("workspace_uuid");

-- CreateIndex
CREATE INDEX "editor_workspace_session_group_tabs_account_uuid_idx" ON "public"."editor_workspace_session_group_tabs"("account_uuid");

-- CreateIndex
CREATE INDEX "editor_workspace_session_group_tabs_document_uuid_idx" ON "public"."editor_workspace_session_group_tabs"("document_uuid");

-- CreateIndex
CREATE INDEX "settings_key_idx" ON "public"."settings"("key");

-- CreateIndex
CREATE INDEX "settings_scope_idx" ON "public"."settings"("scope");

-- CreateIndex
CREATE INDEX "settings_account_uuid_idx" ON "public"."settings"("account_uuid");

-- CreateIndex
CREATE INDEX "settings_device_id_idx" ON "public"."settings"("device_id");

-- CreateIndex
CREATE INDEX "settings_group_uuid_idx" ON "public"."settings"("group_uuid");

-- CreateIndex
CREATE INDEX "settings_is_system_setting_idx" ON "public"."settings"("is_system_setting");

-- CreateIndex
CREATE INDEX "settings_created_at_idx" ON "public"."settings"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_scope_account_uuid_device_id_key" ON "public"."settings"("key", "scope", "account_uuid", "device_id");

-- CreateIndex
CREATE UNIQUE INDEX "setting_groups_key_key" ON "public"."setting_groups"("key");

-- CreateIndex
CREATE INDEX "setting_groups_parent_uuid_idx" ON "public"."setting_groups"("parent_uuid");

-- CreateIndex
CREATE INDEX "setting_groups_order_idx" ON "public"."setting_groups"("order");

-- CreateIndex
CREATE INDEX "setting_items_group_uuid_idx" ON "public"."setting_items"("group_uuid");

-- CreateIndex
CREATE INDEX "setting_items_setting_key_idx" ON "public"."setting_items"("setting_key");

-- CreateIndex
CREATE INDEX "setting_items_order_idx" ON "public"."setting_items"("order");

-- CreateIndex
CREATE UNIQUE INDEX "setting_items_group_uuid_setting_key_key" ON "public"."setting_items"("group_uuid", "setting_key");

-- CreateIndex
CREATE UNIQUE INDEX "app_configs_version_key" ON "public"."app_configs"("version");

-- CreateIndex
CREATE INDEX "app_configs_version_idx" ON "public"."app_configs"("version");

-- CreateIndex
CREATE INDEX "app_configs_is_current_idx" ON "public"."app_configs"("is_current");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_account_uuid_key" ON "public"."user_settings"("account_uuid");

-- CreateIndex
CREATE INDEX "user_settings_account_uuid_idx" ON "public"."user_settings"("account_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "reminder_statistics_account_uuid_key" ON "public"."reminder_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "reminder_statistics_account_uuid_idx" ON "public"."reminder_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "goals_account_uuid_idx" ON "public"."goals"("account_uuid");

-- CreateIndex
CREATE INDEX "goals_status_idx" ON "public"."goals"("status");

-- CreateIndex
CREATE INDEX "goals_folder_uuid_idx" ON "public"."goals"("folder_uuid");

-- CreateIndex
CREATE INDEX "goals_parent_goal_uuid_idx" ON "public"."goals"("parent_goal_uuid");

-- CreateIndex
CREATE INDEX "notifications_account_uuid_idx" ON "public"."notifications"("account_uuid");

-- CreateIndex
CREATE INDEX "notifications_category_idx" ON "public"."notifications"("category");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "public"."notifications"("status");

-- CreateIndex
CREATE INDEX "notification_channels_notification_uuid_idx" ON "public"."notification_channels"("notification_uuid");

-- CreateIndex
CREATE INDEX "notification_history_notification_uuid_idx" ON "public"."notification_history"("notification_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_account_uuid_key" ON "public"."notification_preferences"("account_uuid");

-- CreateIndex
CREATE INDEX "notification_preferences_account_uuid_idx" ON "public"."notification_preferences"("account_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_name_key" ON "public"."notification_templates"("name");

-- CreateIndex
CREATE INDEX "notification_templates_name_idx" ON "public"."notification_templates"("name");

-- AddForeignKey
ALTER TABLE "public"."auth_credentials" ADD CONSTRAINT "auth_credentials_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auth_sessions" ADD CONSTRAINT "auth_sessions_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repositories" ADD CONSTRAINT "repositories_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repository_resources" ADD CONSTRAINT "repository_resources_repository_uuid_fkey" FOREIGN KEY ("repository_uuid") REFERENCES "public"."repositories"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."resource_references" ADD CONSTRAINT "resource_references_source_resource_uuid_fkey" FOREIGN KEY ("source_resource_uuid") REFERENCES "public"."repository_resources"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."resource_references" ADD CONSTRAINT "resource_references_target_resource_uuid_fkey" FOREIGN KEY ("target_resource_uuid") REFERENCES "public"."repository_resources"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."linked_contents" ADD CONSTRAINT "linked_contents_resource_uuid_fkey" FOREIGN KEY ("resource_uuid") REFERENCES "public"."repository_resources"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repository_explorers" ADD CONSTRAINT "repository_explorers_repository_uuid_fkey" FOREIGN KEY ("repository_uuid") REFERENCES "public"."repositories"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repository_explorers" ADD CONSTRAINT "repository_explorers_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repository_statistics" ADD CONSTRAINT "repository_statistics_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."editor_workspaces" ADD CONSTRAINT "editor_workspaces_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."editor_workspace_sessions" ADD CONSTRAINT "editor_workspace_sessions_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."editor_workspace_sessions" ADD CONSTRAINT "editor_workspace_sessions_workspace_uuid_fkey" FOREIGN KEY ("workspace_uuid") REFERENCES "public"."editor_workspaces"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."editor_workspace_session_groups" ADD CONSTRAINT "editor_workspace_session_groups_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."editor_workspace_session_groups" ADD CONSTRAINT "editor_workspace_session_groups_session_uuid_fkey" FOREIGN KEY ("session_uuid") REFERENCES "public"."editor_workspace_sessions"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."editor_workspace_session_group_tabs" ADD CONSTRAINT "editor_workspace_session_group_tabs_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."editor_workspace_session_group_tabs" ADD CONSTRAINT "editor_workspace_session_group_tabs_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "public"."editor_workspace_session_groups"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."settings" ADD CONSTRAINT "settings_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."settings" ADD CONSTRAINT "settings_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "public"."setting_groups"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."setting_groups" ADD CONSTRAINT "setting_groups_parent_uuid_fkey" FOREIGN KEY ("parent_uuid") REFERENCES "public"."setting_groups"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."setting_items" ADD CONSTRAINT "setting_items_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "public"."setting_groups"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminder_statistics" ADD CONSTRAINT "reminder_statistics_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goals" ADD CONSTRAINT "goals_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goals" ADD CONSTRAINT "goals_parent_goal_uuid_fkey" FOREIGN KEY ("parent_goal_uuid") REFERENCES "public"."goals"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notification_channels" ADD CONSTRAINT "notification_channels_notification_uuid_fkey" FOREIGN KEY ("notification_uuid") REFERENCES "public"."notifications"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_history" ADD CONSTRAINT "notification_history_notification_uuid_fkey" FOREIGN KEY ("notification_uuid") REFERENCES "public"."notifications"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
