# Goal Domain-Server 包实现指南

## 概述

本文档描述了 goal 模块的 domain-server 包的创建进度和实现计划。这个包严格参考 `repository` 模块的实现模式，遵循 DDD（领域驱动设计）原则。

## 已完成的工作

### 1. 目录结构 ✅
```
packages/domain-server/src/goal/
├── aggregates/         # 聚合根（待实现）
├── entities/           # 实体（待实现）
├── value-objects/      # 值对象（部分完成）
├── repositories/       # 仓储接口 ✅
├── services/           # 领域服务（待实现）
├── infrastructure/     # 基础设施层（待实现）
├── index.ts            ✅
└── README.md           ✅
```

### 2. 值对象 (部分完成)
- ✅ `GoalMetadata.ts` - 已创建，需要根据最新 contracts 修正
- ✅ `GoalTimeRange.ts` - 已创建，需要根据最新 contracts 修正
- ⏳ `KeyResultProgress.ts` - 待创建
- ⏳ `KeyResultSnapshot.ts` - 待创建
- ⏳ `GoalReminderConfig.ts` - 待创建

### 3. 仓储接口 ✅
- ✅ `IGoalRepository.ts` - 完成
- ✅ `IGoalFolderRepository.ts` - 完成
- ✅ `IGoalStatisticsRepository.ts` - 完成

### 4. 导出文件 ✅
- ✅ `index.ts` - 主导出文件
- ✅ `value-objects/index.ts` - 值对象导出
- ✅ `infrastructure/index.ts` - 基础设施层导出占位符

## 待实现的核心组件

### 优先级 1: 值对象（完成剩余部分）

#### KeyResultProgress.ts
```typescript
import { ValueObject } from '@dailyuse/utils';
import type { GoalContracts } from '@dailyuse/contracts';

export class KeyResultProgress extends ValueObject {
  public readonly valueType: GoalContracts.KeyResultValueType;
  public readonly aggregationMethod: GoalContracts.AggregationMethod;
  public readonly targetValue: number;
  public readonly currentValue: number;
  public readonly unit: string | null;
  
  // 业务方法
  public calculatePercentage(): number { }
  public isCompleted(): boolean { }
  public updateProgress(newValue: number): KeyResultProgress { }
  public recalculateFromRecords(recordValues: number[]): number { }
}
```

#### KeyResultSnapshot.ts
```typescript
export class KeyResultSnapshot extends ValueObject {
  public readonly keyResultUuid: string;
  public readonly title: string;
  public readonly targetValue: number;
  public readonly currentValue: number;
  public readonly progressPercentage: number;
}
```

#### GoalReminderConfig.ts
```typescript
export class GoalReminderConfig extends ValueObject {
  // 根据 contracts 定义实现
}
```

### 优先级 2: 实体

#### KeyResult.ts (Entity)
这是一个重要的实体，包含 GoalRecord 子实体。

```typescript
import { Entity } from '@dailyuse/utils';
import type { GoalContracts } from '@dailyuse/contracts';
import { KeyResultProgress } from '../value-objects/KeyResultProgress';
import { GoalRecord } from './GoalRecord';

export class KeyResult extends Entity implements GoalContracts.KeyResultServer {
  private _goalUuid: string;
  private _title: string;
  private _description: string | null;
  private _progress: KeyResultProgress;
  private _order: number;
  private _createdAt: number;
  private _updatedAt: number;
  private _records: GoalRecord[];
  
  // 子实体管理
  public addRecord(record: GoalRecord): void { }
  public getRecords(): GoalRecord[] { }
  
  // 业务方法
  public updateProgress(newValue: number, note?: string): GoalRecord { }
  public recalculateProgress(): void { }
  public isCompleted(): boolean { }
}
```

#### GoalRecord.ts (Entity)
```typescript
export class GoalRecord extends Entity implements GoalContracts.GoalRecordServer {
  private _keyResultUuid: string;
  private _goalUuid: string;
  private _previousValue: number;
  private _newValue: number;
  private _changeAmount: number;
  private _note: string | null;
  private _recordedAt: number;
  
  public getChangePercentage(): number { }
  public isPositiveChange(): boolean { }
}
```

#### GoalReview.ts (Entity)
```typescript
export class GoalReview extends Entity implements GoalContracts.GoalReviewServer {
  private _goalUuid: string;
  private _type: GoalContracts.ReviewType;
  private _rating: number;
  private _summary: string;
  private _achievements: string | null;
  private _challenges: string | null;
  private _improvements: string | null;
  private _keyResultSnapshots: KeyResultSnapshot[];
  private _reviewedAt: number;
  
  public isHighQuality(): boolean { }
}
```

### 优先级 3: 聚合根

#### Goal.ts (Aggregate Root) - 最核心
这是整个 goal 模块的核心聚合根，管理所有子实体。

```typescript
import { AggregateRoot } from '@dailyuse/utils';
import type { GoalContracts } from '@dailyuse/contracts';
import { GoalMetadata } from '../value-objects/GoalMetadata';
import { GoalTimeRange } from '../value-objects/GoalTimeRange';
import { KeyResult } from '../entities/KeyResult';
import { GoalReview } from '../entities/GoalReview';

export class Goal extends AggregateRoot implements GoalContracts.GoalServer {
  // 私有字段
  private _accountUuid: string;
  private _title: string;
  private _description: string | null;
  private _status: GoalContracts.GoalStatus;
  private _metadata: GoalMetadata;
  private _timeRange: GoalTimeRange;
  private _folderUuid: string | null;
  private _parentGoalUuid: string | null;
  private _sortOrder: number;
  private _reminderConfig: GoalReminderConfig | null;
  private _createdAt: number;
  private _updatedAt: number;
  
  // 子实体集合
  private _keyResults: KeyResult[];
  private _reviews: GoalReview[];
  
  // 工厂方法
  public static create(params): Goal { }
  
  // 子实体管理
  public addKeyResult(keyResult: KeyResult): void { }
  public removeKeyResult(uuid: string): KeyResult | null { }
  public addReview(review: GoalReview): void { }
  
  // 业务方法
  public complete(): void { }
  public archive(): void { }
  public activate(): void { }
  public updateProgress(): void { }
  public calculateProgress(): number { }
  
  // 转换方法
  public toServerDTO(includeChildren = false): GoalContracts.GoalServerDTO { }
  public toPersistenceDTO(): GoalContracts.GoalPersistenceDTO { }
  public static fromServerDTO(dto): Goal { }
  public static fromPersistenceDTO(dto): Goal { }
}
```

#### GoalFolder.ts (Aggregate Root)
```typescript
export class GoalFolder extends AggregateRoot implements GoalContracts.GoalFolderServer {
  private _accountUuid: string;
  private _name: string;
  private _description: string | null;
  private _type: GoalContracts.FolderType;
  private _icon: string | null;
  private _color: string | null;
  private _order: number;
  private _goalCount: number;
  
  public updateStats(): void { }
  public incrementGoalCount(): void { }
  public decrementGoalCount(): void { }
}
```

#### GoalStatistics.ts (Aggregate Root)
```typescript
export class GoalStatistics extends AggregateRoot implements GoalContracts.GoalStatisticsServer {
  private _accountUuid: string;
  private _totalGoals: number;
  private _activeGoals: number;
  private _completedGoals: number;
  private _archivedGoals: number;
  // ... 更多统计字段
  
  public recalculate(goals: Goal[]): void { }
  public getCompletionRate(): number { }
  public getTrendData(): GoalContracts.TrendType { }
}
```

### 优先级 4: 领域服务

#### GoalDomainService.ts
这是协调聚合根操作的主要服务。

```typescript
export class GoalDomainService {
  constructor(
    private readonly goalRepo: IGoalRepository,
    private readonly folderRepo: IGoalFolderRepository,
    private readonly statisticsRepo: IGoalStatisticsRepository,
  ) {}
  
  public async createGoal(params): Promise<Goal> {
    // 1. 验证
    // 2. 创建聚合根
    // 3. 持久化
    // 4. 更新统计
    // 5. 触发领域事件
  }
  
  public async completeGoal(uuid: string): Promise<Goal> {
    // 1. 加载聚合根
    // 2. 执行业务逻辑
    // 3. 持久化
    // 4. 更新统计
    // 5. 触发领域事件
  }
  
  public async addKeyResult(goalUuid: string, params): Promise<KeyResult> {
    // 通过聚合根添加子实体
  }
  
  public async updateKeyResultProgress(
    goalUuid: string,
    keyResultUuid: string,
    newValue: number,
    note?: string
  ): Promise<void> {
    // 通过聚合根更新子实体
  }
  
  public async createReview(goalUuid: string, params): Promise<GoalReview> {
    // 通过聚合根添加复盘
  }
}
```

#### GoalFolderDomainService.ts
```typescript
export class GoalFolderDomainService {
  constructor(
    private readonly folderRepo: IGoalFolderRepository,
    private readonly goalRepo: IGoalRepository,
  ) {}
  
  public async createFolder(params): Promise<GoalFolder> { }
  public async moveGoalsToFolder(goalUuids: string[], folderUuid: string): Promise<void> { }
  public async deleteFolder(uuid: string, moveGoalsTo?: string): Promise<void> { }
}
```

#### GoalStatisticsDomainService.ts
```typescript
export class GoalStatisticsDomainService {
  constructor(
    private readonly statisticsRepo: IGoalStatisticsRepository,
    private readonly goalRepo: IGoalRepository,
  ) {}
  
  public async recalculateStatistics(accountUuid: string): Promise<GoalStatistics> { }
  public async getStatistics(accountUuid: string): Promise<GoalStatistics> { }
}
```

### 优先级 5: 基础设施层

#### PrismaGoalRepository.ts
```typescript
import { PrismaClient } from '@prisma/client';
import type { IGoalRepository } from '../../repositories/IGoalRepository';
import { Goal } from '../../aggregates/Goal';
import { GoalMapper } from './mappers/GoalMapper';

export class PrismaGoalRepository implements IGoalRepository {
  constructor(private readonly prisma: PrismaClient) {}
  
  public async save(goal: Goal): Promise<void> {
    const persistenceDTO = goal.toPersistenceDTO();
    // 使用 prisma 保存
    // 级联保存子实体
  }
  
  public async findById(uuid: string, options?): Promise<Goal | null> {
    // 使用 prisma 查询
    // 使用 GoalMapper 转换
    // 可选加载子实体
  }
  
  // ... 实现其他方法
}
```

#### GoalMapper.ts
```typescript
import type { Goal } from '@prisma/client';
import { Goal as GoalAggregate } from '../../../aggregates/Goal';

export type PrismaGoal = Goal;
export type PrismaGoalWithRelations = Goal & {
  keyResults: any[];
  reviews: any[];
};

export class GoalMapper {
  public static toDomain(prismaGoal: PrismaGoalWithRelations): GoalAggregate {
    // 从 Prisma 模型转换为领域模型
  }
  
  public static toPersistence(goal: GoalAggregate): any {
    // 从领域模型转换为 Prisma 模型
  }
}
```

## 实现顺序建议

1. **第一阶段：基础值对象和实体**
   - 完成所有值对象
   - 实现 GoalRecord 实体（最简单）
   - 实现 GoalReview 实体
   - 实现 KeyResult 实体（包含 GoalRecord）

2. **第二阶段：聚合根**
   - 实现 Goal 聚合根（核心，包含 KeyResult 和 GoalReview）
   - 实现 GoalFolder 聚合根
   - 实现 GoalStatistics 聚合根

3. **第三阶段：领域服务**
   - 实现 GoalDomainService
   - 实现 GoalFolderDomainService
   - 实现 GoalStatisticsDomainService

4. **第四阶段：基础设施层**
   - 实现 PrismaGoalRepository
   - 实现 GoalMapper
   - 实现 PrismaGoalFolderRepository
   - 实现 GoalStatisticsRepository

5. **第五阶段：测试**
   - 单元测试（聚合根、实体、值对象）
   - 集成测试（领域服务）
   - 仓储测试

## contracts 依赖

所有实现都依赖于 `@dailyuse/contracts` 包中的类型定义：

```typescript
import type { GoalContracts } from '@dailyuse/contracts';

// 使用
type GoalStatus = GoalContracts.GoalStatus;
type GoalServerDTO = GoalContracts.GoalServerDTO;
type GoalPersistenceDTO = GoalContracts.GoalPersistenceDTO;
```

确保 contracts 包已经正确定义了所有必要的接口和 DTO。

## 参考资源

### Repository 模块文件
- `packages/domain-server/src/repository/aggregates/Repository.ts`
- `packages/domain-server/src/repository/entities/Resource.ts`
- `packages/domain-server/src/repository/value-objects/RepositoryConfig.ts`
- `packages/domain-server/src/repository/services/RepositoryDomainService.ts`
- `packages/domain-server/src/repository/infrastructure/prisma/PrismaRepositoryRepository.ts`

### Utils 包
- `@dailyuse/utils` 提供了 `AggregateRoot`、`Entity`、`ValueObject` 基类

### Contracts 包
- `@dailyuse/contracts` 的 `GoalContracts` 命名空间

## 注意事项

1. **严格遵循 DDD 原则**
   - 聚合根是事务边界
   - 通过聚合根访问子实体
   - 值对象不可变
   - 使用领域事件

2. **类型安全**
   - 使用 TypeScript 严格模式
   - 实现所有 contracts 定义的接口
   - 正确处理 null/undefined

3. **测试驱动**
   - 为每个组件编写测试
   - 确保业务逻辑正确
   - 使用测试覆盖率工具

4. **文档完整**
   - 为复杂逻辑添加注释
   - 保持 README 更新
   - 记录重要决策

## 当前状态总结

- ✅ 目录结构已创建
- ✅ 仓储接口已完成
- ⚠️ 值对象部分完成（需要修正和补全）
- ⏳ 实体待实现
- ⏳ 聚合根待实现
- ⏳ 领域服务待实现
- ⏳ 基础设施层待实现

## 下一步行动

1. 修正 `GoalMetadata.ts` 和 `GoalTimeRange.ts` 以匹配最新的 contracts 定义
2. 创建剩余的值对象
3. 按照实现顺序建议逐步完成各组件

---

**创建日期**: 2025-10-14
**参考模块**: packages/domain-server/src/repository
**负责人**: Development Team
