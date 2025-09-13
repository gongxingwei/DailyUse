# DDD聚合根控制模式实现指南

## 概述

本文档展示了在 DailyUse 项目中如何实现 DDD（领域驱动设计）聚合根控制模式，通过 Goal 聚合根控制 KeyResult、GoalRecord、GoalReview 等子实体的完整解决方案。

## 实现层次

### 1. 领域层（Domain Layer）

#### 聚合根实体 - Goal.ts

```typescript
// packages/domain-client/src/goal/aggregates/Goal.ts

export class Goal extends GoalCore {
  // ===== DDD聚合根控制模式 - 子实体管理 =====

  /**
   * 创建并添加关键结果
   * 聚合根控制：确保关键结果属于当前目标，维护权重总和不超过100%
   */
  createKeyResult(keyResultData: {
    name: string;
    weight: number;
    // ... 其他属性
  }): string {
    // 业务规则验证
    if (!keyResultData.name.trim()) {
      throw new Error('关键结果名称不能为空');
    }
    
    // 检查权重限制
    const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight + keyResultData.weight > 100) {
      throw new Error(`关键结果权重总和不能超过100%，当前总和: ${totalWeight}%`);
    }

    // 创建关键结果并发布领域事件
    const keyResultUuid = this.generateUUID();
    const newKeyResult = { /* ... */ };
    this.addKeyResult(newKeyResult);
    this.publishDomainEvent('KeyResultCreated', { /* ... */ });

    return keyResultUuid;
  }

  /**
   * 更新关键结果
   * 聚合根控制：验证关键结果属于当前目标，维护业务规则
   */
  updateKeyResult(keyResultUuid: string, updates: { /* ... */ }): void {
    // 业务规则验证和更新逻辑
  }

  /**
   * 删除关键结果
   * 聚合根控制：确保数据一致性，级联删除相关记录
   */
  removeKeyResult(keyResultUuid: string): void {
    // 级联删除和一致性维护
  }
}
```

**核心原则体现：**
- ✅ **封装性** - 外部无法直接修改子实体
- ✅ **一致性** - 所有变更都通过聚合根验证
- ✅ **完整性** - 业务规则在聚合根层面统一执行
- ✅ **事件驱动** - 发布领域事件通知其他模块

### 2. 应用层（Application Layer）

#### 聚合根服务 - goalAggregateService.ts

```typescript
// apps/api/src/modules/goal/application/services/goalAggregateService.ts

export class GoalAggregateService {
  /**
   * 通过聚合根创建关键结果
   * 体现DDD原则：只能通过Goal聚合根创建KeyResult
   */
  async createKeyResultForGoal(
    accountUuid: string,
    goalUuid: string,
    request: { /* ... */ }
  ): Promise<GoalContracts.KeyResultResponse> {
    // 1. 获取聚合根
    const goalDTO = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);
    
    // 2. 转换为领域实体（聚合根）
    const goal = Goal.fromDTO(goalDTO);

    // 3. 通过聚合根创建关键结果（业务规则验证在这里）
    const keyResultUuid = goal.createKeyResult(request);

    // 4. 持久化更改
    const savedKeyResult = await this.goalRepository.createKeyResult(/* ... */);

    // 5. 更新Goal的版本号
    await this.goalRepository.updateGoal(accountUuid, goalUuid, {
      version: goal.version,
      lifecycle: { updatedAt: Date.now() }
    });

    return /* 响应数据 */;
  }
}
```

**应用层职责：**
- 🔄 **协调** - 协调领域对象和基础设施
- 💾 **持久化** - 将聚合根状态保存到仓储
- 🔒 **事务** - 确保操作的原子性
- 📊 **转换** - DTO 与领域实体之间的转换

### 3. 接口层（Interface Layer）

#### 聚合根控制器 - GoalAggregateController.ts

```typescript
// apps/api/src/modules/goal/interface/http/controllers/GoalAggregateController.ts

export class GoalAggregateController {
  /**
   * 通过Goal聚合根创建关键结果
   * POST /api/v1/goals/:goalId/key-results
   */
  static async createKeyResult(req: Request, res: Response) {
    try {
      const accountUuid = GoalAggregateController.extractAccountUuid(req);
      const { goalId } = req.params;
      const request = req.body;

      const keyResult = await GoalAggregateController.goalService.createKeyResult(
        accountUuid,
        goalId,
        request
      );

      res.status(201).json({
        success: true,
        data: keyResult,
        message: 'Key result created successfully through goal aggregate',
      });
    } catch (error) {
      // 错误处理
    }
  }
}
```

#### REST API 路由设计

```typescript
// apps/api/src/modules/goal/interface/http/routes/goalAggregateRoutes.ts

// ===== 体现聚合根控制的路由设计 =====

// ❌ 传统设计 - 直接操作子实体
POST /api/v1/key-results
PUT /api/v1/key-results/:id
DELETE /api/v1/key-results/:id

// ✅ DDD设计 - 通过聚合根操作
POST /api/v1/goals/:goalId/key-results
PUT /api/v1/goals/:goalId/key-results/:keyResultId
DELETE /api/v1/goals/:goalId/key-results/:keyResultId

// ✅ 聚合根完整视图
GET /api/v1/goals/:goalId/aggregate

// ✅ 聚合根批量操作
PUT /api/v1/goals/:goalId/key-results/batch-weight
POST /api/v1/goals/:goalId/clone
```

**路由设计体现的DDD原则：**
- 🏗️ **聚合边界** - URL层次结构体现聚合边界
- 🛡️ **业务规则** - 通过聚合根强制执行业务规则
- 📋 **完整视图** - 提供聚合根的统一数据视图
- ⚛️ **原子操作** - 批量操作保证一致性

### 4. 基础设施层（Infrastructure Layer）

#### 仓储接口扩展 - iGoalRepository.ts

```typescript
// packages/domain-server/src/goal/repositories/iGoalRepository.ts

export interface IGoalRepository {
  // ===== 传统CRUD方法 =====
  createGoal(/*...*/): Promise<GoalDTO>;
  getGoalByUuid(/*...*/): Promise<GoalDTO | null>;
  
  // ===== DDD聚合根控制方法 =====
  
  /**
   * 加载完整的Goal聚合根
   * 包含目标、关键结果、记录、复盘等所有子实体
   */
  loadGoalAggregate(
    accountUuid: string,
    goalUuid: string,
  ): Promise<{
    goal: GoalDTO;
    keyResults: KeyResultDTO[];
    records: GoalRecordDTO[];
    reviews: GoalReviewDTO[];
  } | null>;

  /**
   * 原子性更新Goal聚合根
   * 在一个事务中更新目标及其所有子实体
   */
  updateGoalAggregate(
    accountUuid: string,
    aggregateData: { /* ... */ }
  ): Promise<{ /* ... */ }>;

  /**
   * 验证聚合根业务规则
   */
  validateGoalAggregateRules(
    accountUuid: string,
    goalUuid: string,
    proposedChanges: { /* ... */ }
  ): Promise<{
    isValid: boolean;
    violations: Array<{ /* ... */ }>;
  }>;

  /**
   * 级联删除Goal聚合根
   */
  cascadeDeleteGoalAggregate(
    accountUuid: string,
    goalUuid: string,
  ): Promise<{ /* ... */ }>;
}
```

## API使用示例

### 1. 创建关键结果（通过聚合根）

```bash
# ✅ DDD方式 - 通过Goal聚合根创建
POST /api/v1/goals/goal-123/key-results
Content-Type: application/json
Authorization: Bearer jwt-token

{
  "name": "增加用户活跃度",
  "description": "通过功能优化提升用户活跃度",
  "startValue": 0,
  "targetValue": 80,
  "currentValue": 45,
  "unit": "%",
  "weight": 30,
  "calculationMethod": "average"
}

# 响应
{
  "success": true,
  "data": {
    "uuid": "kr-456",
    "goalUuid": "goal-123",
    "name": "增加用户活跃度",
    "weight": 30,
    "progress": 56.25,
    "lifecycle": { /* ... */ }
  },
  "message": "Key result created successfully through goal aggregate"
}
```

### 2. 获取聚合根完整视图

```bash
# 获取Goal及其所有子实体
GET /api/v1/goals/goal-123/aggregate
Authorization: Bearer jwt-token

# 响应
{
  "success": true,
  "data": {
    "goal": {
      "uuid": "goal-123",
      "name": "2024年用户增长目标",
      "progress": 68.5,
      /* ... */
    },
    "keyResults": [
      {
        "uuid": "kr-456",
        "name": "增加用户活跃度",
        "weight": 30,
        "progress": 56.25,
        /* ... */
      }
    ],
    "recentRecords": [
      {
        "uuid": "record-789",
        "value": 45,
        "note": "本周通过新功能上线提升活跃度",
        /* ... */
      }
    ],
    "reviews": [
      {
        "uuid": "review-101",
        "title": "Q1季度复盘",
        "type": "monthly",
        /* ... */
      }
    ]
  }
}
```

### 3. 批量更新关键结果权重

```bash
# 通过聚合根批量更新（保证权重总和不超过100%）
PUT /api/v1/goals/goal-123/key-results/batch-weight
Content-Type: application/json
Authorization: Bearer jwt-token

{
  "keyResults": [
    { "uuid": "kr-1", "weight": 40 },
    { "uuid": "kr-2", "weight": 35 },
    { "uuid": "kr-3", "weight": 25 }
  ]
}
```

### 4. 复制聚合根

```bash
# 复制Goal及其所有关键结果
POST /api/v1/goals/goal-123/clone
Content-Type: application/json
Authorization: Bearer jwt-token

{
  "newName": "2024年Q2用户增长目标",
  "newDescription": "基于Q1经验制定的新目标"
}
```

## 业务规则保护

### 1. 权重控制验证

```typescript
// 在聚合根中验证
const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
if (totalWeight + newWeight > 100) {
  throw new Error(`关键结果权重总和不能超过100%，当前总和: ${totalWeight}%`);
}
```

### 2. 数据一致性保护

```typescript
// 删除关键结果时级联删除相关记录
goal.removeKeyResult(keyResultUuid);
// 自动处理：
// - 删除关键结果
// - 级联删除相关记录
// - 更新聚合版本
// - 发布领域事件
```

### 3. 版本控制

```typescript
// 乐观锁机制防止并发冲突
await this.goalRepository.updateGoalVersion(
  accountUuid, 
  goalUuid, 
  expectedVersion, 
  newVersion
);
```

## 与传统CRUD的对比

| 方面 | 传统CRUD | DDD聚合根控制 |
|------|----------|---------------|
| **数据操作** | 直接操作子实体 | 通过聚合根操作 |
| **业务规则** | 分散在各处 | 集中在聚合根 |
| **数据一致性** | 依赖数据库约束 | 领域层保证 |
| **路由设计** | `PUT /key-results/:id` | `PUT /goals/:goalId/key-results/:id` |
| **错误处理** | 技术性错误 | 业务性错误 |
| **测试复杂度** | 需要数据库集成测试 | 可以纯领域逻辑测试 |

## 优势总结

### 1. 业务规则集中化
- 所有关于Goal聚合的业务规则都在Goal实体中
- 避免业务逻辑泄漏到应用层或基础设施层

### 2. 数据一致性保证
- 通过聚合根确保所有子实体的数据一致性
- 原子性操作保证聚合的完整性

### 3. 更好的封装性
- 外部代码无法绕过业务规则直接修改子实体
- 明确的聚合边界和职责划分

### 4. 领域事件驱动
- 所有重要的业务变更都会发布领域事件
- 便于其他模块响应和扩展

### 5. 可维护性提升
- 业务逻辑变更只需要修改聚合根
- 清晰的依赖关系和数据流向

### 6. 更符合现实业务
- 反映真实世界中的业务关系
- 更直观的API设计和使用方式

## 实施建议

### 1. 渐进式迁移
- 保留原有CRUD接口作为向后兼容
- 新功能优先使用聚合根控制模式
- 逐步迁移现有代码

### 2. 团队培训
- 确保团队理解DDD概念
- 统一编码规范和最佳实践
- 建立代码评审标准

### 3. 监控和优化
- 监控聚合根操作的性能
- 优化数据加载和持久化策略
- 建立完善的错误处理机制

这样的实现充分体现了DDD聚合根控制模式的核心思想，通过聚合根统一管理子实体，确保业务规则的一致性和数据的完整性。
