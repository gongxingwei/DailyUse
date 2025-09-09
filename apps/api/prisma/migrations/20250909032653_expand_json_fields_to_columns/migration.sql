/*
  Warnings:

  - You are about to drop the column `lifecycle` on the `goal_directories` table. All the data in the column will be lost.
  - You are about to drop the column `sort_config` on the `goal_directories` table. All the data in the column will be lost.
  - You are about to drop the column `analysis` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `lifecycle` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `lifecycle` on the `key_results` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."goal_directories" DROP COLUMN "lifecycle",
DROP COLUMN "sort_config",
ADD COLUMN     "sort_key" TEXT NOT NULL DEFAULT 'createdAt',
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "public"."goals" DROP COLUMN "analysis",
DROP COLUMN "lifecycle",
DROP COLUMN "metadata",
ADD COLUMN     "category" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "feasibility" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "importance_level" TEXT NOT NULL DEFAULT 'moderate',
ADD COLUMN     "motive" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tags" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "urgency_level" TEXT NOT NULL DEFAULT 'medium';

-- AlterTable
ALTER TABLE "public"."key_results" DROP COLUMN "lifecycle",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- CreateIndex
CREATE INDEX "goal_directories_status_idx" ON "public"."goal_directories"("status");

-- CreateIndex
CREATE INDEX "goal_directories_sort_order_idx" ON "public"."goal_directories"("sort_order");

-- CreateIndex
CREATE INDEX "goals_status_idx" ON "public"."goals"("status");

-- CreateIndex
CREATE INDEX "goals_importance_level_idx" ON "public"."goals"("importance_level");

-- CreateIndex
CREATE INDEX "goals_urgency_level_idx" ON "public"."goals"("urgency_level");

-- CreateIndex
CREATE INDEX "goals_category_idx" ON "public"."goals"("category");

-- CreateIndex
CREATE INDEX "key_results_status_idx" ON "public"."key_results"("status");
