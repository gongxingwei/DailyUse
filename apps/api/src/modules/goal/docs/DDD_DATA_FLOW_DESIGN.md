# Goal 模块 DDD 数据流转设计

## 🎯 设计原则

### 1. 聚合根主导原则
- **Goal** 是聚合根，控制所有子实体 (KeyResult、GoalRecord、GoalReview)
- 所有对子实体的操作都必须通过 Goal 聚合根
- 只有聚合根拥有 `accountUuid`，子实体通过聚合根关联

### 2. 数据流转层次
```
Frontend Entity (client) 
    ↕ toDTO/fromDTO
DTO (transport) 
    ↕ toEntity/fromDTO  
Server Entity (domain)
    ↕ toDatabase/fromDatabase
Database Record (persistence)
```

### 3. 数据格式转换规则
- **Date**: Frontend/Server 使用 `Date` 对象，DTO/Database 使用 `timestamp`
- **JSON**: Database 存储 JSON 字符串，Server 解析为对象
- **UUID**: 统一使用 string 格式
- **Enum**: 统一使用字符串枚举

## 🔄 完整数据流转流程

### 📤 **创建流程 (增)**

#### 前端 → 后端
```typescript
// 1. Frontend: 创建客户端实体
const clientGoal = Goal.forCreate({
  name: "学习 TypeScript",
  description: "深入掌握 TS 类型系统",
  color: "#FF5733",
  startTime: new Date("2025-01-01"),
  endTime: new Date("2025-03-31"),
  keyResults: [
    {
      name: "完成 TS 官方文档",
      targetValue: 100,
      unit: "%"
    }
  ]
});

// 2. Frontend: 转换为 DTO
const createRequest: CreateGoalRequest = clientGoal.toCreateDTO();

// 3. Transport: 发送到后端
await api.post('/api/v1/goals', createRequest);
```

#### 后端处理
```typescript
// 4. Backend: DTO → Server Entity
const goalEntity = Goal.fromCreateDTO(createRequest, { accountUuid });

// 5. Backend: 业务逻辑处理
goalEntity.validateBusinessRules();
goalEntity.initializeDefaultKeyResults();

// 6. Backend: Server Entity → Database
const persistenceData = goalEntity.toDatabase({ accountUuid });
await goalRepository.createGoal(persistenceData);

// 7. Backend: 返回响应
const response = goalEntity.toResponseDTO();
return response;
```

### 📥 **查询流程 (查)**

#### 单资源查询
```typescript
// 1. Backend: Database → Server Entity (含子实体)
const dbGoal = await prisma.goal.findUnique({
  where: { uuid: goalUuid },
  include: {
    keyResults: {
      include: { records: true }
    },
    reviews: true
  }
});

// 2. Backend: 完整重构聚合根
const goalEntity = await Goal.fromDatabaseWithChildren(dbGoal);

// 3. Backend: 计算展示属性
goalEntity.calculateProgress();
goalEntity.updateStatistics();

// 4. Backend: Server Entity → Response DTO
const response = goalEntity.toResponseDTO();
```

#### 列表查询
```typescript
// 1. Backend: 分页查询 + 过滤
const goals = await goalRepository.findGoalsWithFilters({
  accountUuid,
  filters: { status, category, tags },
  pagination: { page, size }
});

// 2. Backend: 批量转换 (不含子实体，提升性能)
const responseList = goals.map(goal => 
  Goal.fromDatabase(goal).toListItemDTO()
);
```

### 🔄 **更新流程 (改)**

#### 增量更新 (推荐)
```typescript
// 1. Frontend: 跟踪变更
const changes = {
  name: "新的目标名称",
  color: "#33FF57"
};

// 2. Backend: 增量更新
const existingGoal = await goalRepository.findByUuid(goalUuid);
const goalEntity = Goal.fromDatabaseWithChildren(existingGoal);

// 3. Backend: 应用变更
goalEntity.updateProperties(changes);

// 4. Backend: 保存变更
await goalRepository.updateGoal(goalUuid, goalEntity.toDatabase({ accountUuid }));
```

#### 全量更新
```typescript
// 1. Frontend: 完整实体
const updatedGoal = clientGoal.clone().applyChanges(changes);

// 2. Backend: 完整替换
const goalEntity = Goal.fromUpdateDTO(updateRequest, { accountUuid });
await goalRepository.replaceGoal(goalUuid, goalEntity);
```

### 🗑️ **删除流程 (删)**

#### 聚合根删除
```typescript
// 1. Backend: 级联删除所有子实体
await goalRepository.deleteGoalWithChildren(goalUuid);
```

#### 子实体删除
```typescript
// 1. Backend: 通过聚合根删除子实体
const goalEntity = await goalRepository.findByUuid(goalUuid);
goalEntity.removeKeyResult(keyResultUuid);
await goalRepository.updateGoal(goalUuid, goalEntity);
```

## 🏗️ 核心类设计

### Goal 聚合根
```typescript
export class Goal extends GoalCore {
  // === 工厂方法 ===
  static forCreate(params: CreateGoalParams): Goal
  static fromCreateDTO(dto: CreateGoalRequest, context: { accountUuid: string }): Goal
  static fromUpdateDTO(dto: UpdateGoalRequest, context: { accountUuid: string }): Goal
  static fromDatabase(dbData: GoalPersistenceDTO): Goal
  static fromDatabaseWithChildren(dbData: CompleteGoalData): Goal

  // === 转换方法 ===
  toCreateDTO(): CreateGoalRequest
  toUpdateDTO(): UpdateGoalRequest
  toResponseDTO(): GoalResponse
  toListItemDTO(): GoalListItem
  toDatabase(context: { accountUuid: string }): GoalPersistenceDTO

  // === 业务方法 ===
  addKeyResult(keyResult: KeyResult): void
  removeKeyResult(keyResultUuid: string): void
  updateKeyResult(keyResultUuid: string, updates: Partial<KeyResult>): void
  addRecord(keyResultUuid: string, record: GoalRecord): void
  calculateProgress(): number
  validateBusinessRules(): void
}
```

### DTO 定义更新
```typescript
// 创建请求 DTO
export interface CreateGoalRequest {
  name: string;
  description?: string;
  color: string;
  dirUuid?: string;
  startTime: number; // timestamp
  endTime: number; // timestamp
  note?: string;
  analysis: {
    motive: string;
    feasibility: string;
    importanceLevel: ImportanceLevel;
    urgencyLevel: UrgencyLevel;
  };
  metadata: {
    tags: string[];
    category: string;
  };
  keyResults?: CreateKeyResultRequest[];
  records?: CreateGoalRecordRequest[];
  reviews?: CreateGoalReviewRequest[];
}

// 响应 DTO (包含计算字段)
export interface GoalResponse extends GoalDTO {
  // 计算字段
  progress: number;
  completedKeyResults: number;
  totalRecords: number;
  lastActivity: number; // timestamp
  daysRemaining: number;
  
  // 统计信息
  statistics: {
    totalProgress: number;
    weightedProgress: number;
    averageRating: number;
    completionRate: number;
  };
}

// 列表项 DTO (精简版)
export interface GoalListItem {
  uuid: string;
  name: string;
  color: string;
  progress: number;
  status: GoalStatus;
  daysRemaining: number;
  keyResultsCount: number;
  lastActivity: number;
}
```

## 🔧 仓储层设计

### 接口定义
```typescript
export interface IGoalRepository {
  // 聚合根操作
  createGoal(goal: GoalPersistenceDTO, children: ChildEntitiesData): Promise<GoalResponse>;
  findByUuid(uuid: string): Promise<GoalPersistenceDTO | null>;
  findByUuidWithChildren(uuid: string): Promise<CompleteGoalData | null>;
  updateGoal(uuid: string, goal: GoalPersistenceDTO): Promise<void>;
  updateGoalWithChildren(uuid: string, data: CompleteGoalData): Promise<void>;
  deleteGoal(uuid: string): Promise<void>;
  
  // 批量操作
  findGoalsByAccount(accountUuid: string, filters?: QueryFilters): Promise<GoalPersistenceDTO[]>;
  findGoalsWithChildren(accountUuid: string, filters?: QueryFilters): Promise<CompleteGoalData[]>;
  
  // 子实体操作 (通过聚合根)
  updateKeyResultInGoal(goalUuid: string, keyResultUuid: string, updates: any): Promise<void>;
  addRecordToKeyResult(goalUuid: string, keyResultUuid: string, record: any): Promise<void>;
}
```

## 🎯 关键改进点

### 1. 统一数据转换
- 所有时间使用 timestamp 在 DTO 层
- JSON 字段统一处理空值和格式错误
- 枚举值验证和转换

### 2. 聚合根边界
- 所有子实体操作通过 Goal 聚合根
- accountUuid 只在聚合根级别
- 业务规则在聚合根内部验证

### 3. 性能优化
- 列表查询不加载子实体
- 延迟加载重关联数据
- 缓存计算结果

### 4. 错误处理
- 数据转换异常统一处理
- 业务规则验证异常
- 数据库约束异常

## 📚 实现优先级

1. **P0**: 修复当前 JSON 解析错误
2. **P1**: 实现聚合根主导的数据转换
3. **P2**: 完善业务方法和验证规则
4. **P3**: 性能优化和缓存策略

这个设计确保了：
- ✅ 聚合根完全控制子实体
- ✅ 数据格式转换统一可靠
- ✅ 支持增量和全量更新
- ✅ 良好的性能和可维护性