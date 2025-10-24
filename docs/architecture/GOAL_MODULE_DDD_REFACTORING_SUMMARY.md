# Goal 模块 DDD 架构重构总结

## 重构目标

按照 DDD 规范重构 Goal 模块的领域服务和应用服务，遵循以下原则：

1. **DomainService 不持久化**：领域服务只负责创建聚合根和业务逻辑，不调用 Repository
2. **ApplicationService 负责持久化**：应用服务负责查询、持久化和事务管理
3. **职责清晰分离**：领域层纯粹，应用层编排

## 重构内容

### 1. GoalDomainService 重构

**文件**: `packages/domain-server/src/goal/services/GoalDomainService.ts`

#### 关键变更

**之前（反模式）**：

```typescript
export class GoalDomainService {
  constructor(private readonly goalRepository: IGoalRepository) {} // ❌ 注入仓储

  public async createGoal(params): Promise<Goal> {
    // ❌ 直接查询数据库
    if (params.parentGoalUuid) {
      const parentGoal = await this.goalRepository.findById(params.parentGoalUuid);
    }

    const goal = Goal.create(params);

    // ❌ 直接持久化
    await this.goalRepository.save(goal);

    return goal;
  }

  // ❌ 更多查询和持久化方法...
}
```

**现在（正确）**：

```typescript
export class GoalDomainService {
  constructor() {
    // ✅ 不注入仓储
  }

  /**
   * 创建目标聚合根
   * @param parentGoal 由 ApplicationService 查询后传入
   * @returns 未持久化的聚合根
   */
  public createGoal(
    params: {
      /* ... */
    },
    parentGoal?: Goal, // ✅ 由 ApplicationService 传入
  ): Goal {
    // 1. 验证标题
    this.validateGoalTitle(params.title);

    // 2. 验证日期范围
    this.validateGoalDateRange(params.startDate, params.targetDate);

    // 3. 验证父目标（复杂业务规则）
    if (parentGoal) {
      if (parentGoal.status === GoalStatus.ARCHIVED) {
        throw new Error('Cannot create sub-goal under an archived goal');
      }
    }

    // 4. 创建聚合根
    const goal = Goal.create(params);

    // 5. 返回聚合根（不持久化）
    return goal;
  }

  /**
   * 更新目标基本信息
   * @param goal 由 ApplicationService 查询后传入
   */
  public updateGoalBasicInfo(
    goal: Goal,
    params: {
      /* ... */
    },
  ): void {
    // 验证状态
    if (goal.deletedAt !== null && goal.deletedAt !== undefined) {
      throw new Error('Cannot update a deleted goal');
    }

    // 调用聚合根方法
    goal.updateBasicInfo(params);
  }
}
```

#### 新增方法

- `createGoal(params, parentGoal)`: 创建目标（不持久化）
- `updateGoalBasicInfo(goal, params)`: 更新基本信息
- `addKeyResultToGoal(goal, params)`: 添加关键结果
- `updateKeyResultProgress(goal, keyResultUuid, currentValue, note)`: 更新关键结果进度
- `addReviewToGoal(goal, params)`: 添加目标回顾
- `validateGoalTitle(title)`: 验证标题（私有）
- `validateGoalDateRange(startDate, targetDate)`: 验证日期范围（私有）

#### 删除的方法

- ❌ `getGoal()` - 移至 ApplicationService
- ❌ `getGoalsForAccount()` - 移至 ApplicationService
- ❌ `changeGoalStatus()` - 移至 ApplicationService
- ❌ `completeGoal()` - 移至 ApplicationService
- ❌ `archiveGoal()` - 移至 ApplicationService
- ❌ `deleteGoal()` - 移至 ApplicationService

---

### 2. GoalApplicationService 重构

**文件**: `apps/api/src/modules/goal/application/services/GoalApplicationService.ts`

#### 关键变更

**之前（紧耦合）**：

```typescript
export class GoalApplicationService {
  constructor(goalRepository: IGoalRepository) {
    this.domainService = new GoalDomainService(goalRepository); // ❌ 传递仓储给领域服务
    this.goalRepository = goalRepository;
  }

  async createGoal(params): Promise<GoalClientDTO> {
    // ❌ DomainService 内部持久化
    const goal = await this.domainService.createGoal(params);
    return goal.toClientDTO();
  }
}
```

**现在（正确分离）**：

```typescript
export class GoalApplicationService {
  constructor(goalRepository: IGoalRepository) {
    this.domainService = new GoalDomainService(); // ✅ 不传递仓储
    this.goalRepository = goalRepository;
  }

  async createGoal(params): Promise<GoalClientDTO> {
    // 1. 查询父目标（如果需要）
    let parentGoal: Goal | undefined;
    if (params.parentGoalUuid) {
      const found = await this.goalRepository.findById(params.parentGoalUuid);
      if (!found) {
        throw new Error(`Parent goal not found`);
      }
      parentGoal = found;
    }

    // 2. 委托领域服务创建聚合根（不持久化）
    const goal = this.domainService.createGoal(params, parentGoal);

    // 3. 持久化（ApplicationService 负责）
    await this.goalRepository.save(goal);

    // 4. 发布领域事件（未来实现）
    // await this.eventBus.publish(goal.getDomainEvents());

    // 5. 返回 ClientDTO
    return goal.toClientDTO();
  }

  async updateGoal(uuid, updates): Promise<GoalClientDTO> {
    // 1. 查询目标
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    // 2. 委托领域服务更新（业务逻辑）
    this.domainService.updateGoalBasicInfo(goal, updates);

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 返回 ClientDTO
    return goal.toClientDTO();
  }
}
```

#### 新增/优化方法

**CRUD 操作**:

- `createGoal()`: 创建目标（查询父目标 → 领域服务 → 持久化）
- `getGoal()`: 获取单个目标
- `getUserGoals()`: 获取用户所有目标
- `updateGoal()`: 更新目标（查询 → 领域服务 → 持久化）
- `deleteGoal()`: 软删除目标
- `archiveGoal()`: 归档目标
- `activateGoal()`: 激活目标 ✨ 新增
- `completeGoal()`: 完成目标

**KeyResult 管理**:

- `addKeyResult()`: 添加关键结果
- `updateKeyResultProgress()`: 更新关键结果进度
- `deleteKeyResult()`: 删除关键结果 ✨ 新增

**GoalReview 管理**:

- `addReview()`: 添加目标回顾

**查询操作**:

- `searchGoals()`: 搜索目标
- `getGoalStatistics()`: 获取统计数据

---

## 架构对比

### 之前的错误架构

```
┌─────────────────────────────┐
│  GoalApplicationService     │
│  (应用服务)                  │
└──────────┬──────────────────┘
           │ 委托
           ↓
┌─────────────────────────────┐
│  GoalDomainService          │
│  (领域服务)                  │
│  - 注入 IGoalRepository ❌  │
│  - 直接查询数据库 ❌         │
│  - 直接持久化 ❌             │
└──────────┬──────────────────┘
           │ 调用
           ↓
┌─────────────────────────────┐
│  IGoalRepository            │
│  (仓储接口)                  │
└─────────────────────────────┘
```

**问题**:

1. 领域服务依赖基础设施层（仓储）
2. 业务逻辑和持久化混在一起
3. 违反 DDD 分层原则

---

### 现在的正确架构

```
┌─────────────────────────────────────────┐
│  GoalApplicationService                 │
│  (应用服务)                              │
│  - 查询聚合根（通过 Repository）         │
│  - 调用 DomainService 处理业务逻辑      │
│  - 持久化聚合根（通过 Repository）       │
│  - 发布领域事件                          │
│  - DTO 转换                              │
└──────┬──────────────────┬───────────────┘
       │                  │
       │ 委托             │ 查询/持久化
       ↓                  ↓
┌──────────────────┐  ┌──────────────────┐
│ GoalDomainService│  │ IGoalRepository  │
│ (领域服务)        │  │ (仓储接口)        │
│ - 不注入仓储 ✅   │  │                  │
│ - 接收聚合根参数  │  └──────────────────┘
│ - 只处理业务逻辑  │
│ - 调用聚合根方法  │
└──────┬───────────┘
       │ 调用
       ↓
┌──────────────────┐
│  Goal Aggregate  │
│  (聚合根)         │
└──────────────────┘
```

**优点**:

1. ✅ 领域服务纯粹，不依赖基础设施
2. ✅ 职责清晰分离
3. ✅ 符合 DDD 分层原则
4. ✅ 易于测试（DomainService 不需要 Mock Repository）

---

## 数据流示例

### 创建目标流程

```typescript
// 1. Controller 接收请求
GoalController.createGoal(req, res)
  ↓
// 2. ApplicationService 查询父目标
const parentGoal = await goalRepository.findById(params.parentGoalUuid)
  ↓
// 3. DomainService 创建聚合根（验证业务规则）
const goal = domainService.createGoal(params, parentGoal)
  ↓
// 4. ApplicationService 持久化
await goalRepository.save(goal)
  ↓
// 5. 返回 ClientDTO
return goal.toClientDTO()
```

### 更新目标流程

```typescript
// 1. Controller 接收请求
GoalController.updateGoal(req, res)
  ↓
// 2. ApplicationService 查询目标
const goal = await goalRepository.findById(uuid)
  ↓
// 3. DomainService 更新聚合根（验证业务规则）
domainService.updateGoalBasicInfo(goal, updates)
  ↓
// 4. ApplicationService 持久化
await goalRepository.save(goal)
  ↓
// 5. 返回 ClientDTO
return goal.toClientDTO()
```

---

## 验证清单

- [x] **DomainService 不注入 Repository** ✅
- [x] **DomainService 不调用 Repository 方法** ✅
- [x] **DomainService 接收聚合根作为参数** ✅
- [x] **ApplicationService 负责查询和持久化** ✅
- [x] **ApplicationService 返回 ClientDTO** ✅
- [x] **TypeScript 编译通过** ✅ (`pnpm tsc --noEmit`)
- [ ] **数据库迁移**（待 PostgreSQL 启动后执行）

---

## 遗留问题

### 1. GoalController 需要更新

当前 `GoalController` 的方法签名可能需要调整以匹配新的 ApplicationService API。

**需要检查的方法**:

- `createGoal()` - 确保参数映射正确
- `updateGoal()` - 确保 `name` → `title` 字段映射
- `updateGoalStatus()` - 可能已废弃，改用 `activateGoal()`, `archiveGoal()`, `completeGoal()`

### 2. 统计功能未实现

`getGoalStatistics()` 方法返回模拟数据。

**建议实现方式**:

1. 创建 `GoalStatisticsDomainService`（类似 RepositoryStatisticsDomainService）
2. 在 Repository 添加聚合查询方法（如 `countByStatus()`, `countByImportance()`）
3. 使用 Prisma 聚合查询优化性能

### 3. 事件发布未实现

代码中预留了事件发布位置（注释掉）。

**未来需要**:

1. 实现 EventBus（可以使用现有的 `@dailyuse/utils` 的 EventManager）
2. 在 ApplicationService 中发布领域事件
3. 注册事件监听器（如发送通知、更新统计等）

---

## 参考文档

- [DDD 领域服务最佳实践](../../../docs/architecture/DOMAIN_SERVICE_BEST_PRACTICES.md)
- [全栈工程师 AI 助手核心指令](./.github/prompts/fullstack.prompt.md)
- [Repository 模块参考](./apps/api/src/modules/repository/)

---

## 更新日期

2025-01-XX

## 作者

GitHub Copilot + 用户协作完成
