# Schedule 模块重构总结

## 📋 重构概述

根据你的建议，我们对 Schedule 模块进行了架构简化：

### 核心变更

**之前的设计**：
- 两个聚合根: `ScheduleTask`(旧) + `RecurringScheduleTask`(新)
- 两种触发器: `TriggerType.CRON` + `TriggerType.ONCE`
- 两个字段: `cronExpression` (重复任务) + `scheduledTime` (单次任务)

**统一后的设计** ✅：
- **一个聚合根**: `ScheduleTask`
- **一种触发器**: Cron 表达式（支持所有场景）
- **一个字段**: `cronExpression`

### 为什么单次任务也能用 Cron 表达式？

你的观察完全正确！Cron 表达式足以表达所有时间场景：

```typescript
// 单次任务示例
'0 10 15 1 * 2025'  // 2025年1月15日 10:00 执行一次
'30 14 25 12 * 2024' // 2024年12月25日 14:30 执行一次

// 重复任务示例
'0 9 * * 1-5'       // 工作日每天 9:00
'0 */2 * * *'       // 每2小时
'0 0 1 * *'         // 每月1号 00:00
'0 12 * * 0'        // 每周日 12:00
```

## 📂 已完成的变更

### 1. Domain Core - 聚合根

✅ **新建**: `packages/domain-core/src/schedule/aggregates/ScheduleTask.ts`

```typescript
export class ScheduleTask extends AggregateRoot {
  private _name: string;
  private _description?: string;
  private _cronExpression: string;  // 统一使用 Cron
  private _status: ScheduleTaskStatus;
  private _enabled: boolean;
  private _sourceModule: string;
  private _sourceEntityId: string;
  private _metadata?: Record<string, any>;
  private _nextRunAt?: Date;
  private _lastRunAt?: Date;
  private _executionCount: number;
  private _executionHistory: ScheduleExecutionHistory[];
  // ...
}
```

**关键改进**：
- ❌ 移除了 `_triggerType` 字段
- ❌ 移除了 `_scheduledTime` 字段
- ✅ 只保留 `_cronExpression` 字段
- ✅ 简化了 `create()` 工厂方法
- ✅ 移除了 `updateScheduledTime()` 方法
- ✅ 更新了 `recordExecution()` 支持 `isOneTime` 参数

### 2. Contracts - 类型定义

✅ **更新**: `packages/contracts/src/modules/schedule/dtos.ts`

```typescript
// 新的统一 DTO
export interface ScheduleTaskDTO {
  uuid: string;
  name: string;
  cronExpression: string;  // 必填，不再可选
  status: ScheduleTaskStatus;
  enabled: boolean;
  sourceModule: string;
  sourceEntityId: string;
  // ... 其他字段
}

// 创建 DTO
export interface CreateScheduleTaskDTO {
  name: string;
  cronExpression: string;  // 必填
  sourceModule: string;
  sourceEntityId: string;
  // ... 无 triggerType
}

// 废弃的 DTO（向后兼容）
/** @deprecated Use ScheduleTaskDTO instead */
export type RecurringScheduleTaskDTO = ScheduleTaskDTO & {
  /** @deprecated Use cronExpression instead */
  triggerType?: 'cron';
  /** @deprecated Merged into cronExpression */
  scheduledTime?: Date;
};
```

✅ **更新**: `packages/contracts/src/modules/schedule/enums.ts`

```typescript
/**
 * @deprecated No longer needed - all tasks use cron expressions
 */
export enum TriggerType {
  /** @deprecated All tasks use cron expressions now */
  CRON = 'cron',
  /** @deprecated Use cron expression with specific date instead */
  ONCE = 'once',
}
```

### 3. Prisma Schema - 数据库模型

✅ **更新**: `apps/api/prisma/schema.prisma`

```prisma
// 新的统一模型
model ScheduleTask {
  uuid             String    @id @default(cuid())
  name             String
  description      String?
  cronExpression   String    @map("cron_expression")  // ← 必填字段
  status           String    @default("active")
  enabled          Boolean   @default(true)
  sourceModule     String    @map("source_module")
  sourceEntityId   String    @map("source_entity_id")
  metadata         String    @default("{}")
  nextRunAt        DateTime? @map("next_run_at")
  lastRunAt        DateTime? @map("last_run_at")
  executionCount   Int       @default(0) @map("execution_count")
  executionHistory String    @default("[]") @map("execution_history")
  // ... 其他字段

  @@map("schedule_tasks")
}

// 旧模型（准备废弃）
model OldScheduleTask {
  // ... 保留用于数据迁移
  @@map("old_schedule_tasks")
}

// RecurringScheduleTask 保留（临时向后兼容）
model RecurringScheduleTask {
  // ... 将迁移到新的 ScheduleTask
  @@map("recurring_schedule_tasks")
}
```

### 4. Repository - 数据访问层

✅ **新建**: `apps/api/src/modules/schedule/infrastructure/repositories/ScheduleTaskRepository.ts`

```typescript
export class ScheduleTaskRepository implements IScheduleTaskRepository {
  async save(task: ScheduleTask): Promise<ScheduleTask> {
    const persistence = task.toPersistence();
    const saved = await this.prisma.scheduleTask.upsert({
      where: { uuid: task.uuid },
      create: persistence,
      update: persistence,
    });
    return ScheduleTask.fromPersistence(saved);
  }

  async findDueTasks(): Promise<ScheduleTask[]> {
    const now = new Date();
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        enabled: true,
        status: 'active',
        nextRunAt: { lte: now },
      },
    });
    return tasks.map(ScheduleTask.fromPersistence);
  }
  
  // ... 其他方法
}
```

## ⚠️ 当前状态

### Prisma 迁移已创建（但未应用）

迁移文件已创建，但由于现有数据需要处理，所以还未应用。

**警告信息**：
- 存在 10 条 `old_schedule_tasks` 数据
- 缺少 `cron_expression`, `name`, `source_module`, `source_entity_id` 等必填字段的默认值

## 🚀 下一步操作

### 方案 A: 清空旧数据后迁移（推荐用于开发环境）

```bash
# 1. 进入 API 目录
cd apps/api

# 2. 备份数据库（可选但推荐）
pg_dump -U postgres -d dailyuse > backup_before_schedule_refactoring.sql

# 3. 清空旧数据
npx prisma studio
# 在 UI 中删除所有 OldScheduleTask 和 RecurringScheduleTask 数据

# 4. 应用迁移
npx prisma migrate dev

# 5. 生成 Prisma Client
npx prisma generate
```

### 方案 B: 数据迁移脚本（推荐用于生产环境）

我可以帮你创建一个迁移脚本来转换现有数据：

1. **转换 OldScheduleTask**:
   ```typescript
   // scheduledTime → cronExpression
   // 示例: 2025-01-15T10:00:00 → '0 10 15 1 * 2025'
   ```

2. **转换 RecurringScheduleTask**:
   ```typescript
   // triggerType=CRON → 保留 cronExpression
   // triggerType=ONCE + scheduledTime → 转换为 cron
   ```

3. **保留元数据**:
   ```typescript
   // payload, recurrence → metadata JSON
   ```

### 方案 C: 手动逐步迁移

如果你想更谨慎地迁移，我可以：
1. 先保留所有三个表
2. 创建数据同步层
3. 逐步验证后再删除旧表

## 📝 使用示例

重构完成后的代码示例：

### 创建单次任务（Reminder 模块）

```typescript
// 在事件处理器中
const scheduleTask = ScheduleTask.create({
  uuid: generateUuid(),
  name: `Reminder: ${template.name}`,
  description: template.description,
  cronExpression: convertTimeToCron(template.eventTime),  // '0 9 15 1 * 2025'
  sourceModule: 'reminder',
  sourceEntityId: template.uuid,
  metadata: {
    templateName: template.name,
    soundEnabled: template.soundEnabled,
  },
  enabled: template.enabled,
});

await repository.save(scheduleTask);
```

### 创建重复任务

```typescript
const scheduleTask = ScheduleTask.create({
  uuid: generateUuid(),
  name: 'Daily Standup Reminder',
  cronExpression: '0 9 * * 1-5',  // 工作日每天9:00
  sourceModule: 'reminder',
  sourceEntityId: templateUuid,
  enabled: true,
});
```

### 更新 Cron 表达式

```typescript
const task = await repository.findByUuid(uuid);
task.updateCronExpression('0 14 * * *');  // 改为每天14:00
await repository.update(task);
```

### 执行记录

```typescript
// 单次任务执行成功后自动标记为 completed
task.recordExecution(
  true,           // success
  undefined,      // no error
  150,            // 150ms
  true,           // isOneTime
);

// 重复任务继续保持 active
task.recordExecution(
  true,
  undefined,
  200,
  false,          // not one-time
);
```

## 🎯 重构优势

### 1. 架构简化

| 维度 | 之前 | 现在 |
|------|------|------|
| 聚合根 | 3个 | 1个 |
| 数据表 | 3个 | 1个 |
| 触发器类型 | 2种 | 1种 |
| 时间字段 | 2个 | 1个 |
| DTO | 多套 | 1套 |

### 2. 类型安全

```typescript
// ❌ 之前: cronExpression 可选，容易出错
interface RecurringScheduleTaskDTO {
  triggerType: 'CRON' | 'ONCE';
  cronExpression?: string;      // 可选！
  scheduledTime?: Date;         // 可选！
}

// ✅ 现在: cronExpression 必填
interface ScheduleTaskDTO {
  cronExpression: string;       // 必填！
}
```

### 3. 代码一致性

```typescript
// ❌ 之前: 需要条件判断
if (task.triggerType === 'CRON') {
  // 使用 cronExpression
} else {
  // 使用 scheduledTime
}

// ✅ 现在: 统一处理
const nextRun = cronParser.parseExpression(task.cronExpression).next();
```

### 4. 维护成本降低

- 一个聚合根 → 更少的业务逻辑
- 一个 DTO → 更少的序列化代码
- 一种时间表达 → 更少的条件分支
- 一套 API → 更简单的文档

## 📚 相关文档

- [Cron 表达式教程](https://crontab.guru/)
- [DDD 聚合根设计原则](docs/systems/DDD_PRINCIPLES.md)
- [Prisma 迁移指南](https://www.prisma.io/docs/guides/migrate)

## ❓ 你的决定

请告诉我你想采用哪个迁移方案：

**方案 A**: 清空数据后迁移（快速，适合开发）
**方案 B**: 数据迁移脚本（安全，适合生产）
**方案 C**: 手动逐步迁移（谨慎，适合大型系统）

或者如果你有其他想法，我可以根据你的需求调整方案。
