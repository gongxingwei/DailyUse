# Goal Module - Domain Server Layer

## 项目结构

```
goal/
├── aggregates/         # 聚合根
│   ├── Goal.ts
│   ├── GoalFolder.ts
│   └── GoalStatistics.ts
├── entities/          # 实体
│   ├── KeyResult.ts
│   ├── GoalRecord.ts
│   └── GoalReview.ts
├── value-objects/     # 值对象
│   ├── GoalMetadata.ts          ✅ 已创建（需修正）
│   ├── GoalTimeRange.ts         ✅ 已创建（需修正）
│   ├── KeyResultProgress.ts
│   ├── KeyResultSnapshot.ts
│   ├── GoalReminderConfig.ts
│   └── index.ts                  ✅ 已创建
├── repositories/      # 仓储接口
│   ├── IGoalRepository.ts
│   ├── IGoalFolderRepository.ts
│   └── IGoalStatisticsRepository.ts
├── services/          # 领域服务
│   ├── GoalDomainService.ts
│   ├── GoalFolderDomainService.ts
│   └── GoalStatisticsDomainService.ts
├── infrastructure/    # 基础设施层
│   ├── prisma/
│   │   ├── PrismaGoalRepository.ts
│   │   ├── PrismaGoalFolderRepository.ts
│   │   ├── PrismaGoalStatisticsRepository.ts
│   │   └── mappers/
│   │       ├── GoalMapper.ts
│   │       ├── GoalFolderMapper.ts
│   │       └── GoalStatisticsMapper.ts
│   ├── index.ts
│   └── README.md
└── index.ts                      ✅ 已创建

```

## 已完成

1. ✅ 创建了目录结构
2. ✅ 创建了 GoalMetadata 值对象（需要根据 contracts 修正）
3. ✅ 创建了 GoalTimeRange 值对象（需要根据 contracts 修正）
4. ✅ 创建了主导出文件 index.ts
5. ✅ 创建了值对象导出文件 value-objects/index.ts

## 待实现（参考 repository 模块）

### 1. 值对象 (Value Objects)

- [ ] KeyResultProgress - 关键成果进度
- [ ] KeyResultSnapshot - 关键成果快照
- [ ] GoalReminderConfig - 目标提醒配置
- [ ] 修正 GoalMetadata 以匹配 contracts
- [ ] 修正 GoalTimeRange 以匹配 contracts

### 2. 实体 (Entities)

- [ ] KeyResult - 关键成果实体
- [ ] GoalRecord - 目标记录实体
- [ ] GoalReview - 目标复盘实体

### 3. 聚合根 (Aggregates)

- [ ] Goal - 目标聚合根（主要）
- [ ] GoalFolder - 目标文件夹聚合根
- [ ] GoalStatistics - 目标统计聚合根

### 4. 仓储接口 (Repositories)

- [ ] IGoalRepository
- [ ] IGoalFolderRepository
- [ ] IGoalStatisticsRepository

### 5. 领域服务 (Domain Services)

- [ ] GoalDomainService
- [ ] GoalFolderDomainService
- [ ] GoalStatisticsDomainService

### 6. 基础设施层 (Infrastructure)

- [ ] PrismaGoalRepository
- [ ] PrismaGoalFolderRepository
- [ ] PrismaGoalStatisticsRepository
- [ ] GoalMapper
- [ ] GoalFolderMapper
- [ ] GoalStatisticsMapper

## 实现参考

请严格参考 `packages/domain-server/src/repository` 模块的实现方式：

### 聚合根实现要点

```typescript
export class Goal extends AggregateRoot implements IGoalServer {
  // 1. 私有字段
  private _accountUuid: string;
  private _title: string;
  // ... 其他字段

  // 2. 子实体集合
  private _keyResults: KeyResult[];
  private _reviews: GoalReview[];

  // 3. 构造函数（私有）
  private constructor(params) {}

  // 4. Getter 属性
  public get uuid(): string {
    return this._uuid;
  }
  // ... 其他 getters

  // 5. 工厂方法
  public static create(params): Goal {}

  // 6. 子实体管理方法
  public addKeyResult(keyResult: KeyResult): void {}
  public removeKeyResult(uuid: string): KeyResult | null {}

  // 7. 业务方法
  public complete(): void {}
  public archive(): void {}
  public updateProgress(): void {}

  // 8. 转换方法
  public toServerDTO(includeChildren = false): GoalServerDTO {}
  public toPersistenceDTO(): GoalPersistenceDTO {}
  public static fromServerDTO(dto): Goal {}
  public static fromPersistenceDTO(dto): Goal {}
}
```

### 实体实现要点

```typescript
export class KeyResult extends Entity implements IKeyResultServer {
  // 类似聚合根，但继承 Entity
  // 包含子实体 GoalRecord
}
```

### 值对象实现要点

```typescript
export class KeyResultProgress extends ValueObject {
  // 不可变
  // 实现 equals() 方法
  // 实现 with() 方法创建新实例
  // 业务逻辑方法
  // DTO 转换方法
}
```

### 仓储接口要点

```typescript
export interface IGoalRepository {
  save(goal: Goal): Promise<void>;
  findById(uuid: string, options?): Promise<Goal | null>;
  findByAccountUuid(accountUuid: string): Promise<Goal[]>;
  delete(uuid: string): Promise<void>;
  exists(uuid: string): Promise<boolean>;
}
```

### 领域服务要点

```typescript
export class GoalDomainService {
  constructor(
    private readonly goalRepo: IGoalRepository,
    // ... 其他依赖
  ) {}

  public async createGoal(params): Promise<Goal> {
    // 1. 验证
    // 2. 创建聚合根
    // 3. 持久化
    // 4. 触发领域事件
    return goal;
  }

  // ... 其他协调方法
}
```

## contracts 类型映射

### Goal 聚合根

- GoalServerDTO → Goal 聚合根
- GoalPersistenceDTO → 数据库映射

### KeyResult 实体

- KeyResultServerDTO → KeyResult 实体
- KeyResultPersistenceDTO → 数据库映射

### 值对象

- GoalMetadataServerDTO → GoalMetadata 值对象
- GoalTimeRangeServerDTO → GoalTimeRange 值对象
- KeyResultProgressServerDTO → KeyResultProgress 值对象
- KeyResultSnapshotServerDTO → KeyResultSnapshot 值对象
- GoalReminderConfigServerDTO → GoalReminderConfig 值对象

## 注意事项

1. **严格遵循 DDD 模式**
   - 聚合根是事务边界
   - 通过聚合根访问子实体
   - 值对象不可变

2. **类型安全**
   - 使用 GoalContracts 命名空间
   - 从 contracts 导入类型定义
   - 实现所有接口方法

3. **测试覆盖**
   - 为聚合根编写单元测试
   - 为值对象编写测试
   - 为领域服务编写集成测试

4. **事件驱动**
   - 在聚合根中发布领域事件
   - 使用 addDomainEvent() 方法
   - 事件包含完整上下文

## 下一步

1. 修正现有的值对象以匹配 contracts 定义
2. 创建剩余的值对象
3. 创建实体
4. 创建聚合根
5. 创建仓储接口
6. 创建领域服务
7. 实现基础设施层（Prisma）
8. 编写测试

## 参考文件

- `packages/domain-server/src/repository/aggregates/Repository.ts`
- `packages/domain-server/src/repository/entities/Resource.ts`
- `packages/domain-server/src/repository/value-objects/RepositoryConfig.ts`
- `packages/domain-server/src/repository/repositories/IRepositoryRepository.ts`
- `packages/domain-server/src/repository/services/RepositoryDomainService.ts`
- `packages/domain-server/src/repository/infrastructure/prisma/PrismaRepositoryRepository.ts`
