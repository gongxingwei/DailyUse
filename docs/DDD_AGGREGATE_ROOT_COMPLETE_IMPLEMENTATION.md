# DDD聚合根完整业务方法实现指南

## 🎯 实现背景

在DDD架构中，**聚合根是唯一对外暴露的业务实体**，负责控制聚合内所有子实体的生命周期和业务规则。我们刚刚在 `domain-server` 包的 `Goal` 聚合根中实现了完整的业务控制方法。

## ✅ 已实现的聚合根控制方法

### 🔧 抽象方法实现

#### 1. **必需的抽象方法**
```typescript
// 来自 GoalCore 的抽象方法
abstract addKeyResult(keyResult: IKeyResult): void;
abstract updateKeyResultProgress(keyResultUuid: string, increment: number, note?: string): void;
```

#### 2. **实体工厂方法**
```typescript
// 服务端特有的实体创建逻辑
protected createKeyResultEntity(dto: any): KeyResult;
protected createGoalRecordEntity(dto: any): GoalRecord;
```

### 🎯 KeyResult（关键结果）管理

#### 创建关键结果
```typescript
createKeyResult(keyResultData: {
  accountUuid: string;
  name: string;
  description?: string;
  startValue?: number;
  targetValue: number;
  currentValue?: number;
  unit: string;
  weight: number;
  calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
}): string
```

**业务规则保护**：
- ✅ 名称不能为空
- ✅ 权重在1-100%之间
- ✅ 权重总和不超过100%
- ✅ 自动生成UUID
- ✅ 发布 `KeyResultCreated` 领域事件

#### 更新关键结果
```typescript
updateKeyResult(keyResultUuid: string, updates: {
  name?: string;
  description?: string;
  targetValue?: number;
  unit?: string;
  weight?: number;
  calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
}): void
```

**业务规则保护**：
- ✅ 权重调整时验证总和不超过100%
- ✅ 创建新实体替换原实体（不可变性）
- ✅ 发布 `KeyResultUpdated` 领域事件

#### 删除关键结果
```typescript
removeKeyResult(keyResultUuid: string): void
```

**业务规则保护**：
- ✅ 级联删除相关的 GoalRecord
- ✅ 数据一致性保证
- ✅ 发布 `KeyResultRemoved` 领域事件，包含级联删除统计

#### 更新关键结果进度
```typescript
updateKeyResultProgress(keyResultUuid: string, increment: number, note?: string): void
```

**业务逻辑**：
- ✅ 更新关键结果当前值
- ✅ 自动创建 GoalRecord 记录进度
- ✅ 发布 `KeyResultProgressUpdated` 领域事件

### 📝 GoalRecord（目标记录）管理

#### 创建目标记录
```typescript
createRecord(recordData: { 
  accountUuid: string;
  keyResultUuid: string; 
  value: number; 
  note?: string 
}): string
```

**业务规则保护**：
- ✅ 验证关键结果存在
- ✅ 自动更新关键结果进度
- ✅ 发布 `GoalRecordCreated` 领域事件

#### 更新目标记录
```typescript
updateRecord(recordUuid: string, updates: { value?: number; note?: string }): void
```

**业务逻辑**：
- ✅ 使用实体业务方法更新
- ✅ 同步更新关键结果进度
- ✅ 发布 `GoalRecordUpdated` 领域事件

#### 删除目标记录
```typescript
removeRecord(recordUuid: string): void
```

### 📊 GoalReview（目标复盘）管理

#### 创建目标复盘
```typescript
createReview(reviewData: {
  title: string;
  type: 'weekly' | 'monthly' | 'midterm' | 'final' | 'custom';
  content: {
    achievements: string;
    challenges: string;
    learnings: string;
    nextSteps: string;
    adjustments?: string;
  };
  rating: {
    progressSatisfaction: number;
    executionEfficiency: number;
    goalReasonableness: number;
  };
  reviewDate?: Date;
}): string
```

**业务规则保护**：
- ✅ 标题不能为空
- ✅ 评分在1-10之间
- ✅ 自动生成状态快照
- ✅ 发布 `GoalReviewCreated` 领域事件

#### 更新目标复盘
```typescript
updateReview(reviewUuid: string, updates: {
  title?: string;
  content?: Partial<IGoalReview['content']>;
  rating?: Partial<IGoalReview['rating']>;
}): void
```

#### 删除目标复盘
```typescript
removeReview(reviewUuid: string): void
```

### 🚀 Goal（目标）状态管理

#### 状态转换方法
```typescript
pause(): void       // 暂停目标
activate(): void    // 激活目标
complete(): void    // 完成目标
archive(): void     // 归档目标
delete(): void      // 删除目标（只能删除已归档的）
```

**状态转换规则**：
- ✅ 已完成的目标不能暂停或重新激活
- ✅ 已归档的目标不能暂停或完成
- ✅ 只有已归档的目标可以删除
- ✅ 每次状态变更都发布相应的领域事件

## 🏗️ 架构设计原则

### 1. **聚合根完全控制**
- ❌ **禁止直接操作子实体** - 外部不能直接创建、修改 KeyResult
- ✅ **通过聚合根操作** - 所有子实体操作必须通过 Goal 聚合根

### 2. **业务规则集中化**
- ✅ **权重控制** - 在聚合根层面控制权重总和
- ✅ **数据一致性** - 级联删除和更新保证数据完整性
- ✅ **状态管理** - 目标状态转换的业务规则

### 3. **事件驱动架构**
- ✅ **领域事件** - 每个重要操作都发布领域事件
- ✅ **解耦通信** - 通过事件与其他模块通信
- ✅ **审计跟踪** - 事件记录业务操作历史

### 4. **不可变性原则**
- ✅ **实体替换** - 更新时创建新实体替换旧实体
- ✅ **版本控制** - 每次变更更新聚合版本
- ✅ **并发控制** - 乐观锁机制防止冲突

## 🔄 与其他层的配合

### API层调用模式
```typescript
// apps/api/src/modules/goal/application/services/goalAggregateService.ts
export class GoalAggregateService {
  async createKeyResultForGoal(
    accountUuid: string,
    goalUuid: string,
    request: CreateKeyResultRequest,
  ): Promise<KeyResultResponse> {
    // 1. 获取聚合根
    const goalData = await this.goalRepository.loadGoalAggregate(accountUuid, goalUuid);
    const goal = Goal.fromDTO(goalData.goal);

    // 2. 通过聚合根创建关键结果
    const keyResultUuid = goal.createKeyResult({
      accountUuid,
      name: request.name,
      targetValue: request.targetValue,
      unit: request.unit,
      weight: request.weight,
    });

    // 3. 持久化聚合
    await this.goalRepository.updateGoalAggregate(accountUuid, {
      goal: goal.toDTO(),
      keyResults: goal.keyResults.map(kr => kr.toDTO()),
    });

    return { uuid: keyResultUuid, /* 其他响应数据 */ };
  }
}
```

### 仓储层支持
```typescript
// packages/domain-server/src/goal/repositories/iGoalRepository.ts
export interface IGoalRepository {
  // 聚合根特有方法
  loadGoalAggregate(accountUuid: string, goalUuid: string): Promise<GoalAggregateData>;
  updateGoalAggregate(accountUuid: string, changes: AggregateChanges): Promise<void>;
  validateGoalAggregateRules(accountUuid: string, goalUuid: string, changes: any): Promise<ValidationResult>;
}
```

## 🎉 实现收益

### 1. **业务完整性**
- ✅ 所有关键结果、记录、复盘的CRUD操作
- ✅ 完整的业务规则保护
- ✅ 状态转换的生命周期管理

### 2. **代码质量**
- ✅ **单一职责** - 每个方法专注特定业务操作
- ✅ **类型安全** - 完整的TypeScript类型检查
- ✅ **易于测试** - 纯领域逻辑，容易单元测试

### 3. **架构优势**
- ✅ **符合DDD原则** - 真正的聚合根控制模式
- ✅ **事件驱动** - 完整的领域事件发布
- ✅ **扩展性强** - 易于添加新的业务方法

### 4. **开发效率**
- ✅ **API层简化** - 应用服务只需协调，不包含业务逻辑
- ✅ **业务集中** - 所有Goal相关业务逻辑在一个地方
- ✅ **维护性高** - 修改业务规则只需更新聚合根

## 📋 使用检查清单

在实现其他聚合根时，可以参考这个模式：

### ✅ 必实现方法
- [ ] 实现所有抽象方法
- [ ] 为每个子实体提供 create/update/remove 方法
- [ ] 实现实体工厂方法
- [ ] 添加业务规则验证
- [ ] 发布适当的领域事件

### ✅ 业务规则保护
- [ ] 数据验证（非空、范围检查等）
- [ ] 业务约束（如权重总和限制）
- [ ] 状态转换规则
- [ ] 级联操作处理

### ✅ 事件发布
- [ ] 创建事件：`EntityCreated`
- [ ] 更新事件：`EntityUpdated`
- [ ] 删除事件：`EntityRemoved`
- [ ] 状态变更事件：`EntityStatusChanged`

### ✅ 技术实现
- [ ] UUID生成
- [ ] 版本控制
- [ ] 时间戳管理
- [ ] 错误处理

这个实现为其他聚合根提供了标准模式，确保整个系统的一致性和可维护性！🚀
