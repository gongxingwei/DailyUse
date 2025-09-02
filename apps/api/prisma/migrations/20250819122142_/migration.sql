/*
  Warnings:

  - The primary key for the `auth_tokens` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `auth_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `auth_tokens` table. All the data in the column will be lost.
  - The primary key for the `user_profiles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `avatarUrl` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[account_uuid]` on the table `user_profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `account_uuid` to the `auth_tokens` table without a default value. This is not possible if the table is not empty.
  - The required column `uuid` was added to the `auth_tokens` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `account_uuid` to the `user_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `first_name` to the `user_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `user_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sex` to the `user_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_profiles` table without a default value. This is not possible if the table is not empty.
  - The required column `uuid` was added to the `user_profiles` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "auth_tokens" DROP CONSTRAINT "auth_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_user_id_fkey";

-- DropIndex
DROP INDEX "auth_tokens_user_id_idx";

-- DropIndex
DROP INDEX "user_profiles_user_id_key";

-- AlterTable
ALTER TABLE "auth_tokens" DROP CONSTRAINT "auth_tokens_pkey",
DROP COLUMN "id",
DROP COLUMN "user_id",
ADD COLUMN     "account_uuid" TEXT NOT NULL,
ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "uuid" TEXT NOT NULL,
ADD CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("uuid");

-- AlterTable
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_pkey",
DROP COLUMN "avatarUrl",
DROP COLUMN "displayName",
DROP COLUMN "firstName",
DROP COLUMN "id",
DROP COLUMN "lastName",
DROP COLUMN "user_id",
ADD COLUMN     "account_uuid" TEXT NOT NULL,
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "display_name" TEXT,
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "preferences" TEXT,
ADD COLUMN     "sex" INTEGER NOT NULL,
ADD COLUMN     "social_accounts" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uuid" TEXT NOT NULL,
ADD COLUMN     "website" TEXT,
ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("uuid");

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "accounts" (
    "uuid" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "account_type" TEXT NOT NULL DEFAULT 'local',
    "status" TEXT NOT NULL DEFAULT 'active',
    "role_ids" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "email_verification_token" TEXT,
    "phone_verification_code" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "auth_credentials" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "password_salt" TEXT NOT NULL,
    "password_algorithm" TEXT NOT NULL,
    "password_created_at" TIMESTAMP(3) NOT NULL,
    "password_expires_at" TIMESTAMP(3),
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "lock_reason" TEXT,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_credentials_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "device_info" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "mfa_devices" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "secret_key" TEXT,
    "phone_number" TEXT,
    "email_address" TEXT,
    "backup_codes" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "verification_attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "mfa_devices_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "repositories" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT,
    "related_goals" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "goals" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "tasks" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "goal_uuid" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_username_key" ON "accounts"("username");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_phone_key" ON "accounts"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "auth_credentials_account_uuid_key" ON "auth_credentials"("account_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_id_key" ON "user_sessions"("session_id");

-- CreateIndex
CREATE INDEX "auth_tokens_account_uuid_idx" ON "auth_tokens"("account_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_account_uuid_key" ON "user_profiles"("account_uuid");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_credentials" ADD CONSTRAINT "auth_credentials_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mfa_devices" ADD CONSTRAINT "mfa_devices_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_goal_uuid_fkey" FOREIGN KEY ("goal_uuid") REFERENCES "goals"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
