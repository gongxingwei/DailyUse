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

-- CreateIndex
CREATE UNIQUE INDEX "repository_statistics_account_uuid_key" ON "public"."repository_statistics"("account_uuid");

-- CreateIndex
CREATE INDEX "repository_statistics_account_uuid_idx" ON "public"."repository_statistics"("account_uuid");

-- AddForeignKey
ALTER TABLE "public"."repository_statistics" ADD CONSTRAINT "repository_statistics_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
