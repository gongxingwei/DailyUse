# 编译错误修复总结

## 📋 问题描述

在启动 Web 端和 API 端时遇到四个编译错误：

### 1. Web 端错误 #1
```
[ERROR] No matching export in "../../packages/domain-core/src/index.ts" for import "ScheduleTaskCore"
```

### 2. Web 端错误 #2
```
Uncaught SyntaxError: The requested module '/@fs/.../packages/contracts/src/modules/notification/enums.ts' does not provide an export named 'SortOrder'
```

### 3. API 端错误 #1
```
SyntaxError: The requested module 'cron-parser' does not provide an export named 'parseExpression'
```

### 4. API 端错误 #2
```
SyntaxError: The requested module '@dailyuse/domain-server' does not provide an export named 'ScheduleTask'
```

## 🔧 修复方案

### 修复 1: 导出 ScheduleTaskCore

**问题原因**：
- `domain-client` 中的 `ScheduleTask.ts` 尝试导入 `ScheduleTaskCore`
- 但 `domain-core` 中没有导出这个类名

**解决方案**：
在 `packages/domain-core/src/schedule/aggregates/index.ts` 中添加别名导出：

```typescript
export * from './RecurringScheduleTask';
export { RecurringScheduleTask as ScheduleTaskCore } from './RecurringScheduleTask';
```

**文件修改**：
- ✅ `packages/domain-core/src/schedule/aggregates/index.ts`

### 修复 2: 使用正确的 cron-parser API

**问题原因**：
- 代码使用了旧版本的 API `parseExpression()`
- cron-parser@5.4.0 使用新的 API: `CronExpressionParser.parse()`

**官方文档参考**：
https://www.npmjs.com/package/cron-parser

**正确用法**：
```typescript
// ❌ 错误的旧版 API
import { parseExpression } from 'cron-parser';
const interval = parseExpression('*/5 * * * *');

// ✅ 正确的新版 API
import { CronExpressionParser } from 'cron-parser';
const interval = CronExpressionParser.parse('*/5 * * * *');
```

**解决方案**：
在 `packages/domain-server/src/schedule/services/SchedulerService.ts` 中：

```typescript
// 修改导入
import { Injectable, type OnModuleInit, type OnModuleDestroy } from '@nestjs/common';
import { CronExpressionParser } from 'cron-parser';
import { RecurringScheduleTask } from '@dailyuse/domain-core';
import { ScheduleContracts } from '@dailyuse/contracts';

// 修改使用方式
private calculateNextRunTime(task: RecurringScheduleTask): Date | null {
  if (task.triggerType === ScheduleContracts.TriggerType.CRON) {
    if (!task.cronExpression) {
      return null;
    }

    try {
      const interval = CronExpressionParser.parse(task.cronExpression);
      return interval.next().toDate();
    } catch (error) {
      console.error(`❌ 解析 cron 表达式失败: ${task.cronExpression}`, error);
      return null;
    }
  }
  // ...
}
```

**文件修改**：
- ✅ `packages/domain-server/src/schedule/services/SchedulerService.ts`

**额外修复**：
同时修复了 TypeScript 类型导入问题（`verbatimModuleSyntax` 要求类型使用 `type` 关键字导入）：
```typescript
// ❌ 错误
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

// ✅ 正确
import { Injectable, type OnModuleInit, type OnModuleDestroy } from '@nestjs/common';
```

### 修复 3: 导出 ScheduleTask

**问题原因**：
- `apps/api/src/modules/schedule/domain/services/ScheduleDomainService.ts` 导入了 `ScheduleTask`
- 但 `packages/domain-server/src/schedule/index.ts` 中该导出被注释掉了

**解决方案**：
在 `packages/domain-server/src/schedule/index.ts` 中取消注释并导出：

```typescript
// Schedule aggregates
export * from './aggregates/ScheduleTask';

// Schedule repositories
export * from './repositories/IScheduleTaskRepository';
export * from './repositories';

// Schedule services
export * from './services';
```

**文件修改**：
- ✅ `packages/domain-server/src/schedule/index.ts`

### 修复 4: 添加 SortOrder 枚举

**问题原因**：
- `packages/contracts/src/modules/notification/types.ts` 从 `./enums` 导入 `SortOrder`
- 但 `notification/enums.ts` 中没有定义该枚举
- `SortOrder` 在其他模块（reminder, goal）中重复定义

**解决方案**：
在 `packages/contracts/src/modules/notification/enums.ts` 中添加 `SortOrder` 枚举：

```typescript
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}
```

**文件修改**：
- ✅ `packages/contracts/src/modules/notification/enums.ts`

## ✅ 验证结果

### cron-parser 测试
创建测试文件 `test-cron-parser-fix.mjs` 验证所有功能：

```
✅ Test 1: 基本 cron 表达式解析 (*/5 * * * *)
✅ Test 2: 每1分钟执行 (* * * * *)
✅ Test 3: 预定义表达式 (@hourly)
✅ Test 4: 带时区选项 (Asia/Shanghai)
✅ Test 5: 获取接下来3次执行时间

🎉 所有测试通过！
```

### 编译检查
```bash
# 无编译错误
✅ packages/domain-server/src/schedule/services/SchedulerService.ts
✅ packages/domain-client/src/schedule/aggregates/ScheduleTask.ts
✅ packages/domain-server/src/schedule/index.ts
✅ apps/api/src/modules/schedule/domain/services/ScheduleDomainService.ts
✅ packages/contracts/src/modules/notification/enums.ts
✅ packages/contracts/src/modules/notification/types.ts
```

## 📦 受影响的文件

| 文件 | 状态 | 修改内容 |
|------|------|---------|
| `packages/domain-core/src/schedule/aggregates/index.ts` | ✅ 已修复 | 添加 ScheduleTaskCore 别名导出 |
| `packages/domain-server/src/schedule/services/SchedulerService.ts` | ✅ 已修复 | 更新 cron-parser API + 类型导入 |
| `packages/domain-server/src/schedule/index.ts` | ✅ 已修复 | 导出 ScheduleTask 类 |
| `packages/contracts/src/modules/notification/enums.ts` | ✅ 已修复 | 添加 SortOrder 枚举 |
| `packages/domain-client/src/schedule/aggregates/ScheduleTask.ts` | ✅ 无错误 | 无需修改 |
| `apps/api/src/modules/schedule/domain/services/ScheduleDomainService.ts` | ✅ 无错误 | 无需修改 |
| `packages/contracts/src/modules/notification/types.ts` | ✅ 无错误 | 无需修改 |

## 🚀 下一步

现在可以正常启动服务了：

```bash
# 启动 API 服务
pnpm --filter @dailyuse/api dev

# 启动 Web 服务
pnpm --filter @dailyuse/web dev
```

## 📚 参考资料

- [cron-parser npm 文档](https://www.npmjs.com/package/cron-parser)
- [cron-parser API 文档](https://harrisiirak.github.io/cron-parser/)
- TypeScript `verbatimModuleSyntax` 配置

---

**修复完成时间**: 2025-10-07  
**修复人**: AI Assistant  
**验证状态**: ✅ 通过
