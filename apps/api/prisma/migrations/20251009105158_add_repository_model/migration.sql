/*
  Warnings:

  - A unique constraint covering the columns `[account_uuid,path]` on the table `repositories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `config` to the `repositories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stats` to the `repositories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `repositories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable - 先添加带默认值的列，然后移除默认值
ALTER TABLE "public"."repositories" 
  ADD COLUMN "config" TEXT NOT NULL DEFAULT '{"enableGit":false,"autoSync":false,"supportedFileTypes":[],"maxFileSize":10485760,"defaultLinkedDocName":"README.md","enableVersionControl":false}',
  ADD COLUMN "git" TEXT,
  ADD COLUMN "last_accessed_at" TIMESTAMP(3),
  ADD COLUMN "stats" TEXT NOT NULL DEFAULT '{"totalFiles":0,"totalSize":0,"totalDirectories":0,"indexedFiles":0,"lastScanAt":null}',
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN "sync_status" TEXT,
  ADD COLUMN "type" TEXT NOT NULL DEFAULT 'local';

-- 移除临时默认值（对于新行仍然需要提供这些值）
ALTER TABLE "public"."repositories" 
  ALTER COLUMN "config" DROP DEFAULT,
  ALTER COLUMN "stats" DROP DEFAULT,
  ALTER COLUMN "type" DROP DEFAULT;

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
