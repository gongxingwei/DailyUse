# E2E 测试文件更新 - 适应 Schedule 模块重构

## 📋 更新概览

**文件**: `apps/api/src/__tests__/e2e/reminder-to-notification-full-flow.test.ts`

**更新日期**: 2025-10-07

**原因**: Schedule 模块重构后，`ScheduleTask` 表结构发生了重大变化，需要更新 E2E 测试以适应新架构。

---

## 🔄 架构变化

### 旧的 ScheduleTask 表结构 ❌

```typescript
interface OldScheduleTask {
  uuid: string;
  accountUuid: string;           // ❌ 移除（聚合根不再有 accountUuid）
  taskType: string;              // ❌ 移除（用 sourceModule 替代）
  title: string;                 // ❌ 移除（用 name 替代）
  scheduledTime: Date;           // ❌ 移除（统一用 cronExpression）
  nextScheduledAt?: Date;        // ❌ 移除（由调度器管理）
  lastExecutedAt?: Date;         // ❌ 移除（由调度器管理）
  executionCount: number;        // ❌ 移除（由调度器管理）
  payload: any;                  // ❌ 移除（用 metadata 替代）
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 新的 ScheduleTask 表结构 ✅

```typescript
interface NewScheduleTask {
  uuid: string;
  name: string;                  // ✅ 新增（任务名称）
  description?: string;          // ✅ 新增（任务描述）
  cronExpression: string;        // ✅ 新增（统一使用 Cron 表达式）
  sourceModule: string;          // ✅ 新增（来源模块，如 'reminder'）
  sourceEntityId: string;        // ✅ 新增（来源实体 ID）
  metadata?: Record<string, any>; // ✅ 新增（元数据）
  enabled: boolean;
  status: string;                // ✅ 新增（任务状态）
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 📝 更新的测试部分

### 1. Step 2: 验证 ScheduleTask 自动创建

#### 之前 ❌

```typescript
const scheduleTasks = await prisma.scheduleTask.findMany({
  where: {
    accountUuid: testAccountUuid,    // ❌ 不存在
    taskType: 'reminder',             // ❌ 不存在
    enabled: true,
  },
  // ...
});

console.log(`     Title: ${latestTask.title}`);              // ❌ 不存在
console.log(`     Type: ${latestTask.taskType}`);            // ❌ 不存在
console.log(`     Scheduled Time: ${latestTask.scheduledTime}`); // ❌ 不存在
console.log(`     Next Run: ${latestTask.nextScheduledAt}`); // ❌ 不存在

const payload = latestTask.payload as any;                   // ❌ 不存在
```

#### 现在 ✅

```typescript
const scheduleTasks = await prisma.scheduleTask.findMany({
  where: {
    sourceModule: 'reminder',         // ✅ 正确
    enabled: true,
  },
  // ...
});

console.log(`     Name: ${latestTask.name}`);               // ✅ 正确
console.log(`     Source Module: ${latestTask.sourceModule}`); // ✅ 正确
console.log(`     Source Entity ID: ${latestTask.sourceEntityId}`); // ✅ 正确
console.log(`     Cron Expression: ${latestTask.cronExpression}`);  // ✅ 正确
console.log(`     Status: ${latestTask.status}`);           // ✅ 正确

expect(latestTask.sourceModule).toBe('reminder');           // ✅ 正确
expect(latestTask.cronExpression).toBeDefined();            // ✅ 正确
```

### 2. Step 3: 模拟调度器触发任务

#### 之前 ❌

```typescript
const task = await prisma.scheduleTask.findFirst({
  where: {
    accountUuid: testAccountUuid,    // ❌ 不存在
    taskType: 'reminder',             // ❌ 不存在
    enabled: true,
  },
});

await prisma.scheduleTask.update({
  where: { uuid: task!.uuid },
  data: {
    lastExecutedAt: executionTime,   // ❌ 不存在
    executionCount: { increment: 1 }, // ❌ 不存在
    nextScheduledAt: new Date(...),  // ❌ 不存在
  },
});

const payload = task!.payload as any; // ❌ 不存在
```

#### 现在 ✅

```typescript
const task = await prisma.scheduleTask.findFirst({
  where: {
    sourceModule: 'reminder',         // ✅ 正确
    enabled: true,
  },
});

console.log(`  📋 Task name: ${task!.name}`);              // ✅ 正确
console.log(`  📋 Cron expression: ${task!.cronExpression}`); // ✅ 正确

await prisma.scheduleTask.update({
  where: { uuid: task!.uuid },
  data: {
    status: 'active',                 // ✅ 正确
    updatedAt: executionTime,         // ✅ 正确
  },
});

// 使用 task 的属性，而不是 payload
const metadata = {
  sourceModule: task!.sourceModule,   // ✅ 正确
  sourceEntityId: task!.sourceEntityId, // ✅ 正确
  taskId: task!.uuid,
  taskName: task!.name,
};
```

### 3. Step 5: 验证完整流程

#### 之前 ❌

```typescript
const scheduleTask = await prisma.scheduleTask.findFirst({
  where: {
    accountUuid: testAccountUuid,    // ❌ 不存在
    taskType: 'reminder',             // ❌ 不存在
  },
});

expect(scheduleTask!.executionCount).toBeGreaterThan(0); // ❌ 不存在
console.log(`Executed ${scheduleTask!.executionCount} times`);
console.log(`(Executed ${scheduleTask!.executionCount}x)`);
```

#### 现在 ✅

```typescript
const scheduleTask = await prisma.scheduleTask.findFirst({
  where: {
    sourceModule: 'reminder',         // ✅ 正确
  },
});

expect(scheduleTask!.status).toBeDefined(); // ✅ 正确
console.log(`Status=${scheduleTask!.status}, Cron=${scheduleTask!.cronExpression}`);
console.log(`(Cron: ${scheduleTask!.cronExpression})`);
```

### 4. Step 6: 测试循环调度

#### 之前 ❌

```typescript
it('should verify recurring task is re-queued', async () => {
  const task = await prisma.scheduleTask.findFirst({
    where: {
      accountUuid: testAccountUuid,  // ❌ 不存在
      taskType: 'reminder',           // ❌ 不存在
    },
  });

  expect(task!.nextScheduledAt).toBeDefined(); // ❌ 不存在

  const now = Date.now();
  const nextRun = task!.nextScheduledAt!.getTime();
  const interval = nextRun - now;

  // 验证间隔约为 60 秒
  expect(interval).toBeGreaterThan(50000);
  expect(interval).toBeLessThan(70000);
});
```

#### 现在 ✅

```typescript
it('should verify recurring task configuration', async () => {
  const task = await prisma.scheduleTask.findFirst({
    where: {
      sourceModule: 'reminder',      // ✅ 正确
    },
  });

  expect(task!.cronExpression).toBeDefined(); // ✅ 正确

  console.log(`  ⏰ Cron expression: ${task!.cronExpression}`);
  console.log(`  ⏰ Status: ${task!.status}`);
  console.log(`  ⏰ Enabled: ${task!.enabled}`);

  // 验证 Cron 表达式存在且格式正确
  expect(task!.cronExpression).toMatch(/^[\d\*\-\/,\s]+$/);
  expect(task!.enabled).toBe(true);
});
```

### 5. Performance Metrics

#### 之前 ❌

```typescript
const task = await prisma.scheduleTask.findFirst({
  where: { accountUuid: testAccountUuid, taskType: 'reminder' }, // ❌ 错误
});

const taskExecuted = task.lastExecutedAt?.getTime() || 0; // ❌ 不存在
```

#### 现在 ✅

```typescript
const task = await prisma.scheduleTask.findFirst({
  where: { sourceModule: 'reminder' },                      // ✅ 正确
});

const taskCreated = task.createdAt?.getTime() || 0;        // ✅ 正确
console.log(`  Cron Expression:  ${task.cronExpression}`); // ✅ 新增
```

---

## 🎯 关键变化总结

| 字段/概念 | 旧方式 | 新方式 |
|----------|--------|--------|
| 账户关联 | `accountUuid` | ❌ 移除（不再直接关联账户） |
| 任务类型 | `taskType` | `sourceModule` |
| 任务标题 | `title` | `name` |
| 调度时间 | `scheduledTime` | `cronExpression` |
| 下次运行 | `nextScheduledAt` | ❌ 移除（由调度器管理） |
| 上次执行 | `lastExecutedAt` | ❌ 移除（由调度器管理） |
| 执行次数 | `executionCount` | ❌ 移除（由调度器管理） |
| 任务载荷 | `payload` | `metadata` + 直接字段 |
| 任务描述 | ❌ 不存在 | `description` |
| 来源实体 | `payload.sourceId` | `sourceEntityId` |
| 任务状态 | ❌ 不存在 | `status` |

---

## ✅ 验证清单

测试文件更新后，确保：

- [x] 所有查询使用 `sourceModule` 而非 `accountUuid` 或 `taskType`
- [x] 所有字段引用使用新的字段名（`name`, `cronExpression` 等）
- [x] 移除对 `payload`、`lastExecutedAt`、`nextScheduledAt` 等字段的引用
- [x] 使用 `status` 而非 `executionCount` 来验证任务状态
- [x] Cron 表达式验证替代时间间隔验证
- [x] 日志输出更新为新的字段名

---

## 🚀 测试运行

更新后的测试应该能够：

1. ✅ 成功查询新的 `ScheduleTask` 表
2. ✅ 验证 Cron 表达式配置
3. ✅ 检查任务状态和启用状态
4. ✅ 验证来源模块和实体 ID
5. ✅ 完成端到端流程测试

---

## 📚 相关文档

- `SCHEDULE_REFACTORING_FINAL_SUMMARY.md` - 完整重构总结
- `SCHEDULE_CRON_MIGRATION_GUIDE.md` - 迁移指南
- `SCHEDULE_REFACTORING_CHECKLIST.md` - 测试检查清单

---

**更新日期**: 2025-10-07  
**状态**: ✅ 完成  
**下一步**: 运行测试验证
