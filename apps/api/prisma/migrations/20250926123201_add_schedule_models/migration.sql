-- CreateTable
CREATE TABLE "public"."schedule_tasks" (
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

    CONSTRAINT "schedule_tasks_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."schedule_executions" (
    "uuid" TEXT NOT NULL,
    "task_uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "result" JSONB,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_executions_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "schedule_tasks_account_uuid_idx" ON "public"."schedule_tasks"("account_uuid");

-- CreateIndex
CREATE INDEX "schedule_tasks_status_idx" ON "public"."schedule_tasks"("status");

-- CreateIndex
CREATE INDEX "schedule_tasks_task_type_idx" ON "public"."schedule_tasks"("task_type");

-- CreateIndex
CREATE INDEX "schedule_tasks_enabled_idx" ON "public"."schedule_tasks"("enabled");

-- CreateIndex
CREATE INDEX "schedule_tasks_scheduled_time_idx" ON "public"."schedule_tasks"("scheduled_time");

-- CreateIndex
CREATE INDEX "schedule_tasks_next_scheduled_at_idx" ON "public"."schedule_tasks"("next_scheduled_at");

-- CreateIndex
CREATE INDEX "schedule_tasks_priority_idx" ON "public"."schedule_tasks"("priority");

-- CreateIndex
CREATE INDEX "schedule_executions_task_uuid_idx" ON "public"."schedule_executions"("task_uuid");

-- CreateIndex
CREATE INDEX "schedule_executions_account_uuid_idx" ON "public"."schedule_executions"("account_uuid");

-- CreateIndex
CREATE INDEX "schedule_executions_status_idx" ON "public"."schedule_executions"("status");

-- CreateIndex
CREATE INDEX "schedule_executions_started_at_idx" ON "public"."schedule_executions"("started_at");

-- CreateIndex
CREATE INDEX "schedule_executions_created_at_idx" ON "public"."schedule_executions"("created_at");

-- AddForeignKey
ALTER TABLE "public"."schedule_tasks" ADD CONSTRAINT "schedule_tasks_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_executions" ADD CONSTRAINT "schedule_executions_task_uuid_fkey" FOREIGN KEY ("task_uuid") REFERENCES "public"."schedule_tasks"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_executions" ADD CONSTRAINT "schedule_executions_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
