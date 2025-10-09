/*
  Warnings:

  - A unique constraint covering the columns `[account_uuid,path]` on the table `repositories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `config` to the `repositories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stats` to the `repositories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `repositories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."repositories" ADD COLUMN     "config" TEXT NOT NULL,
ADD COLUMN     "git" TEXT,
ADD COLUMN     "last_accessed_at" TIMESTAMP(3),
ADD COLUMN     "stats" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "sync_status" TEXT,
ADD COLUMN     "type" TEXT NOT NULL;

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
