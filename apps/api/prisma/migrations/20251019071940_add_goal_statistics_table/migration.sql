-- CreateTable
CREATE TABLE "public"."goal_statistics" (
    "id" SERIAL NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "total_goals" INTEGER NOT NULL DEFAULT 0,
    "active_goals" INTEGER NOT NULL DEFAULT 0,
    "completed_goals" INTEGER NOT NULL DEFAULT 0,
    "archived_goals" INTEGER NOT NULL DEFAULT 0,
    "overdue_goals" INTEGER NOT NULL DEFAULT 0,
    "total_key_results" INTEGER NOT NULL DEFAULT 0,
    "completed_key_results" INTEGER NOT NULL DEFAULT 0,
    "average_progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "goals_by_importance" TEXT NOT NULL DEFAULT '{}',
    "goals_by_urgency" TEXT NOT NULL DEFAULT '{}',
    "goals_by_category" TEXT NOT NULL DEFAULT '{}',
    "goals_by_status" TEXT NOT NULL DEFAULT '{}',
    "goals_created_this_week" INTEGER NOT NULL DEFAULT 0,
    "goals_completed_this_week" INTEGER NOT NULL DEFAULT 0,
    "goals_created_this_month" INTEGER NOT NULL DEFAULT 0,
    "goals_completed_this_month" INTEGER NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DOUBLE PRECISION,
    "total_focus_sessions" INTEGER NOT NULL DEFAULT 0,
    "completed_focus_sessions" INTEGER NOT NULL DEFAULT 0,
    "total_focus_minutes" INTEGER NOT NULL DEFAULT 0,
    "last_calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "goal_statistics_account_uuid_key" ON "public"."goal_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "goal_statistics_account_uuid_idx" ON "public"."goal_statistics"("account_uuid");

-- AddForeignKey
ALTER TABLE "public"."goal_statistics" ADD CONSTRAINT "goal_statistics_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
