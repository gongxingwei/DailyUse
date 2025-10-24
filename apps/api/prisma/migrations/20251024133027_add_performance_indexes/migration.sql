-- CreateIndex for Goal model
CREATE INDEX IF NOT EXISTS "goals_account_uuid_status_idx" ON "goals"("account_uuid", "status");

-- CreateIndex for Goal model
CREATE INDEX IF NOT EXISTS "goals_account_uuid_folder_uuid_idx" ON "goals"("account_uuid", "folder_uuid");

-- CreateIndex for Goal model
CREATE INDEX IF NOT EXISTS "goals_created_at_idx" ON "goals"("created_at");

-- CreateIndex for Goal model
CREATE INDEX IF NOT EXISTS "goals_target_date_idx" ON "goals"("target_date");

-- CreateIndex for KeyResult model
CREATE INDEX IF NOT EXISTS "key_results_goal_uuid_created_at_idx" ON "key_results"("goal_uuid", "created_at");

-- CreateIndex for TaskTemplate model
CREATE INDEX IF NOT EXISTS "task_templates_account_uuid_status_idx" ON "task_templates"("account_uuid", "status");

-- CreateIndex for TaskTemplate model
CREATE INDEX IF NOT EXISTS "task_templates_account_uuid_task_type_idx" ON "task_templates"("account_uuid", "task_type");

-- CreateIndex for TaskTemplate model
CREATE INDEX IF NOT EXISTS "task_templates_account_uuid_deleted_at_idx" ON "task_templates"("account_uuid", "deleted_at");

-- CreateIndex for TaskInstance model
CREATE INDEX IF NOT EXISTS "task_instances_template_uuid_instance_date_idx" ON "task_instances"("template_uuid", "instance_date");

-- CreateIndex for TaskInstance model
CREATE INDEX IF NOT EXISTS "task_instances_account_uuid_status_idx" ON "task_instances"("account_uuid", "status");

-- CreateIndex for TaskInstance model
CREATE INDEX IF NOT EXISTS "task_instances_account_uuid_instance_date_idx" ON "task_instances"("account_uuid", "instance_date");
