/*
  Warnings:

  - Added the required column `account_uuid` to the `goals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."goals" ADD COLUMN     "account_uuid" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "goals_account_uuid_idx" ON "public"."goals"("account_uuid");

-- AddForeignKey
ALTER TABLE "public"."goals" ADD CONSTRAINT "goals_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
