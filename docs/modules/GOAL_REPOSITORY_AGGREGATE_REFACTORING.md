# Goal 模块仓储按聚合根重构

## 概述
将 Goal 模块的仓储接口和实现按照 DDD 聚合根划分，实现职责分离和更清晰的领域边界。

## 架构变更

### 原架构（Before）
```
packages/domain-server/src/goal/repositories/
  └── iGoalRepository.ts  # 包含 Goal + GoalDir 所有方法

apps/api/src/modules/goal/infrastructure/repositories/
  └── prismaGoalRepository.ts  # 654行，包含所有实现
```

### 新架构（After）
```
packages/domain-server/src/goal/repositories/
  ├── iGoalRepository.ts              # 保留，兼容性接口
  ├── IGoalAggregateRepository.ts     # Goal 聚合根接口
  └── IGoalDirRepository.ts           # GoalDir 聚合根接口

apps/api/src/modules/goal/infrastructure/repositories/
  ├── prismaGoalRepository.ts         # 适配器，委托给下面两个实现
  ├── PrismaGoalAggregateRepository.ts  # Goal 聚合根实现
  ├── PrismaGoalDirRepository.ts       # GoalDir 聚合根实现
  └── PrismaGoalRepository.old.ts     # 备份的原文件
```

## 文件说明

### 1. Domain-Server 仓储接口

#### IGoalAggregateRepository.ts
**职责**: Goal 聚合根仓储接口

**包含方法**:
- `saveGoal`: 保存 Goal 及所有子实体（KeyResult, Record, Review）
- `getGoalByUuid`: 获取完整的 Goal 聚合
- `getAllGoals`: 分页查询 Goal 列表
- `getGoalsByDirectoryUuid`: 按目录查询
- `getGoalsByStatus`: 按状态查询
- `deleteGoal`: 删除 Goal 聚合（级联删除子实体）
- `batchUpdateGoalStatus`: 批量更新状态
- `getGoalStats`: 统计数据
- `getProgressTrend`: 进度趋势
- `getUpcomingDeadlines`: 即将到期的 Goal
- `validateGoalAggregateRules`: 业务规则验证
- `updateGoalVersion`: 版本控制（乐观锁）
- `getGoalAggregateHistory`: 变更历史

#### IGoalDirRepository.ts
**职责**: GoalDir 聚合根仓储接口

**包含方法**:
- `saveGoalDirectory`: 保存 GoalDir
- `getGoalDirectoryByUuid`: 获取单个 GoalDir
- `getAllGoalDirectories`: 分页查询 GoalDir 列表
- `getGoalDirectoryTree`: 获取目录树结构
- `deleteGoalDirectory`: 删除 GoalDir

### 2. API 仓储实现

#### PrismaGoalAggregateRepository.ts
**职责**: Goal 聚合根的 Prisma 实现

**核心功能**:
1. 数据映射
   - `mapGoalToEntity`: Prisma 数据 → Goal 实体
   - 处理所有子实体（KeyResult, Record, Review）

2. 聚合根持久化
   - 使用事务保存 Goal 及所有子实体
   - 保证聚合一致性

3. 聚合根加载
   - 包含所有 `include` 关系
   - 一次加载完整聚合

#### PrismaGoalDirRepository.ts
**职责**: GoalDir 聚合根的 Prisma 实现

**核心功能**:
1. 数据映射
   - `mapGoalDirToEntity`: Prisma 数据 → GoalDir 实体

2. GoalDir CRUD
   - 简单的单表操作
   - 无子实体关联

#### prismaGoalRepository.ts（适配器）
**职责**: 兼容旧的 `IGoalRepository` 接口

**实现方式**: 委托模式 (Delegation Pattern)
```typescript
export class PrismaGoalRepository implements IGoalRepository {
  private goalAggregateRepo: PrismaGoalAggregateRepository;
  private goalDirRepo: PrismaGoalDirRepository;

  async saveGoal(accountUuid: string, goal: Goal): Promise<Goal> {
    return this.goalAggregateRepo.saveGoal(accountUuid, goal);
  }

  async saveGoalDirectory(accountUuid: string, goalDir: GoalDir): Promise<GoalDir> {
    return this.goalDirRepo.saveGoalDirectory(accountUuid, goalDir);
  }
  
  // ... 其他方法类似委托
}
```

## DDD 聚合根模式对比

### Goal 聚合根
```
Goal (Aggregate Root)
  ├── KeyResult[] (Entities)
  ├── GoalRecord[] (Entities)
  └── GoalReview[] (Entities)
```

**特点**:
- 包含多个子实体
- 事务边界：所有子实体与 Goal 一起保存
- 业务规则验证：在聚合根层面验证

### GoalDir 聚合根
```
GoalDir (Aggregate Root)
  (无子实体)
```

**特点**:
- 独立聚合根
- 简单的单表操作
- 可能包含层级关系（parentUuid）

## 使用示例

### Goal 聚合根操作
```typescript
// 创建仓储实例
const goalRepo = new PrismaGoalAggregateRepository(prisma);

// 加载完整聚合
const goal = await goalRepo.getGoalByUuid(accountUuid, goalUuid);

// goal 包含所有子实体
goal.keyResults  // KeyResult[]
goal.records     // GoalRecord[]
goal.reviews     // GoalReview[]

// 修改聚合
goal.addKeyResult(...);
goal.updateProgress(...);

// 保存整个聚合（事务）
await goalRepo.saveGoal(accountUuid, goal);
```

### GoalDir 操作
```typescript
const goalDirRepo = new PrismaGoalDirRepository(prisma);

// 简单的 CRUD
const dir = await goalDirRepo.getGoalDirectoryByUuid(accountUuid, dirUuid);
await goalDirRepo.saveGoalDirectory(accountUuid, dir);
```

### 兼容性使用（通过适配器）
```typescript
// 旧代码仍然可以工作
const repo = new PrismaGoalRepository(prisma);
await repo.saveGoal(accountUuid, goal);
await repo.saveGoalDirectory(accountUuid, dir);
```

## 导出配置

### packages/domain-server/src/goal/index.ts
```typescript
// 实体导出
export { Goal } from './aggregates/Goal';
export { GoalDir } from './aggregates/GoalDir';
export { KeyResult } from './entities/KeyResult';
export { GoalRecord } from './entities/GoalRecord';
export { GoalReview } from './entities/GoalReview';

// 仓储接口导出
export type { IGoalRepository } from './repositories/iGoalRepository';
export type { IGoalAggregateRepository } from './repositories/IGoalAggregateRepository';
export type { IGoalDirRepository } from './repositories/IGoalDirRepository';
```

## 优势

### 1. 清晰的边界
- 每个聚合根有独立的仓储实现
- 职责单一，易于维护

### 2. 事务一致性
- Goal 聚合根的所有子实体在一个事务中保存
- 保证聚合一致性

### 3. 可扩展性
- 新增聚合根时，只需创建新的仓储
- 不影响现有代码

### 4. 测试友好
- 可以单独测试每个聚合根的仓储
- Mock 更简单

### 5. 向后兼容
- 通过适配器保持旧接口可用
- 逐步迁移，无破坏性变更

## 迁移建议

### 阶段1: 现状（已完成）
- ✅ 创建新的接口文件
- ✅ 创建新的实现文件
- ✅ 保留旧文件作为适配器

### 阶段2: 逐步迁移
1. 在新代码中直接使用 `PrismaGoalAggregateRepository`
2. 在新代码中直接使用 `PrismaGoalDirRepository`
3. 旧代码继续使用 `PrismaGoalRepository` 适配器

### 阶段3: 完全迁移（可选）
1. 修改所有使用 `IGoalRepository` 的地方
2. 分别注入 `IGoalAggregateRepository` 和 `IGoalDirRepository`
3. 删除适配器文件

## 参考 Reminder 模块

Reminder 模块已完成类似的重构：
- `PrismaReminderAggregateRepository`: ReminderTemplate 聚合根
- Instance 作为 Template 的子实体管理

可参考文档: `docs/modules/REMINDER_INSTANCE_AGGREGATE_REFACTORING.md`

## 文件清单

### 新增文件
- `packages/domain-server/src/goal/repositories/IGoalAggregateRepository.ts`
- `packages/domain-server/src/goal/repositories/IGoalDirRepository.ts`
- `apps/api/src/modules/goal/infrastructure/repositories/PrismaGoalAggregateRepository.ts`
- `apps/api/src/modules/goal/infrastructure/repositories/PrismaGoalDirRepository.ts`

### 修改文件
- `packages/domain-server/src/goal/index.ts` (添加导出)
- `apps/api/src/modules/goal/infrastructure/repositories/prismaGoalRepository.ts` (改为适配器)

### 备份文件
- `apps/api/src/modules/goal/infrastructure/repositories/PrismaGoalRepository.old.ts`

## 注意事项

1. **构建错误**: 如果遇到导入错误，需要重新构建 domain-server 包：
   ```bash
   pnpm nx build domain-server
   ```

2. **类型检查**: 新的接口分离可能导致部分代码需要调整导入

3. **测试覆盖**: 确保两个新仓储都有单元测试

4. **性能**: 适配器模式会有轻微的性能开销（一次额外的函数调用）
