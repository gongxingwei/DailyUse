# Goal 模块 DTO 优化总结

## 优化日期
2025年10月2日

## 优化目标

1. **RESTful 风格统一**：所有请求数据都在 JSON body 中，不通过 URL 传递业务数据
2. **简化 Request DTO**：直接映射实体属性，不过度拆分（避免 `basic`/`analysis`/`metadata` 这种嵌套结构）
3. **明确 DTO 职责**：
   - `DTO`: 服务端内部传输对象（纯数据）
   - `ClientDTO`: 客户端渲染对象（包含计算属性）

## 主要变化

### 1. 命名规范变化

#### 旧命名方式
```typescript
export interface KeyResultDTO { ... }           // 基础 DTO
export interface KeyResultResponse { ... }      // 响应 DTO（扩展基础DTO）
```

#### 新命名方式
```typescript
export interface KeyResultDTO { ... }           // 服务端数据传输对象
export interface KeyResultClientDTO { ... }     // 客户端渲染对象（包含计算属性）
```

**优势**：
- 更清晰的职责划分：`DTO` 用于服务端内部，`ClientDTO` 用于返回给前端
- 前端使用 `ClientDTO` 更直观，表明这是为客户端设计的对象
- 避免 `Response` 后缀的歧义（是请求响应？还是扩展数据？）

### 2. Request DTO 简化

#### 旧方式（过度拆分）
```typescript
export interface UpdateGoalRequest {
  basic?: {
    name?: string;
    description?: string;
    color?: string;
    ...
  };
  analysis?: {
    motive?: string;
    feasibility?: string;
    ...
  };
  metadata?: {
    tags?: string[];
    category?: string;
  };
  // 子实体操作
  addKeyResults?: CreateKeyResultRequest[];
  updateKeyResults?: Record<string, UpdateKeyResultRequest>;
  removeKeyResults?: string[];
  ...
}
```

#### 新方式（扁平化）
```typescript
export interface UpdateGoalRequest {
  name?: string;
  description?: string;
  color?: string;
  dirUuid?: string;
  startTime?: number;
  endTime?: number;
  note?: string;
  analysis?: {
    motive?: string;
    feasibility?: string;
    importanceLevel?: ImportanceLevel;
    urgencyLevel?: UrgencyLevel;
  };
  metadata?: {
    tags?: string[];
    category?: string;
  };
  status?: GoalStatus;
}
```

**优势**：
- 更符合 RESTful 风格，直接映射实体属性
- 简化前端调用，减少嵌套层级
- 更清晰的数据结构

**注意**：子实体的增删改操作改为独立的 API 端点：
- `POST /api/v1/goals/:goalId/key-results` - 添加关键结果
- `PUT /api/v1/goals/:goalId/key-results/:keyResultId` - 更新关键结果
- `DELETE /api/v1/goals/:goalId/key-results/:keyResultId` - 删除关键结果

### 3. RESTful API 端点设计

#### 关键结果 (KeyResult)
```
POST   /api/v1/goals/:goalId/key-results
GET    /api/v1/goals/:goalId/key-results
GET    /api/v1/goals/:goalId/key-results/:keyResultId
PUT    /api/v1/goals/:goalId/key-results/:keyResultId
DELETE /api/v1/goals/:goalId/key-results/:keyResultId
```

#### 目标记录 (GoalRecord)
```
POST   /api/v1/goals/:goalId/key-results/:keyResultId/records
GET    /api/v1/goals/:goalId/records
DELETE /api/v1/goals/:goalId/records/:recordId
```

#### 目标复盘 (GoalReview)
```
POST   /api/v1/goals/:goalId/reviews
GET    /api/v1/goals/:goalId/reviews
GET    /api/v1/goals/:goalId/reviews/:reviewId
PUT    /api/v1/goals/:goalId/reviews/:reviewId
DELETE /api/v1/goals/:goalId/reviews/:reviewId
```

### 4. ClientDTO 计算属性

#### KeyResultClientDTO
```typescript
export interface KeyResultClientDTO extends KeyResultDTO {
  progress: number;        // 完成百分比 (0-100)
  isCompleted: boolean;    // 是否已完成
  remaining: number;       // 剩余数量
}
```

#### GoalReviewClientDTO
```typescript
export interface GoalReviewClientDTO extends GoalReviewDTO {
  overallRating: number;      // 平均评分
  isPositiveReview: boolean;  // 是否为正向评价
}
```

#### GoalClientDTO
```typescript
export interface GoalClientDTO extends Omit<GoalDTO, 'keyResults' | 'records' | 'reviews'> {
  keyResults?: KeyResultClientDTO[];
  records?: GoalRecordClientDTO[];
  reviews?: GoalReviewClientDTO[];

  // 进度相关
  overallProgress: number;
  weightedProgress: number;
  calculatedProgress: number;
  todayProgress: number;

  // 关键结果统计
  completedKeyResults: number;
  totalKeyResults: number;
  keyResultCompletionRate: number;

  // 状态分析
  progressStatus: GoalProgressStatus;
  healthScore: number;

  // 时间相关
  daysRemaining: number;
  isOverdue: boolean;

  // 今日进度相关
  hasTodayProgress: boolean;
  todayProgressLevel: GoalTodayProgressLevel;
  todayRecordsStats: { ... };
}
```

### 5. 服务端方法名变化

#### 旧方式
```typescript
class Goal {
  toResponse(): GoalResponse { ... }
}
```

#### 新方式
```typescript
class Goal {
  toClient(): GoalClientDTO { ... }
}
```

**原因**：
- `toClient` 更明确表达意图：转换为客户端需要的格式
- 与 `ClientDTO` 命名保持一致

## 兼容性处理

为了平滑过渡，添加了类型别名：

```typescript
/**
 * @deprecated 使用 KeyResultClientDTO 替代
 */
export type KeyResultResponse = KeyResultClientDTO;

/**
 * @deprecated 使用 GoalClientDTO 替代
 */
export type GoalResponse = GoalClientDTO;

// ... 其他类似别名
```

这样旧代码可以继续使用 `*Response` 类型，但会显示 deprecated 警告。

## 迁移指南

### 1. 服务端代码

#### Domain Layer (实体)
```typescript
// 旧代码
toResponse(): GoalResponse { ... }

// 新代码
toClient(): GoalClientDTO { ... }
```

#### Application Layer (服务)
```typescript
// 旧代码
async updateGoal(uuid: string, request: UpdateGoalRequest): Promise<GoalResponse> {
  // 处理 request.basic, request.analysis, request.metadata
  // 处理子实体操作 addKeyResults, updateKeyResults, removeKeyResults
}

// 新代码
async updateGoal(uuid: string, request: UpdateGoalRequest): Promise<GoalClientDTO> {
  // 直接处理 request 的扁平属性
  // 子实体操作移到独立的方法
}

async addKeyResult(goalUuid: string, request: CreateKeyResultRequest): Promise<KeyResultClientDTO>
async updateKeyResult(goalUuid: string, keyResultUuid: string, request: UpdateKeyResultRequest): Promise<KeyResultClientDTO>
async removeKeyResult(goalUuid: string, keyResultUuid: string): Promise<void>
```

### 2. Controller Layer

```typescript
// 旧代码
@Put('/goals/:id')
async updateGoal(@Param('id') id: string, @Body() request: UpdateGoalRequest) {
  // 处理复杂的嵌套结构
}

// 新代码
@Put('/goals/:id')
async updateGoal(@Param('id') id: string, @Body() request: UpdateGoalRequest) {
  // 更简单的处理
}

@Post('/goals/:goalId/key-results')
async addKeyResult(@Param('goalId') goalId: string, @Body() request: CreateKeyResultRequest) {
  return this.goalService.addKeyResult(goalId, request);
}
```

### 3. 前端代码

```typescript
// 旧代码
const updateData: UpdateGoalRequest = {
  basic: { name: '新名称' },
  analysis: { motive: '新动机' },
  updateKeyResults: {
    'uuid-1': { name: '更新关键结果' }
  }
};

// 新代码
// 1. 更新目标基本信息
const updateGoalData: UpdateGoalRequest = {
  name: '新名称',
  analysis: { motive: '新动机' }
};
await api.updateGoal(goalId, updateGoalData);

// 2. 更新关键结果（独立 API）
await api.updateKeyResult(goalId, keyResultId, { name: '更新关键结果' });
```

## 优势总结

1. **更清晰的职责划分**：DTO 用于服务端，ClientDTO 用于客户端
2. **更简单的 API 设计**：扁平化的 Request 结构，符合 RESTful 风格
3. **更好的可维护性**：独立的子实体 API 端点，减少复杂度
4. **更强的类型安全**：明确的类型定义，减少运行时错误
5. **更好的前端体验**：ClientDTO 包含所有渲染需要的数据，减少前端计算

## 后续工作

1. **服务端适配**：
   - [ ] 更新 `Goal.toResponse()` 为 `Goal.toClient()`
   - [ ] 更新 `GoalApplicationService` 以适配新的 Request DTO
   - [ ] 添加子实体的独立 API 方法
   - [ ] 更新 Controller 层的路由和处理逻辑

2. **前端适配**：
   - [ ] 更新 API 调用，使用新的扁平化结构
   - [ ] 更新类型定义，使用 `*ClientDTO`
   - [ ] 拆分子实体的增删改为独立 API 调用

3. **测试更新**：
   - [ ] 更新集成测试以适配新的 API 结构
   - [ ] 添加新的端点测试

4. **文档更新**：
   - [ ] 更新 API 文档
   - [ ] 更新前端开发文档
