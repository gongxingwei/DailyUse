-- CreateTable
CREATE TABLE "goal_folders" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "parent_uuid" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "goal_folders_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "goal_folders_account_uuid_idx" ON "goal_folders"("account_uuid");

-- CreateIndex
CREATE INDEX "goal_folders_parent_uuid_idx" ON "goal_folders"("parent_uuid");

-- CreateIndex
CREATE INDEX "goal_folders_account_uuid_is_archived_idx" ON "goal_folders"("account_uuid", "is_archived");

-- CreateIndex
CREATE INDEX "goal_folders_account_uuid_order_idx" ON "goal_folders"("account_uuid", "order");

-- AddForeignKey
ALTER TABLE "goal_folders" ADD CONSTRAINT "goal_folders_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_folders" ADD CONSTRAINT "goal_folders_parent_uuid_fkey" FOREIGN KEY ("parent_uuid") REFERENCES "goal_folders"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_folder_uuid_fkey" FOREIGN KEY ("folder_uuid") REFERENCES "goal_folders"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
