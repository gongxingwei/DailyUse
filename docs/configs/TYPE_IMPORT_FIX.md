# 类型导入修复指南

> 修复 Web 应用中的类型导入错误，统一使用命名空间导入形式

## 问题背景

在打包优化过程中，发现 web 应用中存在大量错误的类型导入方式：

```typescript
// ❌ 错误的导入方式
import { SomeType } from '@dailyuse/contracts/modules/task';
import type * as EditorContracts from '@dailyuse/contracts/modules/editor';
```

这种导入方式有以下问题：
1. `@dailyuse/contracts/modules/*` 子路径导出已被移除
2. TypeScript 编译时找不到模块
3. 与 contracts 包的导出结构不一致

## 正确的导入方式

### 1. 使用命名空间导入类型

```typescript
// ✅ 正确的导入方式
import type { TaskContracts } from '@dailyuse/contracts';

// 使用类型
type TaskTimeType = TaskContracts.TaskTimeType;
type KeyResultLink = TaskContracts.KeyResultLink;
```

### 2. 直接导入导出的枚举

```typescript
// ✅ 直接导入枚举（已在 contracts/index.ts 中导出）
import { TaskTimeType, TaskScheduleMode, ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

// 可以作为值使用
const timeType = TaskTimeType.ALL_DAY;
```

### 3. 导入命名空间（需要既作为类型又作为值）

```typescript
// ✅ 导入命名空间
import { TaskContracts } from '@dailyuse/contracts';

// 作为类型
type TaskTemplate = TaskContracts.TaskTemplateDTO;

// 作为值（访问枚举）
const timeType = TaskContracts.TaskTimeType.SPECIFIC_TIME;
```

## 修复的文件列表

### Editor 模块

| 文件 | 修复内容 |
|------|---------|
| `apps/web/src/modules/editor/infrastructure/api/editorApiClient.ts` | `import type * as EditorContracts from '@dailyuse/contracts/modules/editor'` → `import type { EditorContracts } from '@dailyuse/contracts'` |
| `apps/web/src/modules/editor/presentation/stores/editorSessionStore.ts` | 已使用正确的导入形式 ✅ |

### Task 模块

| 文件 | 修复内容 |
|------|---------|
| `apps/web/src/modules/task/presentation/components/dialogs/TaskTemplateDialog.vue` | 改为直接导入枚举 |
| `apps/web/src/modules/task/presentation/composables/useTaskUtils.ts` | `@dailyuse/contracts/modules/task` → `@dailyuse/contracts` |
| `apps/web/src/modules/task/presentation/components/TaskInstanceManagement.vue` | 使用命名空间导入 `KeyResultLink` |
| `apps/web/src/modules/task/presentation/components/cards/TaskInSummaryCard.vue` | 使用命名空间导入 |
| `apps/web/src/modules/task/presentation/components/cards/TaskTemplateCard.vue` | 使用命名空间导入 |
| `apps/web/src/modules/task/presentation/components/cards/TaskInstanceCard.vue` | 使用命名空间导入 |

### Repository 模块

| 文件 | 修复内容 |
|------|---------|
| `apps/web/src/modules/repository/presentation/composables/useRepository.ts` | `@dailyuse/contracts/modules/repository` → `@dailyuse/contracts` + 命名空间 |

### Schedule 模块

| 文件 | 修复内容 |
|------|---------|
| `apps/web/src/modules/account/presentation/views/TestView.vue` | `@dailyuse/contracts/modules/schedule` → `@dailyuse/contracts` + 命名空间 |

## Contracts 导出结构

### 主入口 (`packages/contracts/src/index.ts`)

```typescript
// 命名空间导出（用于类型）
export * as TaskContracts from './modules/task';
export * as GoalContracts from './modules/goal';
export * as ReminderContracts from './modules/reminder';
export * as EditorContracts from './modules/editor';
export * as RepositoryContracts from './modules/repository';
export * as ScheduleContracts from './modules/schedule';
// ... 其他模块

// 直接导出常用枚举（可作为值使用）
export { TaskTimeType, TaskScheduleMode, TaskTemplateStatus, TaskInstanceStatus } from './modules/task/enums';
export { ImportanceLevel } from './shared/importance';
export { UrgencyLevel } from './shared/urgency';
// ... 其他枚举
```

## 导入决策流程图

```
需要导入类型吗？
    ↓
    是 → 只需要类型定义吗？
         ↓
         是 → import type { ModuleContracts } from '@dailyuse/contracts';
              type MyType = ModuleContracts.SomeDTO;
         ↓
         否 → 需要作为值使用（枚举）吗？
              ↓
              是 → 枚举已直接导出吗？
                   ↓
                   是 → import { EnumName } from '@dailyuse/contracts';
                   ↓
                   否 → import { ModuleContracts } from '@dailyuse/contracts';
                        const value = ModuleContracts.EnumName.VALUE;
```

## 最佳实践

### ✅ 推荐做法

1. **纯类型导入** - 使用 `import type`
   ```typescript
   import type { TaskContracts } from '@dailyuse/contracts';
   ```

2. **枚举导入** - 直接导入已导出的枚举
   ```typescript
   import { TaskTimeType, ImportanceLevel } from '@dailyuse/contracts';
   ```

3. **混合使用** - 同时需要类型和枚举
   ```typescript
   import type { TaskContracts } from '@dailyuse/contracts';
   import { TaskTimeType } from '@dailyuse/contracts';
   ```

### ❌ 避免的做法

1. **子路径导入** - 已废弃
   ```typescript
   // ❌ 不要这样做
   import { SomeType } from '@dailyuse/contracts/modules/task';
   ```

2. **通配符命名空间导入** - TypeScript 不推荐
   ```typescript
   // ❌ 不推荐
   import * as EditorContracts from '@dailyuse/contracts/modules/editor';
   ```

3. **混淆类型和值** - 导致编译错误
   ```typescript
   // ❌ 错误示例
   import type { TaskTimeType } from '@dailyuse/contracts';
   const value = TaskTimeType.ALL_DAY; // 错误：只能用作类型
   ```

## 验证修复

修复后运行以下命令验证：

```bash
# 类型检查
pnpm nx run web:typecheck

# 构建测试
pnpm nx run web:build
```

## 相关文档

- [Contracts 包结构](./BUILD_OPTIMIZATION_GUIDE.md#1-dailyusecontracts)
- [TypeScript 类型导入最佳实践](./TSCONFIG_MONOREPO_BEST_PRACTICES.md)
- [打包优化指南](./BUILD_OPTIMIZATION_GUIDE.md)

---

**更新日期：** 2025-01-13  
**维护者：** DailyUse Team
