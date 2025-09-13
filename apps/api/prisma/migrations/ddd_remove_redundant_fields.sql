-- DDD聚合根数据库重构迁移脚本
-- 移除KeyResult和GoalRecord表中的冗余accountUuid字段

-- ===== 阶段1: 备份数据验证 =====
-- 在执行删除前，验证数据一致性

-- 验证KeyResult表的数据一致性
-- 检查是否存在accountUuid与goal.accountUuid不一致的记录
DO $$
DECLARE
    inconsistent_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO inconsistent_count
    FROM key_results kr
    JOIN goals g ON kr.goal_uuid = g.uuid
    WHERE kr.account_uuid != g.account_uuid;
    
    IF inconsistent_count > 0 THEN
        RAISE EXCEPTION 'KeyResult表存在数据不一致，发现 % 条记录的account_uuid与关联goal的account_uuid不匹配', inconsistent_count;
    ELSE
        RAISE NOTICE 'KeyResult表数据一致性验证通过';
    END IF;
END $$;

-- 验证GoalRecord表的数据一致性
DO $$
DECLARE
    inconsistent_count INTEGER;
BEGIN
    -- 检查GoalRecord的accountUuid是否与KeyResult的Goal一致
    SELECT COUNT(*) INTO inconsistent_count
    FROM goal_records gr
    JOIN key_results kr ON gr.key_result_uuid = kr.uuid
    JOIN goals g ON kr.goal_uuid = g.uuid
    WHERE gr.account_uuid != g.account_uuid;
    
    IF inconsistent_count > 0 THEN
        RAISE EXCEPTION 'GoalRecord表存在数据不一致，发现 % 条记录的account_uuid与关联goal的account_uuid不匹配', inconsistent_count;
    ELSE
        RAISE NOTICE 'GoalRecord表数据一致性验证通过';
    END IF;
    
    -- 检查GoalRecord的goalUuid是否与KeyResult的goalUuid一致
    SELECT COUNT(*) INTO inconsistent_count
    FROM goal_records gr
    JOIN key_results kr ON gr.key_result_uuid = kr.uuid
    WHERE gr.goal_uuid != kr.goal_uuid;
    
    IF inconsistent_count > 0 THEN
        RAISE EXCEPTION 'GoalRecord表存在逻辑不一致，发现 % 条记录的goal_uuid与key_result的goal_uuid不匹配', inconsistent_count;
    ELSE
        RAISE NOTICE 'GoalRecord表逻辑一致性验证通过';
    END IF;
END $$;

-- ===== 阶段2: 移除外键约束 =====

-- 移除KeyResult表的account外键约束
ALTER TABLE key_results DROP CONSTRAINT IF EXISTS key_results_account_uuid_fkey;

-- 移除GoalRecord表的account和goal外键约束
ALTER TABLE goal_records DROP CONSTRAINT IF EXISTS goal_records_account_uuid_fkey;
ALTER TABLE goal_records DROP CONSTRAINT IF EXISTS goal_records_goal_uuid_fkey;

-- ===== 阶段3: 移除索引 =====

-- 移除KeyResult表的account_uuid索引
DROP INDEX IF EXISTS key_results_account_uuid_idx;

-- 移除GoalRecord表的冗余索引
DROP INDEX IF EXISTS goal_records_account_uuid_idx;
DROP INDEX IF EXISTS goal_records_goal_uuid_idx;

-- ===== 阶段4: 移除冗余字段 =====

-- 移除KeyResult表的account_uuid字段
ALTER TABLE key_results DROP COLUMN IF EXISTS account_uuid;

-- 移除GoalRecord表的account_uuid和goal_uuid字段
ALTER TABLE goal_records DROP COLUMN IF EXISTS account_uuid;
ALTER TABLE goal_records DROP COLUMN IF EXISTS goal_uuid;

-- ===== 阶段5: 验证最终结果 =====

-- 验证字段已移除
DO $$
BEGIN
    -- 检查KeyResult表
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'key_results' AND column_name = 'account_uuid'
    ) THEN
        RAISE EXCEPTION 'KeyResult表的account_uuid字段未成功移除';
    ELSE
        RAISE NOTICE 'KeyResult表的account_uuid字段已成功移除';
    END IF;
    
    -- 检查GoalRecord表
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goal_records' AND column_name = 'account_uuid'
    ) THEN
        RAISE EXCEPTION 'GoalRecord表的account_uuid字段未成功移除';
    ELSE
        RAISE NOTICE 'GoalRecord表的account_uuid字段已成功移除';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goal_records' AND column_name = 'goal_uuid'
    ) THEN
        RAISE EXCEPTION 'GoalRecord表的goal_uuid字段未成功移除';
    ELSE
        RAISE NOTICE 'GoalRecord表的goal_uuid字段已成功移除';
    END IF;
END $$;

-- ===== 完成提示 =====
DO $$
BEGIN
    RAISE NOTICE '=== DDD聚合根数据库重构完成 ===';
    RAISE NOTICE '已成功移除冗余字段，实现标准DDD聚合根控制模式';
    RAISE NOTICE '1. KeyResult表: 移除account_uuid，只保留goal_uuid';
    RAISE NOTICE '2. GoalRecord表: 移除account_uuid和goal_uuid，只保留key_result_uuid';
    RAISE NOTICE '3. GoalReview表: 保持不变，已符合DDD设计';
    RAISE NOTICE '请继续执行Prisma Schema更新和代码适配';
END $$;
