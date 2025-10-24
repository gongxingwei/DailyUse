# Schedule 模块 Typecheck 修复状态

**日期**: 2025-01-12  
**当前状态**: 进行中 (44 errors remaining)

## ✅ 已完成

### 1. Contracts 层 (100%)

- ✅ 所有枚举值修复为 lowercase (e.g., `ACTIVE = 'active'`)
- ✅ ScheduleStatisticsServerDTO/PersistenceDTO 定义对齐
- ✅ Typecheck 通过 (0 errors)

### 2. ScheduleStatistics.ts (100%)

- ✅ 修复类型导入 (`SourceModule`, `ExecutionStatus` 从 contracts 导入)
- ✅ 修复 `toDTO()` → `toServerDTO()`，返回正确的 ServerDTO
- ✅ 修复 `toPersistenceDTO()`，使用 snake_case 字段，JSON.stringify moduleStats
- ✅ 修复 `fromDTO()` 和 `fromPersistenceDTO()`
- ✅ 0 type errors

## ⚠️ 发现的架构问题

### 问题：ScheduleTask 使用本地类型定义而不是 Contracts 枚举

**Location**: `packages/domain-server/src/schedule/aggregates/ScheduleTask.ts:18-20`

```typescript
// ❌ 当前（错误）：
type ScheduleTaskStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
type SourceModule = 'reminder' | 'task' | 'goal' | 'notification' | 'system' | 'custom';
type ExecutionStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'TIMEOUT' | 'RETRYING';

// ✅ 应该：
import { ScheduleTaskStatus, SourceModule, ExecutionStatus } from '@dailyuse/contracts';
```

**影响**:

- ScheduleTask 内部的类型与 Contracts 中的枚举不兼容
- 导致 ScheduleStatistics 和 ScheduleDomainService 中的类型转换错误
- 字符串字面量值不匹配：
  - Contracts: `ScheduleTaskStatus.ACTIVE = 'active'` (lowercase)
  - ScheduleTask: `'ACTIVE'` (uppercase)

**解决方案**:

1. **短期**: 在 ScheduleDomainService 中使用大写字面量 (`'ACTIVE'`, `'PAUSED'`)
2. **长期**: 重构 ScheduleTask.ts 使用 Contracts 枚举

## 🚧 进行中

### ScheduleDomainService.ts (20/31 errors fixed)

**已修复**:

- ✅ Import 修复: `import type { ScheduleTask }` → `import { ScheduleTask }`
- ✅ 导入枚举: `ScheduleTaskStatus`, `ExecutionStatus`, `SourceModule`
- ✅ 导入值对象: `ScheduleConfig`, `RetryPolicy`, `TaskMetadata`
- ✅ `task.isEnabled` → `task.enabled`
- ✅ `'failed'` → `ExecutionStatus.FAILED`
- ✅ 创建任务时 DTO → 值对象转换

**剩余错误 (11个)**:

1. DTO 转换问题 (3个):
   - `ScheduleConfig.fromDTO()` 参数类型不匹配 (startDate: string vs number)
   - `TaskMetadata.create()` 方法不存在
   - BatchCreate 中也有同样问题

2. 字符串字面量比较 (6个):
   - `task.status === 'active'` → `task.status === 'ACTIVE'` (uppercase)
   - `task.status === 'paused'` → `task.status === 'PAUSED'`

3. 方法签名 (2个):
   - `task.complete(reason)` → `task.complete()` (无参数)
   - `task.cancel(reason?)` → `task.cancel(reason)` (必需参数)

4. SourceModule 类型转换 (多处):
   - `task.sourceModule` 是本地类型，传给 `statistics` 方法时需要类型转换

### ScheduleStatisticsDomainService.ts (0/13 errors fixed)

**待修复**:

1. 枚举比较: `'paused'` → `'PAUSED'`
2. SourceModule 类型: 字符串字面量 → 枚举值
3. Null 检查: `executions` 可能为 null

## 📝 后续工作

### 立即任务（让 typecheck 通过）

1. **ScheduleDomainService.ts**:

   ```typescript
   // 修复所有状态比较
   task.status === 'active'  → task.status === 'ACTIVE'
   task.status === 'paused'  → task.status === 'PAUSED'

   // 修复方法调用
   task.complete(reason)     → task.complete()
   task.cancel(reason?)      → task.cancel(reason!)

   // SourceModule 类型转换（临时方案）
   statistics.incrementTaskCount(task.sourceModule as any)
   ```

2. **ScheduleStatisticsDomainService.ts**:

   ```typescript
   // 修复状态比较
   task.status === 'paused' → task.status === 'PAUSED'

   // 添加 null 检查
   if (executions) { ... }

   // 修复 SourceModule 字面量
   ['reminder', 'task', 'goal', 'notification'] as SourceModule[]
   ```

### 长期重构（在 typecheck 通过后）

**优先级 1: 统一类型系统**

1. 重构 `ScheduleTask.ts`:
   - 删除本地类型定义
   - 从 Contracts 导入枚举
   - 更新所有字段类型
   - 测试所有方法

2. 重构 `ScheduleExecution.ts`:
   - 同样问题，也有本地类型定义

**优先级 2: DTO 转换逻辑**

1. 修复值对象的 `fromDTO()` 方法：
   - ScheduleConfig: 处理 startDate 类型转换 (string → number)
   - TaskMetadata: 实现 `create()` 静态工厂方法

2. 完善 DTO 转换测试

**优先级 3: API 层和 Web 层**

1. API 层 (apps/api):
   - Prisma schema 已完成
   - 实现 Repositories
   - 实现 Services
   - 实现 Controllers
   - 实现 Routes

2. Web 层 (apps/web):
   - Vue 组件
   - Pinia stores
   - API clients
   - Pages

## 🔧 修复命令

```bash
# 持续监控错误数量
pnpm nx run domain-server:typecheck 2>&1 | Select-String -Pattern "error TS" | Measure-Object

# 查看特定文件错误
pnpm nx run domain-server:typecheck 2>&1 | Select-String -Pattern "ScheduleDomainService"

# 查看所有 Schedule 相关错误
pnpm nx run domain-server:typecheck 2>&1 | Select-String -Pattern "schedule/"
```

## 💡 经验教训

1. **不要在聚合根中定义本地类型** - 始终使用 Contracts 中的类型
2. **枚举值命名约定** - Contracts 使用 lowercase 值 (`ACTIVE = 'active'`)
3. **DTO vs 值对象** - Domain Service 需要将 DTO 转换为值对象才能创建聚合根
4. **类型导入** - 类需要 `import` 不能 `import type`，接口可以 `import type`

## 📊 进度追踪

```
Total Errors: 56 → 44 (↓ 21%)
├─ Contracts:          0 ✅
├─ ScheduleStatistics: 0 ✅
├─ ScheduleTask:       0 ✅
├─ ScheduleDomainService: 11 ⚠️
└─ ScheduleStatisticsDomainService: 13 ⚠️

Estimated Time Remaining: 1-2 hours
```
