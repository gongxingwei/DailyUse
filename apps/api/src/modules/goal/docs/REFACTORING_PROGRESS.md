# Goal 模块 DDD 架构重构进度

## 🎯 重构目标

将 Goal 模块重构为正确的 DDD 分层架构：
- **DTO 转换在应用层**：应用服务负责 DTO ↔ 实体的转换
- **领域层只处理实体**：Goal、KeyResult 等只接收和操作实体对象
- **统一的更新方法**：`updateBasic()`、`updateAnalysis()` 等通用方法
- **前后端对称设计**：Web (domain-client) 和 API (domain-server) 都有完整的实体定义

## ✅ 已完成工作

### 1. Domain-Server Goal 聚合根重构 ✅

**文件**: `packages/domain-server/src/goal/aggregates/Goal.ts`

**完成内容**:
- ✅ 添加了通用更新方法:
  - `updateBasic()` - 更新基础信息（name, description, color, dirUuid, startTime, endTime, note）
  - `updateAnalysis()` - 更新分析信息（motive, feasibility, importanceLevel, urgencyLevel）
  - `updateMetadata()` - 更新元数据（tags, category）

- ✅ 修改了子实体操作方法（只接收实体对象）:
  - `addKeyResult(keyResult: KeyResult)` - 添加关键结果
  - `updateKeyResult(uuid, keyResult: KeyResult)` - 更新关键结果
  - `removeKeyResult(uuid)` - 删除关键结果
  - `addRecord(record: GoalRecord)` - 添加记录

- ✅ 移除了错误的 DTO 处理方法:
  - ❌ `forCreate()` - 删除（应在应用层）
  - ❌ `fromCreateDTO()` - 删除（应在应用层）
  - ❌ `fromUpdateDTO()` - 删除（应在应用层）
  - ❌ `toCreateDTO()` - 删除（应在前端）
  - ❌ `toResponseDTO()` - 删除（已有 toResponse()）
  - ❌ `toListItemDTO()` - 删除（应在应用层）
  - ❌ `addKeyResultFromDTO()` - 删除（应在应用层）
  - ❌ `updateKeyResultFromDTO()` - 删除（应在应用层）
  - ❌ `addRecordFromDTO()` - 删除（应在应用层）

- ✅ 保留了正确的序列化方法:
  - ✅ `toDatabase(context)` - 转换为数据库格式
  - ✅ `fromDatabase(dbData)` - 从数据库加载
  - ✅ `toDTO()` - 转换为传输 DTO
  - ✅ `fromDTO(dto)` - 从 DTO 创建实体
  - ✅ `toResponse()` - 转换为响应 DTO（包含计算字段）

### 2. Contracts (DTO) 定义更新 ✅

**文件**: `packages/contracts/src/modules/goal/dtos.ts`

**完成内容**:
- ✅ 重新设计了 `UpdateGoalRequest` 支持增量更新:
  ```typescript
  interface UpdateGoalRequest {
    basic?: { name?, description?, color?, ... };
    analysis?: { motive?, feasibility?, ... };
    metadata?: { tags?, category? };
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

- ✅ 添加了 `UpdateGoalReviewRequest` 类型定义

## 🚧 待完成工作

### Phase 1: 实现 API 应用层服务 ⏳

**目标**: 创建 `GoalApplicationService`，负责 DTO → 实体的转换

**文件**: `apps/api/src/modules/goal/application/services/GoalApplicationService.ts` (新建)

**需要实现的方法**:

```typescript
export class GoalApplicationService {
  constructor(private goalRepository: IGoalRepository) {}
  
  // 创建目标
  async createGoal(request: CreateGoalRequest, context: RequestContext): Promise<GoalResponse> {
    // 1. DTO → 服务端实体（在应用层转换）
    const goal = this.mapCreateRequestToEntity(request);
    
    // 2. 业务验证
    goal.validate();
    
    // 3. 持久化
    await this.goalRepository.save(goal, context);
    
    // 4. 返回响应
    return goal.toResponse();
  }
  
  // 更新目标（增量更新）
  async updateGoal(goalUuid: string, request: UpdateGoalRequest, context: RequestContext): Promise<GoalResponse> {
    // 1. 加载完整聚合根
    const goal = await this.goalRepository.findByUuidWithChildren(goalUuid);
    
    // 2. 应用层处理更新
    if (request.basic) {
      goal.updateBasic({
        name: request.basic.name,
        description: request.basic.description,
        color: request.basic.color,
        startTime: request.basic.startTime ? new Date(request.basic.startTime) : undefined,
        endTime: request.basic.endTime ? new Date(request.basic.endTime) : undefined,
        dirUuid: request.basic.dirUuid,
        note: request.basic.note,
      });
    }
    
    if (request.analysis) {
      goal.updateAnalysis(request.analysis);
    }
    
    if (request.metadata) {
      goal.updateMetadata(request.metadata);
    }
    
    // 处理子实体操作
    if (request.addKeyResults) {
      request.addKeyResults.forEach(krDto => {
        const keyResult = this.mapKeyResultDtoToEntity(krDto, goalUuid);
        goal.addKeyResult(keyResult);
      });
    }
    
    if (request.updateKeyResults) {
      for (const [uuid, krDto] of Object.entries(request.updateKeyResults)) {
        const existing = goal.getKeyResult(uuid);
        if (existing) {
          const updated = this.applyKeyResultUpdates(existing, krDto);
          goal.updateKeyResult(uuid, updated);
        }
      }
    }
    
    if (request.removeKeyResults) {
      request.removeKeyResults.forEach(uuid => goal.removeKeyResult(uuid));
    }
    
    // 3. 持久化
    await this.goalRepository.save(goal, context);
    
    // 4. 返回响应
    return goal.toResponse();
  }
  
  // 私有映射方法
  private mapCreateRequestToEntity(request: CreateGoalRequest): Goal {
    const goal = new Goal({
      uuid: request.goalUuid || generateUuid(),
      name: request.name,
      description: request.description,
      color: request.color,
      dirUuid: request.dirUuid,
      startTime: new Date(request.startTime),
      endTime: new Date(request.endTime),
      note: request.note,
      motive: request.analysis.motive,
      feasibility: request.analysis.feasibility,
      importanceLevel: request.analysis.importanceLevel,
      urgencyLevel: request.analysis.urgencyLevel,
      status: GoalStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: request.metadata.tags,
      category: request.metadata.category,
      version: 1,
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
    dto: CreateKeyResultRequest,
    goalUuid: string,
    uuid?: string
  ): KeyResult {
    return new KeyResult({
      uuid: uuid || generateUuid(),
      goalUuid,
      name: dto.name,
      description: dto.description,
      startValue: dto.startValue || 0,
      targetValue: dto.targetValue,
      currentValue: dto.currentValue || 0,
      unit: dto.unit,
      weight: dto.weight,
      calculationMethod: dto.calculationMethod || KeyResultCalculationMethod.SUM,
      status: KeyResultStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  
  private applyKeyResultUpdates(
    existing: KeyResult,
    updates: UpdateKeyResultRequest
  ): KeyResult {
    return new KeyResult({
      uuid: existing.uuid,
      goalUuid: existing.goalUuid,
      name: updates.name ?? existing.name,
      description: updates.description ?? existing.description,
      startValue: updates.startValue ?? existing.startValue,
      targetValue: updates.targetValue ?? existing.targetValue,
      currentValue: updates.currentValue ?? existing.currentValue,
      unit: updates.unit ?? existing.unit,
      weight: updates.weight ?? existing.weight,
      calculationMethod: updates.calculationMethod ?? existing.calculationMethod,
      status: existing.lifecycle.status,
      createdAt: existing.lifecycle.createdAt,
      updatedAt: new Date(),
    });
  }
}
```

**目录结构**:
```
apps/api/src/modules/goal/
├── application/
│   └── services/
│       ├── GoalApplicationService.ts       # 应用服务（DTO 转换）
│       └── index.ts
├── domain/                                   # 领域层（使用 domain-server 包）
├── infrastructure/
│   └── repositories/
│       └── PrismaGoalRepository.ts          # 数据持久化
└── interface/
    └── http/
        └── controllers/
            └── GoalController.ts            # HTTP 控制器
```

### Phase 2: 更新 HTTP 控制器 ⏳

**文件**: `apps/api/src/modules/goal/interface/http/controllers/GoalController.ts`

**需要修改**:
- 注入 `GoalApplicationService` 而不是直接使用仓储
- 控制器只负责 HTTP 层面的工作（请求验证、响应格式）
- 业务逻辑委托给应用服务

```typescript
@Controller('/api/goals')
export class GoalController {
  constructor(private goalApplicationService: GoalApplicationService) {}
  
  @Post()
  async createGoal(@Body() request: CreateGoalRequest, @Req() req) {
    return this.goalApplicationService.createGoal(request, req.context);
  }
  
  @Patch('/:uuid')
  async updateGoal(
    @Param('uuid') uuid: string,
    @Body() request: UpdateGoalRequest,
    @Req() req
  ) {
    return this.goalApplicationService.updateGoal(uuid, request, req.context);
  }
  
  @Get('/:uuid')
  async getGoal(@Param('uuid') uuid: string, @Req() req) {
    return this.goalApplicationService.getGoal(uuid, req.context);
  }
  
  @Get()
  async listGoals(@Query() query, @Req() req) {
    return this.goalApplicationService.listGoals(query, req.context);
  }
  
  @Delete('/:uuid')
  async deleteGoal(@Param('uuid') uuid: string, @Req() req) {
    return this.goalApplicationService.deleteGoal(uuid, req.context);
  }
}
```

### Phase 3: 实现 Domain-Client Goal 模块 ⏳

**目标**: 创建前端实体，支持客户端业务逻辑

**目录结构**:
```
packages/domain-client/src/goal/
├── entities/
│   ├── Goal.ts                    # 前端 Goal 实体
│   ├── KeyResult.ts               # 前端 KeyResult 实体
│   ├── GoalRecord.ts              # 前端 GoalRecord 实体
│   └── GoalReview.ts              # 前端 GoalReview 实体
├── services/
│   └── GoalService.ts             # 前端业务服务
└── types.ts                       # 前端特有类型
```

**Goal 实体示例**:
```typescript
// packages/domain-client/src/goal/entities/Goal.ts
export class Goal {
  private _uuid: string;
  private _name: string;
  private _keyResults: KeyResult[] = [];
  // ...
  
  /**
   * 创建新 Goal（前端）
   */
  static create(params: { name: string; ... }): Goal {
    return new Goal({
      uuid: generateUuid(),
      name: params.name,
      // ...
      keyResults: [],
    });
  }
  
  /**
   * 添加关键结果（前端）
   */
  addKeyResult(keyResult: KeyResult): void {
    if (this.getTotalWeight() + keyResult.weight > 100) {
      throw new Error('权重总和不能超过100%');
    }
    this._keyResults.push(keyResult);
  }
  
  /**
   * 更新基础信息（前端）
   */
  updateBasic(updates: {
    name?: string;
    description?: string;
    // ...
  }): void {
    if (updates.name) this._name = updates.name;
    // ...
  }
  
  /**
   * 转换为 DTO（传输到后端）
   */
  toDTO(): GoalDTO {
    return {
      uuid: this._uuid,
      name: this._name,
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

### Phase 4: 更新 Web 端使用 Domain-Client ⏳

**目标**: 修改 Web 端使用新的前端实体

**需要修改的文件**:
- `apps/web/src/modules/goal/components/*` - 使用 Goal 实体而不是直接操作 DTO
- `apps/web/src/modules/goal/services/goalApi.ts` - API 调用使用实体的 toDTO() 方法

**示例**:
```typescript
// apps/web/src/modules/goal/components/GoalForm.tsx
import { Goal, KeyResult } from '@dailyuse/domain-client/goal';

const GoalForm = () => {
  const [goal, setGoal] = useState(Goal.create({
    name: "新目标",
    // ...
  }));
  
  const handleAddKeyResult = () => {
    const keyResult = KeyResult.create({
      name: "新关键结果",
      targetValue: 100,
      unit: "%",
      weight: 50,
    });
    
    goal.addKeyResult(keyResult);
    setGoal(goal.clone()); // 触发更新
  };
  
  const handleSubmit = async () => {
    // 转换为 DTO 发送到后端
    await goalApi.create(goal.toDTO());
  };
  
  // ...
};
```

### Phase 5: 更新测试用例 ⏳

**需要修改**:
- 单元测试：测试 Goal、KeyResult 等实体的业务逻辑
- 集成测试：测试应用服务的 DTO 转换逻辑
- E2E 测试：测试完整的数据流转

## 📊 当前状态总结

### ✅ 已完成 (40%)
- Domain-Server Goal 聚合根重构（通用更新方法、子实体操作）
- Contracts DTO 定义更新（UpdateGoalRequest 支持增量更新）
- JSON 解析错误修复（safeJsonParse 工具）
- DDD 架构设计文档

### 🚧 进行中 (0%)
- API 应用层服务实现

### ⏳ 待开始 (60%)
- HTTP 控制器更新
- Domain-Client Goal 模块实现
- Web 端集成
- 测试用例更新

## 🎯 下一步行动

1. **立即开始**: 实现 `GoalApplicationService`
2. **关键原则**: DTO 转换在应用层，领域层只处理实体
3. **验证方式**: 确保整个数据流 client → DTO → server → database 畅通
4. **测试覆盖**: 确保 38/38 集成测试通过

---

**最后更新**: 2025-01-02
**负责人**: AI Agent
**状态**: Phase 1 已完成，准备进入 Phase 2