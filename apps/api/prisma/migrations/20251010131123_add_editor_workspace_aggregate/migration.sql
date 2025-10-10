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
