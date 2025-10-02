# 正确的 Goal 模块 DDD 架构设计

## 🎯 核心原则

### 1. 前后端对称设计
- **Web 端**: `packages/domain-client/src/goal/` - 客户端实体和业务逻辑
- **API 端**: `packages/domain-server/src/goal/` - 服务端实体和业务逻辑
- **共享**: `packages/contracts/src/modules/goal/` - DTO 定义

### 2. 职责分层

```typescript
// ============ Web 端 (domain-client) ============
class Goal {
  // 纯前端业务逻辑
  addKeyResult(keyResult: KeyResult): void
  updateBasic(updates: Partial<GoalBasicInfo>): void
  
  // 数据转换
  toDTO(): GoalDTO
  static fromDTO(dto: GoalDTO): Goal
}

// ============ API 应用层 ============
class GoalApplicationService {
  async createGoal(dto: CreateGoalRequest, context: RequestContext) {
    // 1. DTO → 服务端实体
    const goal = Goal.fromDTO(dto);
    
    // 2. 业务验证
    goal.validate();
    
    // 3. 持久化
    await this.goalRepository.save(goal, context);
  }
  
  async updateGoal(goalUuid: string, dto: UpdateGoalRequest, context: RequestContext) {
    // 1. 从数据库加载完整聚合根
    const goal = await this.goalRepository.findByUuid(goalUuid);
    
    // 2. 应用层处理 DTO → 实体转换
    if (dto.basic) {
      goal.updateBasic({
        name: dto.basic.name,
        description: dto.basic.description,
        // ...
      });
    }
    
    if (dto.addKeyResults) {
      dto.addKeyResults.forEach(krDto => {
        const keyResult = KeyResult.fromDTO(krDto);
        goal.addKeyResult(keyResult);
      });
    }
    
    // 3. 持久化
    await this.goalRepository.save(goal, context);
  }
}

// ============ Domain 领域层 ============
class Goal extends GoalCore {
  // 只接收实体对象，不处理 DTO
  addKeyResult(keyResult: KeyResult): void {
    this.validateKeyResultWeight(keyResult);
    this.keyResults.push(keyResult);
    this.updateVersion();
  }
  
  // 通用的基础信息更新
  updateBasic(updates: {
    name?: string;
    description?: string;
    color?: string;
    // ... 其他基础字段
  }): void {
    if (updates.name) this._name = updates.name;
    if (updates.description) this._description = updates.description;
    if (updates.color) this._color = updates.color;
    // ...
    this.updateVersion();
  }
  
  // 子实体修改也接收实体对象
  updateKeyResult(keyResultUuid: string, keyResult: KeyResult): void {
    const index = this.keyResults.findIndex(kr => kr.uuid === keyResultUuid);
    if (index === -1) throw new Error('KeyResult not found');
    
    this.keyResults[index] = keyResult;
    this.updateVersion();
  }
}
```

## 🏗️ 完整架构层次

### Layer 1: Web 前端 (domain-client)

#### 目录结构
```
packages/domain-client/src/goal/
├── entities/
│   ├── Goal.ts          # 前端 Goal 实体
│   ├── KeyResult.ts     # 前端 KeyResult 实体
│   ├── GoalRecord.ts    # 前端 GoalRecord 实体
│   └── GoalReview.ts    # 前端 GoalReview 实体
├── services/
│   └── GoalService.ts   # 前端业务服务
└── types.ts             # 前端特有类型
```

#### Goal 实体 (前端)
```typescript
// packages/domain-client/src/goal/entities/Goal.ts
export class Goal {
  private _uuid: string;
  private _name: string;
  private _keyResults: KeyResult[] = [];
  // ... 其他字段
  
  // ===== 前端专有方法 =====
  
  /**
   * 创建新 Goal（前端）
   */
  static create(params: {
    name: string;
    description?: string;
    // ...
  }): Goal {
    return new Goal({
      uuid: generateUuid(),
      name: params.name,
      // ...
      keyResults: [],
    });
  }
  
  /**
   * 添加关键结果（前端）- 只接收实体对象
   */
  addKeyResult(keyResult: KeyResult): void {
    // 前端验证
    if (this.getTotalWeight() + keyResult.weight > 100) {
      throw new Error('权重总和不能超过100%');
    }
    this._keyResults.push(keyResult);
  }
  
  /**
   * 更新基础信息（前端）- 统一的更新方法
   */
  updateBasic(updates: {
    name?: string;
    description?: string;
    color?: string;
    startTime?: Date;
    endTime?: Date;
    // ... 其他基础字段
  }): void {
    if (updates.name) this._name = updates.name;
    if (updates.description) this._description = updates.description;
    if (updates.color) this._color = updates.color;
    // ...
  }
  
  /**
   * 更新关键结果（前端）- 接收实体对象
   */
  updateKeyResult(keyResultUuid: string, keyResult: KeyResult): void {
    const index = this._keyResults.findIndex(kr => kr.uuid === keyResultUuid);
    if (index === -1) throw new Error('KeyResult not found');
    this._keyResults[index] = keyResult;
  }
  
  /**
   * 删除关键结果（前端）
   */
  removeKeyResult(keyResultUuid: string): void {
    this._keyResults = this._keyResults.filter(kr => kr.uuid !== keyResultUuid);
  }
  
  // ===== 数据转换（前后端通用）=====
  
  /**
   * 转换为 DTO（传输到后端）
   */
  toDTO(): GoalDTO {
    return {
      uuid: this._uuid,
      name: this._name,
      description: this._description,
      // ...
      keyResults: this._keyResults.map(kr => kr.toDTO()),
    };
  }
  
  /**
   * 从 DTO 创建实体（从后端接收）
   */
  static fromDTO(dto: GoalDTO): Goal {
    return new Goal({
      uuid: dto.uuid,
      name: dto.name,
      // ...
      keyResults: dto.keyResults?.map(kr => KeyResult.fromDTO(kr)) || [],
    });
  }
}
```

### Layer 2: API 应用层 (apps/api)

#### 目录结构
```
apps/api/src/modules/goal/
├── application/
│   └── services/
│       └── GoalApplicationService.ts  # 应用服务（DTO 转换在这里）
├── interface/
│   └── http/
│       ├── controllers/
│       │   └── GoalController.ts      # HTTP 控制器
│       └── dto/
│           ├── CreateGoalRequest.ts   # 创建请求 DTO
│           └── UpdateGoalRequest.ts   # 更新请求 DTO
└── infrastructure/
    └── repositories/
        └── PrismaGoalRepository.ts    # 数据持久化
```

#### 应用服务（关键！DTO 转换在这里）
```typescript
// apps/api/src/modules/goal/application/services/GoalApplicationService.ts
export class GoalApplicationService {
  constructor(
    private goalRepository: IGoalRepository,
  ) {}
  
  /**
   * 创建目标
   * 应用层负责 DTO → 实体的转换
   */
  async createGoal(
    request: CreateGoalRequest, 
    context: RequestContext
  ): Promise<GoalResponse> {
    // 1. DTO → 服务端实体（在应用层转换）
    const goal = this.mapCreateRequestToEntity(request);
    
    // 2. 业务验证
    goal.validate();
    
    // 3. 持久化（仓储层只处理实体对象）
    await this.goalRepository.save(goal, context);
    
    // 4. 实体 → 响应 DTO
    return goal.toResponse();
  }
  
  /**
   * 更新目标
   * 应用层负责增量更新的处理
   */
  async updateGoal(
    goalUuid: string,
    request: UpdateGoalRequest,
    context: RequestContext
  ): Promise<GoalResponse> {
    // 1. 加载完整聚合根
    const goal = await this.goalRepository.findByUuidWithChildren(goalUuid);
    if (!goal) throw new NotFoundError('Goal not found');
    
    // 2. 应用层处理更新（DTO → 实体操作）
    
    // 2.1 更新基础信息
    if (request.basic) {
      goal.updateBasic({
        name: request.basic.name,
        description: request.basic.description,
        color: request.basic.color,
        startTime: request.basic.startTime ? new Date(request.basic.startTime) : undefined,
        endTime: request.basic.endTime ? new Date(request.basic.endTime) : undefined,
        // ...
      });
    }
    
    // 2.2 更新分析信息
    if (request.analysis) {
      goal.updateAnalysis({
        motive: request.analysis.motive,
        feasibility: request.analysis.feasibility,
        importanceLevel: request.analysis.importanceLevel,
        urgencyLevel: request.analysis.urgencyLevel,
      });
    }
    
    // 2.3 添加关键结果（DTO → 实体）
    if (request.addKeyResults) {
      request.addKeyResults.forEach(krDto => {
        const keyResult = this.mapKeyResultDtoToEntity(krDto, goalUuid);
        goal.addKeyResult(keyResult); // 传入实体对象
      });
    }
    
    // 2.4 更新关键结果（DTO → 实体）
    if (request.updateKeyResults) {
      for (const [uuid, krDto] of Object.entries(request.updateKeyResults)) {
        const keyResult = this.mapKeyResultDtoToEntity(krDto, goalUuid, uuid);
        goal.updateKeyResult(uuid, keyResult); // 传入实体对象
      });
    }
    
    // 2.5 删除关键结果
    if (request.removeKeyResults) {
      request.removeKeyResults.forEach(uuid => {
        goal.removeKeyResult(uuid);
      });
    }
    
    // 3. 持久化
    await this.goalRepository.save(goal, context);
    
    // 4. 返回响应
    return goal.toResponse();
  }
  
  // ===== 私有映射方法（DTO → 实体转换）=====
  
  private mapCreateRequestToEntity(request: CreateGoalRequest): Goal {
    const goal = new Goal({
      uuid: request.goalUuid || generateUuid(),
      name: request.name,
      description: request.description,
      color: request.color,
      startTime: new Date(request.startTime),
      endTime: new Date(request.endTime),
      // ...
      keyResults: [],
      records: [],
      reviews: [],
    });
    
    // 添加子实体
    if (request.keyResults) {
      request.keyResults.forEach(krDto => {
        const keyResult = this.mapKeyResultDtoToEntity(krDto, goal.uuid);
        goal.addKeyResult(keyResult);
      });
    }
    
    return goal;
  }
  
  private mapKeyResultDtoToEntity(
    dto: CreateKeyResultRequest | UpdateKeyResultRequest,
    goalUuid: string,
    uuid?: string
  ): KeyResult {
    return new KeyResult({
      uuid: uuid || generateUuid(),
      goalUuid,
      name: dto.name!,
      description: dto.description,
      startValue: dto.startValue || 0,
      targetValue: dto.targetValue!,
      currentValue: dto.currentValue || 0,
      unit: dto.unit!,
      weight: dto.weight!,
      calculationMethod: dto.calculationMethod || 'sum',
      // ...
    });
  }
}
```

#### 更新请求 DTO
```typescript
// apps/api/src/modules/goal/interface/http/dto/UpdateGoalRequest.ts
export interface UpdateGoalRequest {
  // 基础信息更新
  basic?: {
    name?: string;
    description?: string;
    color?: string;
    dirUuid?: string;
    startTime?: number;
    endTime?: number;
    note?: string;
  };
  
  // 分析信息更新
  analysis?: {
    motive?: string;
    feasibility?: string;
    importanceLevel?: ImportanceLevel;
    urgencyLevel?: UrgencyLevel;
  };
  
  // 元数据更新
  metadata?: {
    tags?: string[];
    category?: string;
  };
  
  // 子实体操作（增量操作）
  addKeyResults?: CreateKeyResultRequest[];
  updateKeyResults?: Record<string, UpdateKeyResultRequest>;
  removeKeyResults?: string[];
  
  addRecords?: CreateGoalRecordRequest[];
  removeRecords?: string[];
  
  addReviews?: CreateGoalReviewRequest[];
  updateReviews?: Record<string, UpdateGoalReviewRequest>;
  removeReviews?: string[];
}
```

### Layer 3: Domain 领域层 (domain-server)

#### Goal 聚合根（精简版，只处理业务逻辑）
```typescript
// packages/domain-server/src/goal/aggregates/Goal.ts
export class Goal extends GoalCore {
  // ===== 业务方法（只接收实体对象）=====
  
  /**
   * 更新基础信息
   * 统一的更新方法，不接收 DTO
   */
  updateBasic(updates: {
    name?: string;
    description?: string;
    color?: string;
    dirUuid?: string;
    startTime?: Date;
    endTime?: Date;
    note?: string;
  }): void {
    if (updates.name !== undefined) {
      this.validateName(updates.name);
      this._name = updates.name;
    }
    
    if (updates.description !== undefined) {
      this._description = updates.description;
    }
    
    if (updates.color !== undefined) {
      this.validateColor(updates.color);
      this._color = updates.color;
    }
    
    if (updates.dirUuid !== undefined) {
      this._dirUuid = updates.dirUuid;
    }
    
    if (updates.startTime !== undefined || updates.endTime !== undefined) {
      const newStart = updates.startTime || this._startTime;
      const newEnd = updates.endTime || this._endTime;
      this.validateTimeRange(newStart, newEnd);
      this._startTime = newStart;
      this._endTime = newEnd;
    }
    
    if (updates.note !== undefined) {
      this._note = updates.note;
    }
    
    this.updateVersion();
  }
  
  /**
   * 更新分析信息
   */
  updateAnalysis(updates: {
    motive?: string;
    feasibility?: string;
    importanceLevel?: ImportanceLevel;
    urgencyLevel?: UrgencyLevel;
  }): void {
    if (updates.motive !== undefined) {
      this._analysis.motive = updates.motive;
    }
    if (updates.feasibility !== undefined) {
      this._analysis.feasibility = updates.feasibility;
    }
    if (updates.importanceLevel !== undefined) {
      this._analysis.importanceLevel = updates.importanceLevel;
    }
    if (updates.urgencyLevel !== undefined) {
      this._analysis.urgencyLevel = updates.urgencyLevel;
    }
    this.updateVersion();
  }
  
  /**
   * 更新元数据
   */
  updateMetadata(updates: {
    tags?: string[];
    category?: string;
  }): void {
    if (updates.tags !== undefined) {
      this._metadata.tags = [...updates.tags];
    }
    if (updates.category !== undefined) {
      this._metadata.category = updates.category;
    }
    this.updateVersion();
  }
  
  /**
   * 添加关键结果
   * 只接收实体对象，不接收 DTO
   */
  addKeyResult(keyResult: KeyResult): void {
    // 业务验证
    const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0) + keyResult.weight;
    if (totalWeight > 100) {
      throw new DomainError('关键结果权重总和不能超过100%');
    }
    
    // 添加到聚合
    this.keyResults.push(keyResult);
    this.updateVersion();
    
    // 发布领域事件
    this.addDomainEvent({
      type: 'KeyResultAdded',
      aggregateId: this.uuid,
      payload: { keyResultUuid: keyResult.uuid }
    });
  }
  
  /**
   * 更新关键结果
   * 只接收实体对象，不接收 DTO
   */
  updateKeyResult(keyResultUuid: string, keyResult: KeyResult): void {
    const index = this.keyResults.findIndex(kr => kr.uuid === keyResultUuid);
    if (index === -1) {
      throw new DomainError('关键结果不存在');
    }
    
    // 验证权重
    const otherWeight = this.keyResults
      .filter(kr => kr.uuid !== keyResultUuid)
      .reduce((sum, kr) => sum + kr.weight, 0);
    
    if (otherWeight + keyResult.weight > 100) {
      throw new DomainError('关键结果权重总和不能超过100%');
    }
    
    // 更新
    this.keyResults[index] = keyResult;
    this.updateVersion();
    
    this.addDomainEvent({
      type: 'KeyResultUpdated',
      aggregateId: this.uuid,
      payload: { keyResultUuid }
    });
  }
  
  /**
   * 删除关键结果
   */
  removeKeyResult(keyResultUuid: string): void {
    const index = this.keyResults.findIndex(kr => kr.uuid === keyResultUuid);
    if (index === -1) {
      throw new DomainError('关键结果不存在');
    }
    
    // 级联删除相关记录
    this.records = this.records.filter(r => r.keyResultUuid !== keyResultUuid);
    
    // 删除关键结果
    this.keyResults.splice(index, 1);
    this.updateVersion();
    
    this.addDomainEvent({
      type: 'KeyResultRemoved',
      aggregateId: this.uuid,
      payload: { keyResultUuid }
    });
  }
  
  /**
   * 添加记录
   * 只接收实体对象
   */
  addRecord(record: GoalRecord): void {
    // 验证关键结果存在
    const keyResult = this.keyResults.find(kr => kr.uuid === record.keyResultUuid);
    if (!keyResult) {
      throw new DomainError('关键结果不存在');
    }
    
    // 添加记录
    this.records.push(record);
    
    // 更新关键结果进度
    keyResult.addProgress(record.value);
    
    this.updateVersion();
    
    this.addDomainEvent({
      type: 'RecordAdded',
      aggregateId: this.uuid,
      payload: { recordUuid: record.uuid, keyResultUuid: record.keyResultUuid }
    });
  }
  
  // ===== 数据转换（只有 Database 层）=====
  
  /**
   * 转换为数据库格式
   */
  toDatabase(context: { accountUuid: string }): GoalPersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: context.accountUuid,
      name: this._name,
      description: this._description,
      // ... 扁平化存储
      tags: JSON.stringify(this._metadata.tags),
      // ...
    };
  }
  
  /**
   * 从数据库加载
   */
  static fromDatabase(data: GoalPersistenceDTO): Goal {
    return new Goal({
      uuid: data.uuid,
      name: data.name,
      // ...
      tags: safeJsonParse(data.tags, []),
      keyResults: [], // 子实体单独加载
    });
  }
  
  /**
   * 转换为响应 DTO（包含计算字段）
   */
  toResponse(): GoalResponse {
    return {
      ...this.toDTO(),
      // 计算字段
      progress: this.calculateProgress(),
      daysRemaining: this.calculateDaysRemaining(),
      // ...
    };
  }
}
```

## 🔄 完整数据流转示例

### 示例 1: 创建目标

```typescript
// ===== Web 端 =====
// 1. 用户在表单中创建
const goal = Goal.create({
  name: "学习 TypeScript",
  description: "深入掌握 TS 类型系统",
  // ...
});

// 2. 添加关键结果（实体对象）
const keyResult = KeyResult.create({
  name: "完成官方文档",
  targetValue: 100,
  unit: "%",
  weight: 50,
});
goal.addKeyResult(keyResult);

// 3. 转换为 DTO 发送到后端
const dto = goal.toDTO();
await goalApi.create(dto);

// ===== API 端 =====
// 4. 控制器接收 DTO
@Post()
async createGoal(@Body() request: CreateGoalRequest, @Req() req) {
  return this.goalApplicationService.createGoal(request, req.context);
}

// 5. 应用服务转换 DTO → 实体
async createGoal(request: CreateGoalRequest, context: RequestContext) {
  // DTO → 实体（在应用层）
  const goal = this.mapCreateRequestToEntity(request);
  
  // 持久化
  await this.goalRepository.save(goal, context);
  
  return goal.toResponse();
}

// 6. 领域层只处理实体逻辑
addKeyResult(keyResult: KeyResult): void {
  this.validateWeight(keyResult);
  this.keyResults.push(keyResult);
}
```

### 示例 2: 更新目标

```typescript
// ===== Web 端 =====
// 1. 获取现有 goal
const goal = await goalApi.getById(goalUuid);
const goalEntity = Goal.fromDTO(goal);

// 2. 更新基础信息（实体方法）
goalEntity.updateBasic({
  name: "新的目标名称",
  description: "新的描述",
});

// 3. 添加关键结果（实体对象）
const newKR = KeyResult.create({
  name: "新的关键结果",
  targetValue: 100,
  unit: "%",
  weight: 30,
});
goalEntity.addKeyResult(newKR);

// 4. 构造增量更新请求
const updateRequest: UpdateGoalRequest = {
  basic: {
    name: goalEntity.name,
    description: goalEntity.description,
  },
  addKeyResults: [newKR.toDTO()],
};

// 5. 发送到后端
await goalApi.update(goalUuid, updateRequest);

// ===== API 端 =====
// 6. 应用服务处理增量更新
async updateGoal(goalUuid: string, request: UpdateGoalRequest, context: RequestContext) {
  // 加载现有聚合根
  const goal = await this.goalRepository.findByUuidWithChildren(goalUuid);
  
  // 应用层处理 DTO → 实体操作
  if (request.basic) {
    goal.updateBasic({
      name: request.basic.name,
      description: request.basic.description,
    });
  }
  
  if (request.addKeyResults) {
    request.addKeyResults.forEach(krDto => {
      const keyResult = this.mapKeyResultDtoToEntity(krDto, goalUuid);
      goal.addKeyResult(keyResult); // 传入实体对象
    });
  }
  
  // 保存
  await this.goalRepository.save(goal, context);
  
  return goal.toResponse();
}
```

## 📋 实现清单

### Phase 1: 重构 Domain-Server Goal 聚合根
- [ ] 移除所有 `fromCreateDTO`、`fromUpdateDTO` 等 DTO 处理方法
- [ ] 添加 `updateBasic()`、`updateAnalysis()`、`updateMetadata()` 通用方法
- [ ] 修改所有子实体操作方法，只接收实体对象
- [ ] 保留 `toDatabase()`、`fromDatabase()`、`toResponse()` 方法

### Phase 2: 实现 Domain-Client Goal 模块
- [ ] 创建 `packages/domain-client/src/goal/entities/Goal.ts`
- [ ] 创建前端 KeyResult、GoalRecord 等实体
- [ ] 实现 `toDTO()` 和 `fromDTO()` 方法
- [ ] 实现前端业务逻辑方法

### Phase 3: 重构 API 应用层
- [ ] 修改 `GoalApplicationService`，添加 DTO → 实体转换方法
- [ ] 创建 `UpdateGoalRequest` DTO（支持增量更新）
- [ ] 实现私有映射方法 `mapXxxToEntity()`
- [ ] 移除领域层的 DTO 处理

### Phase 4: 更新 Web 端
- [ ] 使用 domain-client 中的 Goal 实体
- [ ] 修改表单组件，使用实体方法
- [ ] 更新 API 调用，使用新的 UpdateGoalRequest 格式

---

**核心思想总结**:
1. ✅ **DTO 转换在应用层**: 应用服务负责 DTO ↔ 实体的转换
2. ✅ **领域层只处理实体**: Goal、KeyResult 等只接收和操作实体对象
3. ✅ **统一的更新方法**: `updateBasic()`、`updateAnalysis()` 等通用方法
4. ✅ **前后端对称设计**: Web 和 API 都有完整的实体定义
5. ✅ **增量更新支持**: UpdateGoalRequest 支持细粒度的增量操作