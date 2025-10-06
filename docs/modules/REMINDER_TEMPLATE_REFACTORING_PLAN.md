# ReminderTemplate 架构重构计划

## 🎯 重构目标

将 ReminderTemplate 从"预生成实例"模式重构为"委托调度"模式，使用 Schedule 模块的 cron 调度器来管理提醒触发。

## 📋 需要删除的内容

### 1. 实例管理相关

**删除字段**:
- `instances: ReminderInstance[]`

**删除方法**:
- `createInstance(triggerTime: Date, context?: any): string`
- `getInstance(instanceUuid: string): ReminderInstance | undefined`
- `removeInstance(instanceUuid: string): void`

### 2. 触发时间计算相关

**删除方法**:
- `getNextTriggerTime(fromTime?: Date): Date | null`
- `calculateDailyTrigger(baseTime: Date): Date`
- `calculateWeeklyTrigger(baseTime: Date): Date`
- `calculateMonthlyTrigger(baseTime: Date): Date`
- `calculateAbsoluteTrigger(baseTime: Date): Date | null`
- `calculateCustomIntervalTrigger(baseTime: Date): Date`
- `triggerReminder(instanceUuid: string): void`

这些逻辑已经移到 `domain-server/src/schedule/services/cronHelper.ts` 中。

## ✅ 需要添加的内容

### 1. Cron 表达式生成

```typescript
/**
 * 转换为 cron 表达式
 * 返回 null 表示不支持 cron（如某些自定义间隔）
 */
toCronExpression(): string | null {
  return timeConfigToCronExpression(this.timeConfig);
}
```

### 2. 调度任务关联

```typescript
/**
 * 获取关联的调度任务元数据
 */
getScheduleTaskMetadata(): Record<string, any> {
  return {
    templateUuid: this.uuid,
    templateName: this.name,
    message: this.message,
    priority: this.priority,
    category: this.category,
    tags: this.tags,
    notificationSettings: this.notificationSettings,
    snoozeConfig: this.snoozeConfig,
  };
}
```

## 🔄 迁移流程

### 阶段 1: 创建并行系统
1. ✅ 创建 Schedule 模块（RecurringScheduleTask, SchedulerService）
2. ✅ 创建 cronHelper 辅助函数
3. ⏳ 保持 ReminderTemplate 现有功能不变
4. ⏳ 创建事件监听器，当 ReminderTemplate 创建/更新时自动创建 Schedule 任务

### 阶段 2: 双写阶段
1. ⏳ ReminderTemplate 创建时同时创建 ReminderInstance 和 ScheduleTask
2. ⏳ 前端同时显示两种数据
3. ⏳ 监控两种系统的运行情况

### 阶段 3: 切换阶段
1. ⏳ 前端切换到只使用 ScheduleTask 数据
2. ⏳ 停止生成新的 ReminderInstance
3. ⏳ 保留旧的 ReminderInstance 供查询

### 阶段 4: 清理阶段
1. ⏳ 删除 ReminderTemplate 的实例管理代码
2. ⏳ 删除 ReminderInstance 相关 API
3. ⏳ 数据库迁移：删除 ReminderInstance 表

## 📝 当前进度

- [x] 创建 Schedule 模块核心实体
- [x] 创建 SchedulerService
- [x] 创建 cronHelper
- [ ] 创建事件监听器（阶段 1 的最后一步）
- [ ] 开始阶段 2：双写

## ⚠️ 注意事项

1. **不要直接删除现有代码**：先创建并行系统，确保稳定后再切换
2. **数据库兼容性**：保持 ReminderInstance 表直到确认不再需要
3. **前端兼容性**：前端需要能同时处理两种数据源
4. **回滚计划**：每个阶段都要有回滚方案

## 🎯 下一步行动

**优先级 1: 创建事件监听器**
- 文件位置: `apps/api/src/modules/reminder/listeners/ReminderTemplateScheduleSyncListener.ts`
- 功能: 监听 ReminderTemplate 的创建/更新/删除事件，自动同步到 Schedule 模块

**优先级 2: API 层集成**
- 更新 ReminderTemplateController，在创建/更新时同时操作 Schedule
- 添加新的端点查询 ScheduleTask 状态

**优先级 3: 前端适配**
- 前端同时查询 instances 和 scheduleTasks
- UI 显示调度状态（下次执行时间、执行历史）
