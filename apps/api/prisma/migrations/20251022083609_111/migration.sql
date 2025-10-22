-- CreateTable
CREATE TABLE "key_result_weight_snapshots" (
    "uuid" TEXT NOT NULL,
    "goal_uuid" TEXT NOT NULL,
    "key_result_uuid" TEXT NOT NULL,
    "old_weight" DOUBLE PRECISION NOT NULL,
    "new_weight" DOUBLE PRECISION NOT NULL,
    "weight_delta" DOUBLE PRECISION NOT NULL,
    "snapshot_time" BIGINT NOT NULL,
    "trigger" TEXT NOT NULL,
    "reason" TEXT,
    "operator_uuid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "key_result_weight_snapshots_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "key_result_weight_snapshots_goal_uuid_idx" ON "key_result_weight_snapshots"("goal_uuid");

-- CreateIndex
CREATE INDEX "key_result_weight_snapshots_key_result_uuid_idx" ON "key_result_weight_snapshots"("key_result_uuid");

-- CreateIndex
CREATE INDEX "key_result_weight_snapshots_snapshot_time_idx" ON "key_result_weight_snapshots"("snapshot_time");

-- CreateIndex
CREATE INDEX "key_result_weight_snapshots_goal_uuid_snapshot_time_idx" ON "key_result_weight_snapshots"("goal_uuid", "snapshot_time");

-- AddForeignKey
ALTER TABLE "key_result_weight_snapshots" ADD CONSTRAINT "key_result_weight_snapshots_goal_uuid_fkey" FOREIGN KEY ("goal_uuid") REFERENCES "goals"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_result_weight_snapshots" ADD CONSTRAINT "key_result_weight_snapshots_key_result_uuid_fkey" FOREIGN KEY ("key_result_uuid") REFERENCES "key_results"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
