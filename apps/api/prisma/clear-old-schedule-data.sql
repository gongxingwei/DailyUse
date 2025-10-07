-- 清空旧的 Schedule 相关数据
-- 开发阶段数据清理脚本

-- 1. 清空 schedule_executions 表（依赖 schedule_tasks）
DELETE FROM schedule_executions;

-- 2. 清空 old_schedule_tasks 表
DELETE FROM schedule_tasks;

-- 3. 清空 recurring_schedule_tasks 表
DELETE FROM recurring_schedule_tasks;

-- 确认清理结果
SELECT 'schedule_tasks' as table_name, COUNT(*) as remaining_rows FROM schedule_tasks
UNION ALL
SELECT 'recurring_schedule_tasks', COUNT(*) FROM recurring_schedule_tasks
UNION ALL
SELECT 'schedule_executions', COUNT(*) FROM schedule_executions;
