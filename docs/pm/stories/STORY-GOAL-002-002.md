# STORY-GOAL-002-002: KR 权重快照 - Application Service

> **Story ID**: STORY-GOAL-002-002  
> **Epic**: EPIC-GOAL-002 - KR 权重快照  
> **Sprint**: Sprint 6  
> **Story Points**: 3 SP  
> **优先级**: P0 (Must Have)  
> **负责人**: Backend Developer  
> **状态**: To Do  
> **创建日期**: 2025-10-24  
> **Week**: Week 1 Day 3 (2025-11-07)

---

## 📖 User Story

**作为** 后端开发者  
**我想要** 实现权重快照的应用服务层逻辑  
**以便于** 提供完整的权重变更记录和查询功能

---

## 🎯 验收标准 (Acceptance Criteria)

### Scenario 1: 创建 WeightSnapshotApplicationService

```gherkin
Scenario: 实现创建快照方法
  Given WeightSnapshotApplicationService 已创建
  When 调用 createSnapshot() 方法
  Then 应该验证 Goal 和 KR 存在
  And 应该创建 KeyResultWeightSnapshot 实例
  And 应该保存快照到仓储
  And 应该返回创建的快照

  Examples:
  | goalUuid | krUuid | oldWeight | newWeight | trigger | Result     |
  | valid-id | kr-id  | 30        | 50        | manual  | Success    |
  | invalid  | kr-id  | 30        | 50        | manual  | GoalNotFound |
```

### Scenario 2: 实现权重总和校验

```gherkin
Scenario: 校验所有 KR 权重总和 = 100%
  Given 一个 Goal 有多个 KeyResults
  When 调用 validateWeightSum() 方法
  Then 应该计算所有 KR 的权重总和
  And 如果总和 = 100 则返回 true
  And 如果总和 ≠ 100 则返回 false

  Examples:
  | KR1 Weight | KR2 Weight | KR3 Weight | Total | Valid |
  | 30         | 40         | 30         | 100   | true  |
  | 25         | 40         | 30         | 95    | false |
  | 35         | 40         | 30         | 105   | false |
```

### Scenario 3: 集成到 UpdateKeyResult 流程

```gherkin
Scenario: 更新 KR 权重时自动创建快照
  Given 用户想要更新 KR 权重
  When 调用 UpdateKeyResultService.updateWeight()
  Then 应该获取 KR 当前权重（oldWeight）
  And 应该调用 WeightSnapshotApplicationService.createSnapshot()
  And 应该更新 KR 权重为新值
  And 应该校验所有 KR 权重总和 = 100%
  And 如果总和 ≠ 100 则抛出 InvalidWeightSumError
  And 应该保存 Goal 聚合根

Scenario: 权重总和校验失败时回滚
  Given 更新 KR 权重导致总和 ≠ 100
  When 权重总和校验失败
  Then 应该回滚权重变更
  And 应该删除刚创建的快照
  And 应该抛出 InvalidWeightSumError
```

### Scenario 4: 实现查询快照列表

```gherkin
Scenario: 查询 Goal 的所有权重快照
  Given 一个 Goal 有多个权重快照
  When 调用 getSnapshotsByGoal(goalUuid) 方法
  Then 应该返回该 Goal 的所有快照
  And 应该按时间倒序排列（最新的在前）
  And 应该支持分页参数 (page, pageSize)

Scenario: 查询特定 KR 的权重快照
  Given 一个 KeyResult 有多个权重快照
  When 调用 getSnapshotsByKeyResult(krUuid) 方法
  Then 应该返回该 KR 的所有快照
  And 应该按时间倒序排列

Scenario: 查询特定时间范围的快照
  Given 需要查看某段时间内的权重变更
  When 调用 getSnapshotsByTimeRange(startTime, endTime) 方法
  Then 应该返回该时间范围内的所有快照
  And 应该按时间排序
```

### Scenario 5: 编写单元测试和集成测试

```gherkin
Scenario: 测试 createSnapshot 方法
  Given WeightSnapshotApplicationService 实例
  When 调用 createSnapshot() 使用有效数据
  Then 应该成功创建快照
  And Repository.save() 应该被调用一次

Scenario: 测试 Goal 不存在场景
  Given Goal UUID 无效
  When 调用 createSnapshot()
  Then 应该抛出 GoalNotFoundError

Scenario: 测试权重总和校验
  Given 一个 Goal 有 3 个 KRs: [30, 40, 30]
  When 调用 validateWeightSum()
  Then 应该返回 true

  Given 一个 Goal 有 3 个 KRs: [30, 40, 25]
  When 调用 validateWeightSum()
  Then 应该返回 false

Scenario: 集成测试 - 完整权重更新流程
  Given 一个完整的 Goal 聚合根
  When 更新 KR 权重从 30 到 40
  Then 应该创建快照记录
  And 应该更新 KR 权重
  And 应该保存到数据库
  And 可以查询到新创建的快照
```

---

## 📋 任务清单 (Task Breakdown)

### Application Service 任务

- [ ] **Task 1.1**: 创建 `apps/api/src/application/goal/WeightSnapshotApplicationService.ts`
  - [ ] 定义类结构和依赖注入
  - [ ] 注入 GoalRepository 和 WeightSnapshotRepository
  - [ ] 添加 JSDoc 注释

- [ ] **Task 1.2**: 实现 `createSnapshot()` 方法
  - [ ] 验证 Goal 存在性
  - [ ] 验证 KR 存在性
  - [ ] 创建 KeyResultWeightSnapshot 实例
  - [ ] 调用 Repository.save()
  - [ ] 返回创建的快照

- [ ] **Task 1.3**: 实现 `validateWeightSum()` 方法
  - [ ] 从 GoalRepository 获取 Goal
  - [ ] 计算所有 KR 的权重总和
  - [ ] 返回是否等于 100

- [ ] **Task 1.4**: 实现查询方法
  - [ ] `getSnapshotsByGoal(goalUuid, page, pageSize)`
  - [ ] `getSnapshotsByKeyResult(krUuid, page, pageSize)`
  - [ ] `getSnapshotsByTimeRange(startTime, endTime, page, pageSize)`
  - [ ] 所有查询按时间倒序排列

### 集成到现有服务

- [ ] **Task 2.1**: 更新 `UpdateKeyResultService.ts`
  - [ ] 注入 WeightSnapshotApplicationService
  - [ ] 在 updateWeight() 方法中添加快照逻辑
  - [ ] 实现事务处理（快照 + 权重更新 + 总和校验）
  - [ ] 添加错误处理和回滚逻辑

- [ ] **Task 2.2**: 创建 `InvalidWeightSumError` 错误类
  - [ ] 继承 ApplicationError
  - [ ] 包含详细的权重信息和 Goal UUID

### 测试任务

- [ ] **Task 3.1**: 编写单元测试
  - [ ] 创建 `__tests__/WeightSnapshotApplicationService.test.ts`
  - [ ] 测试 createSnapshot() 成功场景
  - [ ] 测试 Goal 不存在场景
  - [ ] 测试 KR 不存在场景
  - [ ] 测试 validateWeightSum() 各种场景
  - [ ] 测试查询方法（分页、排序）

- [ ] **Task 3.2**: 编写集成测试
  - [ ] 创建 `__tests__/UpdateKeyResultWeight.integration.test.ts`
  - [ ] 测试完整权重更新流程
  - [ ] 测试权重总和校验失败场景
  - [ ] 测试事务回滚
  - [ ] 测试并发更新场景

---

## 🔧 技术实现细节

### WeightSnapshotApplicationService 代码示例

**apps/api/src/application/goal/WeightSnapshotApplicationService.ts**:

```typescript
import type { GoalRepository } from '../../domain/goal/repositories/GoalRepository';
import type { WeightSnapshotRepository } from '../../domain/goal/repositories/WeightSnapshotRepository';
import { KeyResultWeightSnapshot } from '@dailyuse/domain-server';
import type { SnapshotTrigger } from '@dailyuse/contracts';
import { GoalNotFoundError, KeyResultNotFoundError } from '@dailyuse/domain-server';

export interface CreateSnapshotDTO {
  goalUuid: string;
  krUuid: string;
  oldWeight: number;
  newWeight: number;
  trigger: SnapshotTrigger;
  operatorUuid: string;
  reason?: string;
}

export interface SnapshotQueryOptions {
  page?: number;
  pageSize?: number;
}

/**
 * 权重快照应用服务
 *
 * 负责权重快照的创建、查询和权重总和校验。
 */
export class WeightSnapshotApplicationService {
  constructor(
    private readonly goalRepository: GoalRepository,
    private readonly snapshotRepository: WeightSnapshotRepository,
  ) {}

  /**
   * 创建权重快照
   *
   * @param dto - 快照创建数据
   * @returns 创建的快照实例
   * @throws {GoalNotFoundError} Goal 不存在
   * @throws {KeyResultNotFoundError} KR 不存在
   */
  async createSnapshot(dto: CreateSnapshotDTO): Promise<KeyResultWeightSnapshot> {
    // 1. 验证 Goal 存在
    const goal = await this.goalRepository.findByUuid(dto.goalUuid);
    if (!goal) {
      throw new GoalNotFoundError(dto.goalUuid);
    }

    // 2. 验证 KR 存在
    const kr = goal.keyResults.find((k) => k.uuid === dto.krUuid);
    if (!kr) {
      throw new KeyResultNotFoundError(dto.krUuid, dto.goalUuid);
    }

    // 3. 创建快照值对象
    const snapshot = new KeyResultWeightSnapshot(
      crypto.randomUUID(),
      dto.goalUuid,
      dto.krUuid,
      dto.oldWeight,
      dto.newWeight,
      Date.now(),
      dto.trigger,
      dto.operatorUuid,
      dto.reason,
    );

    // 4. 保存快照
    await this.snapshotRepository.save(snapshot);

    return snapshot;
  }

  /**
   * 校验 Goal 中所有 KR 的权重总和是否为 100%
   *
   * @param goalUuid - Goal UUID
   * @returns true 如果总和 = 100, false 否则
   * @throws {GoalNotFoundError} Goal 不存在
   */
  async validateWeightSum(goalUuid: string): Promise<boolean> {
    const goal = await this.goalRepository.findByUuid(goalUuid);
    if (!goal) {
      throw new GoalNotFoundError(goalUuid);
    }

    const totalWeight = goal.keyResults.reduce((sum, kr) => sum + kr.weight, 0);

    return Math.abs(totalWeight - 100) < 0.01; // 浮点数精度处理
  }

  /**
   * 查询 Goal 的所有权重快照
   *
   * @param goalUuid - Goal UUID
   * @param options - 查询选项 (分页)
   * @returns 快照列表 (按时间倒序)
   */
  async getSnapshotsByGoal(
    goalUuid: string,
    options: SnapshotQueryOptions = {},
  ): Promise<{ snapshots: KeyResultWeightSnapshot[]; total: number }> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;

    const { snapshots, total } = await this.snapshotRepository.findByGoal(goalUuid, page, pageSize);

    return { snapshots, total };
  }

  /**
   * 查询 KeyResult 的所有权重快照
   *
   * @param krUuid - KeyResult UUID
   * @param options - 查询选项 (分页)
   * @returns 快照列表 (按时间倒序)
   */
  async getSnapshotsByKeyResult(
    krUuid: string,
    options: SnapshotQueryOptions = {},
  ): Promise<{ snapshots: KeyResultWeightSnapshot[]; total: number }> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;

    const { snapshots, total } = await this.snapshotRepository.findByKeyResult(
      krUuid,
      page,
      pageSize,
    );

    return { snapshots, total };
  }

  /**
   * 查询时间范围内的权重快照
   *
   * @param startTime - 开始时间戳
   * @param endTime - 结束时间戳
   * @param options - 查询选项 (分页)
   * @returns 快照列表 (按时间排序)
   */
  async getSnapshotsByTimeRange(
    startTime: number,
    endTime: number,
    options: SnapshotQueryOptions = {},
  ): Promise<{ snapshots: KeyResultWeightSnapshot[]; total: number }> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;

    const { snapshots, total } = await this.snapshotRepository.findByTimeRange(
      startTime,
      endTime,
      page,
      pageSize,
    );

    return { snapshots, total };
  }
}
```

### InvalidWeightSumError 实现

**apps/api/src/application/goal/errors/InvalidWeightSumError.ts**:

```typescript
import { ApplicationError } from '@dailyuse/utils';

export class InvalidWeightSumError extends ApplicationError {
  constructor(goalUuid: string, actualSum: number, weights: Record<string, number>) {
    super(
      'INVALID_WEIGHT_SUM',
      `Invalid weight sum for Goal ${goalUuid}: ${actualSum} (expected 100). KR weights: ${JSON.stringify(weights)}`,
      { goalUuid, actualSum, expectedSum: 100, weights },
      400,
    );
  }
}
```

### 集成到 UpdateKeyResultService

**apps/api/src/application/goal/UpdateKeyResultService.ts** (部分代码):

```typescript
import { WeightSnapshotApplicationService } from './WeightSnapshotApplicationService';
import { InvalidWeightSumError } from './errors/InvalidWeightSumError';

export class UpdateKeyResultService {
  constructor(
    private readonly goalRepository: GoalRepository,
    private readonly snapshotService: WeightSnapshotApplicationService,
  ) {}

  /**
   * 更新 KR 权重
   *
   * 自动创建权重快照并校验权重总和。
   */
  async updateWeight(
    krUuid: string,
    newWeight: number,
    operatorUuid: string,
    reason?: string,
  ): Promise<void> {
    // 1. 查找 Goal 和 KR
    const goal = await this.goalRepository.findByKeyResultUuid(krUuid);
    if (!goal) {
      throw new Error('Goal not found for KR');
    }

    const kr = goal.keyResults.find((k) => k.uuid === krUuid);
    if (!kr) {
      throw new KeyResultNotFoundError(krUuid, goal.uuid);
    }

    const oldWeight = kr.weight;

    // 2. 创建快照（记录旧权重）
    await this.snapshotService.createSnapshot({
      goalUuid: goal.uuid,
      krUuid: krUuid,
      oldWeight: oldWeight,
      newWeight: newWeight,
      trigger: 'manual',
      operatorUuid: operatorUuid,
      reason: reason,
    });

    // 3. 更新 KR 权重
    kr.updateWeight(newWeight);

    // 4. 校验权重总和
    const isValid = await this.snapshotService.validateWeightSum(goal.uuid);
    if (!isValid) {
      // 回滚: 恢复旧权重
      kr.updateWeight(oldWeight);

      // 计算实际总和用于错误信息
      const actualSum = goal.keyResults.reduce((sum, k) => sum + k.weight, 0);
      const weights = Object.fromEntries(goal.keyResults.map((k) => [k.title, k.weight]));

      throw new InvalidWeightSumError(goal.uuid, actualSum, weights);
    }

    // 5. 保存 Goal 聚合根
    await this.goalRepository.save(goal);
  }
}
```

---

## ✅ Definition of Done

### 功能完整性

- [ ] WeightSnapshotApplicationService 实现完成
- [ ] createSnapshot() 方法实现并测试
- [ ] validateWeightSum() 方法实现并测试
- [ ] 3 个查询方法实现并测试
- [ ] 集成到 UpdateKeyResultService 完成

### 代码质量

- [ ] TypeScript strict 模式无错误
- [ ] ESLint 无警告
- [ ] 所有公共方法有 JSDoc 注释
- [ ] 单元测试覆盖率 ≥ 80%

### 测试

- [ ] 所有单元测试通过
- [ ] 集成测试通过
- [ ] 测试覆盖权重总和校验所有场景
- [ ] 测试覆盖事务回滚场景

### 文档

- [ ] 方法签名清晰
- [ ] JSDoc 注释完整

### Code Review

- [ ] Code Review 完成
- [ ] Code Review 反馈已解决

---

## 📊 预估时间

| 任务                                  | 预估时间     |
| ------------------------------------- | ------------ |
| WeightSnapshotApplicationService 开发 | 2 小时       |
| UpdateKeyResultService 集成           | 1.5 小时     |
| InvalidWeightSumError 实现            | 0.5 小时     |
| 单元测试编写                          | 2 小时       |
| 集成测试编写                          | 1.5 小时     |
| Code Review & 修复                    | 1 小时       |
| **总计**                              | **8.5 小时** |

**Story Points**: 3 SP

---

## 🔗 依赖关系

### 上游依赖

- STORY-GOAL-002-001 (Contracts & Domain 层) - 必须完成

### 下游依赖

- STORY-GOAL-002-004 (API Endpoints) 依赖此 Story
- STORY-GOAL-002-005 (客户端服务) 间接依赖

---

## 🚨 风险与注意事项

### 技术风险

1. **事务处理**: 快照创建和权重更新需要在同一事务中
   - 缓解: 使用数据库事务或实现补偿机制
2. **并发更新**: 多用户同时更新权重可能导致总和校验失败
   - 缓解: 使用乐观锁（版本号）

### 业务风险

1. **权重总和校验时机**: 何时校验（更新前 vs 更新后）
   - 决策: 更新后校验，失败则回滚

---

**Story 创建日期**: 2025-10-22  
**Story 创建者**: SM  
**最后更新**: 2025-10-22
