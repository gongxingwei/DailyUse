-- CreateTable
CREATE TABLE "public"."user_preferences" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'zh-CN',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "locale" TEXT NOT NULL DEFAULT 'zh-CN',
    "theme_mode" TEXT NOT NULL DEFAULT 'system',
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "push_notifications" BOOLEAN NOT NULL DEFAULT true,
    "auto_launch" BOOLEAN NOT NULL DEFAULT false,
    "default_module" TEXT NOT NULL DEFAULT 'goal',
    "analytics_enabled" BOOLEAN NOT NULL DEFAULT true,
    "crash_reports_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."user_theme_preferences" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "current_theme_uuid" TEXT,
    "preferred_mode" TEXT NOT NULL DEFAULT 'system',
    "auto_switch" BOOLEAN NOT NULL DEFAULT false,
    "schedule_start" TEXT,
    "schedule_end" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_theme_preferences_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_account_uuid_key" ON "public"."user_preferences"("account_uuid");

-- CreateIndex
CREATE INDEX "user_preferences_account_uuid_idx" ON "public"."user_preferences"("account_uuid");

-- CreateIndex
CREATE INDEX "user_preferences_language_idx" ON "public"."user_preferences"("language");

-- CreateIndex
CREATE INDEX "user_preferences_theme_mode_idx" ON "public"."user_preferences"("theme_mode");

-- CreateIndex
CREATE UNIQUE INDEX "user_theme_preferences_account_uuid_key" ON "public"."user_theme_preferences"("account_uuid");

-- CreateIndex
CREATE INDEX "user_theme_preferences_account_uuid_idx" ON "public"."user_theme_preferences"("account_uuid");

-- CreateIndex
CREATE INDEX "user_theme_preferences_preferred_mode_idx" ON "public"."user_theme_preferences"("preferred_mode");
