-- AlterTable
ALTER TABLE "task_templates" ADD COLUMN     "blocking_reason" TEXT,
ADD COLUMN     "dependency_status" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "is_blocked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "task_dependencies" (
    "uuid" TEXT NOT NULL,
    "predecessor_task_uuid" TEXT NOT NULL,
    "successor_task_uuid" TEXT NOT NULL,
    "dependency_type" TEXT NOT NULL DEFAULT 'FINISH_TO_START',
    "lag_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "schedules" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_time" BIGINT NOT NULL,
    "end_time" BIGINT NOT NULL,
    "duration" INTEGER NOT NULL,
    "has_conflict" BOOLEAN NOT NULL DEFAULT false,
    "conflicting_schedules" TEXT,
    "priority" INTEGER,
    "location" TEXT,
    "attendees" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "task_dependencies_predecessor_task_uuid_idx" ON "task_dependencies"("predecessor_task_uuid");

-- CreateIndex
CREATE INDEX "task_dependencies_successor_task_uuid_idx" ON "task_dependencies"("successor_task_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "task_dependencies_predecessor_task_uuid_successor_task_uuid_key" ON "task_dependencies"("predecessor_task_uuid", "successor_task_uuid");

-- CreateIndex
CREATE INDEX "schedules_account_uuid_idx" ON "schedules"("account_uuid");

-- CreateIndex
CREATE INDEX "schedules_account_uuid_start_time_end_time_idx" ON "schedules"("account_uuid", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "schedules_start_time_end_time_idx" ON "schedules"("start_time", "end_time");

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_predecessor_task_uuid_fkey" FOREIGN KEY ("predecessor_task_uuid") REFERENCES "task_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_successor_task_uuid_fkey" FOREIGN KEY ("successor_task_uuid") REFERENCES "task_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
