-- CreateTable
CREATE TABLE "public"."notifications" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "template_uuid" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "channels" TEXT NOT NULL DEFAULT '[]',
    "icon" TEXT,
    "image" TEXT,
    "actions" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "metadata" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."notification_templates" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title_template" TEXT NOT NULL,
    "content_template" TEXT NOT NULL,
    "icon" TEXT,
    "default_priority" TEXT NOT NULL,
    "default_channels" TEXT NOT NULL DEFAULT '[]',
    "default_actions" TEXT,
    "variables" TEXT NOT NULL DEFAULT '[]',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."notification_preferences" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "enabled_types" TEXT NOT NULL DEFAULT '[]',
    "channel_preferences" TEXT NOT NULL DEFAULT '{}',
    "max_notifications" INTEGER NOT NULL DEFAULT 100,
    "auto_archive_days" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."delivery_receipts" (
    "uuid" TEXT NOT NULL,
    "notification_uuid" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,

    CONSTRAINT "delivery_receipts_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "notifications_account_uuid_idx" ON "public"."notifications"("account_uuid");

-- CreateIndex
CREATE INDEX "notifications_template_uuid_idx" ON "public"."notifications"("template_uuid");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "public"."notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_priority_idx" ON "public"."notifications"("priority");

-- CreateIndex
CREATE INDEX "notifications_scheduled_at_idx" ON "public"."notifications"("scheduled_at");

-- CreateIndex
CREATE INDEX "notifications_sent_at_idx" ON "public"."notifications"("sent_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "public"."notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_account_uuid_status_idx" ON "public"."notifications"("account_uuid", "status");

-- CreateIndex
CREATE INDEX "notifications_account_uuid_type_idx" ON "public"."notifications"("account_uuid", "type");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_name_key" ON "public"."notification_templates"("name");

-- CreateIndex
CREATE INDEX "notification_templates_name_idx" ON "public"."notification_templates"("name");

-- CreateIndex
CREATE INDEX "notification_templates_type_idx" ON "public"."notification_templates"("type");

-- CreateIndex
CREATE INDEX "notification_templates_enabled_idx" ON "public"."notification_templates"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_account_uuid_key" ON "public"."notification_preferences"("account_uuid");

-- CreateIndex
CREATE INDEX "notification_preferences_account_uuid_idx" ON "public"."notification_preferences"("account_uuid");

-- CreateIndex
CREATE INDEX "delivery_receipts_notification_uuid_idx" ON "public"."delivery_receipts"("notification_uuid");

-- CreateIndex
CREATE INDEX "delivery_receipts_channel_idx" ON "public"."delivery_receipts"("channel");

-- CreateIndex
CREATE INDEX "delivery_receipts_status_idx" ON "public"."delivery_receipts"("status");

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "public"."notification_templates"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "public"."accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_receipts" ADD CONSTRAINT "delivery_receipts_notification_uuid_fkey" FOREIGN KEY ("notification_uuid") REFERENCES "public"."notifications"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
