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
