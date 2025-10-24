# STORY-GOAL-002-001: KR 权重快照 - Contracts & Domain 层

> **Story ID**: STORY-GOAL-002-001  
> **Epic**: EPIC-GOAL-002 - KR 权重快照  
> **Sprint**: Sprint 2a  
> **Story Points**: 3 SP  
> **优先级**: P0 (Must Have)  
> **负责人**: Backend Developer  
> **状态**: 待开始 (To Do)

---

## 📖 User Story

**作为** 后端开发者  
**我想要** 建立 KR 权重快照的 Contracts 和 Domain 层基础  
**以便于** 为权重变更历史追溯功能提供统一的数据结构和业务逻辑

---

## 🎯 验收标准 (Acceptance Criteria)

### Scenario 1: 定义 KeyResultWeightSnapshot DTO

```gherkin
Scenario: 定义完整的 KeyResultWeightSnapshot ServerDTO
  Given 需要在前后端传输权重快照数据
  When 创建 KeyResultWeightSnapshotServerDTO 接口
  Then 应该包含所有必需字段
  And 使用 TypeScript 类型确保类型安全
  And 添加 JSDoc 注释说明每个字段用途

  Examples:
  | Field           | Type                | Required | Description           |
  | uuid            | string              | Yes      | 快照唯一标识          |
  | goalUuid        | string              | Yes      | 所属 Goal UUID        |
  | keyResultUuid   | string              | Yes      | 所属 KR UUID          |
  | oldWeight       | number              | Yes      | 调整前权重 (0-100)    |
  | newWeight       | number              | Yes      | 调整后权重 (0-100)    |
  | weightDelta     | number              | Yes      | 权重变化量 (计算得出) |
  | snapshotTime    | number              | Yes      | 快照时间戳            |
  | trigger         | SnapshotTrigger     | Yes      | 触发方式              |
  | reason          | string              | No       | 调整原因              |
  | operatorUuid    | string              | Yes      | 操作人 UUID           |
  | createdAt       | number              | Yes      | 创建时间戳            |
```

### Scenario 2: 定义 SnapshotTrigger 枚举

```gherkin
Scenario: 定义快照触发方式枚举
  Given 权重快照可以由不同方式触发
  When 定义 SnapshotTrigger 类型
  Then 应该包含以下选项:
  | Value    | Description            |
  | manual   | 手动调整               |
  | auto     | 系统自动调整           |
  | restore  | 恢复历史快照           |
  | import   | 从外部导入             |
  And 使用 TypeScript union type 定义
```

### Scenario 3: 创建 Zod 验证器

```gherkin
Scenario: 使用 Zod 验证 KeyResultWeightSnapshotServerDTO
  Given 需要在运行时验证快照数据
  When 创建 KeyResultWeightSnapshotServerDTOSchema
  Then 应该验证所有必需字段存在
  And 应该验证 uuid 格式正确
  And 应该验证 oldWeight 在 0-100 范围内
  And 应该验证 newWeight 在 0-100 范围内
  And 应该验证 snapshotTime 为正整数
  And 应该验证 trigger 在允许值范围内

  Examples: 验证失败案例
  | Invalid Data           | Error Message                    |
  | oldWeight: -10         | oldWeight must be between 0-100  |
  | newWeight: 150         | newWeight must be between 0-100  |
  | trigger: 'invalid'     | Invalid trigger value            |
  | uuid: 'not-a-uuid'     | Invalid UUID format              |
```

### Scenario 4: 实现 KeyResultWeightSnapshot 值对象

```gherkin
Scenario: 创建 KeyResultWeightSnapshot 值对象
  Given 需要在 Domain 层管理权重快照业务逻辑
  When 创建 KeyResultWeightSnapshot 类
  Then 应该包含所有 DTO 字段作为只读属性
  And 提供 getter 方法访问属性
  And 实现 weightDelta 计算属性
  And 实现权重范围验证
  And 提供 toServerDTO() 方法转换为 DTO

Scenario: 计算 weightDelta
  Given 一个权重快照实例
  When oldWeight = 30, newWeight = 50
  Then weightDelta 应该等于 20

  When oldWeight = 60, newWeight = 40
  Then weightDelta 应该等于 -20
```

### Scenario 5: 更新 Goal 聚合根

```gherkin
Scenario: Goal 聚合根添加快照记录方法
  Given Goal 实体需要记录 KR 权重变更
  When 添加 recordWeightSnapshot() 方法
  Then 应该创建 KeyResultWeightSnapshot 实例
  And 应该将快照添加到 weightSnapshots 数组
  And 应该验证 KR 存在于该 Goal 中
  And 如果 KR 不存在则抛出 KeyResultNotFoundError
```

### Scenario 6: 编写单元测试

```gherkin
Scenario: 测试 KeyResultWeightSnapshot 创建
  Given 有效的快照数据
  When 创建 KeyResultWeightSnapshot 实例
  Then 应该成功创建实例
  And 所有属性应该正确赋值
  And weightDelta 应该自动计算

Scenario: 测试权重范围验证
  Given 创建快照数据
  When oldWeight = -10
  Then 应该抛出 InvalidWeightError

  When newWeight = 150
  Then 应该抛出 InvalidWeightError

Scenario: 测试覆盖率
  Given 所有测试用例已编写
  When 运行 pnpm nx test domain-server
  Then 代码覆盖率应该 ≥ 80%
```

---

## 📋 任务清单 (Task Breakdown)

### Contracts 层任务 (packages/contracts)

- [ ] **Task 1.1**: 创建 `src/goal/types.ts` 定义基础类型
  - [ ] 定义 `SnapshotTrigger = 'manual' | 'auto' | 'restore' | 'import'`
  - [ ] 添加 JSDoc 注释

- [ ] **Task 1.2**: 创建 `src/goal/KeyResultWeightSnapshotServerDTO.ts`
  - [ ] 定义 `KeyResultWeightSnapshotServerDTO` 接口
  - [ ] 包含所有必需字段
  - [ ] 添加详细的 JSDoc 注释

- [ ] **Task 1.3**: 更新 `src/goal/GoalServerDTO.ts`
  - [ ] 添加 `weightSnapshots?: KeyResultWeightSnapshotServerDTO[]` 字段
  - [ ] 更新相关类型导出

- [ ] **Task 1.4**: 创建 `src/goal/schemas.ts` (Zod 验证器)
  - [ ] 创建 `KeyResultWeightSnapshotServerDTOSchema`
  - [ ] 添加权重范围验证 (0-100)
  - [ ] 添加 UUID 格式验证
  - [ ] 添加枚举值验证

- [ ] **Task 1.5**: 更新 `src/goal/index.ts` 导出所有类型
  - [ ] 导出新的 DTO 和 Schema
  - [ ] 更新 package.json exports (如需要)

### Domain 层任务 (packages/domain-server)

- [ ] **Task 2.1**: 创建 `src/goal/errors/` 目录
  - [ ] 创建 `InvalidWeightError.ts`
  - [ ] 创建 `KeyResultNotFoundError.ts`
  - [ ] 更新 `index.ts` 导出错误类

- [ ] **Task 2.2**: 创建 `src/goal/valueObjects/KeyResultWeightSnapshot.ts`
  - [ ] 定义 KeyResultWeightSnapshot 类结构
  - [ ] 实现构造函数和只读属性
  - [ ] 实现 `get weightDelta(): number` 计算属性
  - [ ] 实现 `validateWeights()` 私有方法
  - [ ] 实现 `toServerDTO()` 方法
  - [ ] 添加完整的 JSDoc 注释

- [ ] **Task 2.3**: 更新 `src/goal/entities/Goal.ts` 聚合根
  - [ ] 添加 `private _weightSnapshots: KeyResultWeightSnapshot[]` 属性
  - [ ] 添加 `get weightSnapshots()` getter
  - [ ] 实现 `recordWeightSnapshot()` 方法:
    ```typescript
    recordWeightSnapshot(
      krUuid: string,
      oldWeight: number,
      newWeight: number,
      trigger: SnapshotTrigger,
      operatorUuid: string,
      reason?: string
    ): void
    ```
  - [ ] 验证 KR 存在性
  - [ ] 创建快照并添加到数组

- [ ] **Task 2.4**: 编写单元测试
  - [ ] 创建 `src/goal/valueObjects/__tests__/KeyResultWeightSnapshot.test.ts`
  - [ ] 测试快照创建成功场景
  - [ ] 测试 weightDelta 计算 (正数、负数、零)
  - [ ] 测试权重范围验证 (< 0, > 100)
  - [ ] 测试 toServerDTO() 方法
  - [ ] 创建 `src/goal/entities/__tests__/Goal.snapshot.test.ts`
  - [ ] 测试 recordWeightSnapshot() 成功场景
  - [ ] 测试 KR 不存在时抛出错误
  - [ ] 确保覆盖率 ≥ 80%

---

## 🔧 技术实现细节

### Contracts 层代码示例

**src/goal/types.ts**:

```typescript
/**
 * 权重快照触发方式
 */
export type SnapshotTrigger = 'manual' | 'auto' | 'restore' | 'import';
```

**src/goal/KeyResultWeightSnapshotServerDTO.ts**:

```typescript
import type { SnapshotTrigger } from './types';

/**
 * KR 权重快照 Server DTO
 *
 * 用于记录 KeyResult 权重的历史变更，支持权重调整的完整追溯和审计。
 */
export interface KeyResultWeightSnapshotServerDTO {
  /** 快照唯一标识 */
  uuid: string;

  /** 所属 Goal UUID */
  goalUuid: string;

  /** 所属 KeyResult UUID */
  keyResultUuid: string;

  /** 调整前权重 (0-100) */
  oldWeight: number;

  /** 调整后权重 (0-100) */
  newWeight: number;

  /** 权重变化量 (newWeight - oldWeight) */
  weightDelta: number;

  /** 快照时间戳 (毫秒) */
  snapshotTime: number;

  /**
   * 触发方式
   * - manual: 用户手动调整
   * - auto: 系统自动调整
   * - restore: 恢复历史快照
   * - import: 从外部导入
   */
  trigger: SnapshotTrigger;

  /** 调整原因说明 (可选) */
  reason?: string;

  /** 操作人 UUID */
  operatorUuid: string;

  /** 创建时间戳 */
  createdAt: number;
}
```

**src/goal/schemas.ts**:

```typescript
import { z } from 'zod';

export const SnapshotTriggerSchema = z.enum(['manual', 'auto', 'restore', 'import']);

export const KeyResultWeightSnapshotServerDTOSchema = z.object({
  uuid: z.string().uuid('Invalid UUID format'),
  goalUuid: z.string().uuid('Invalid Goal UUID'),
  keyResultUuid: z.string().uuid('Invalid KeyResult UUID'),
  oldWeight: z
    .number()
    .min(0, 'oldWeight must be at least 0')
    .max(100, 'oldWeight must be at most 100'),
  newWeight: z
    .number()
    .min(0, 'newWeight must be at least 0')
    .max(100, 'newWeight must be at most 100'),
  weightDelta: z.number(),
  snapshotTime: z.number().int().positive('snapshotTime must be positive'),
  trigger: SnapshotTriggerSchema,
  reason: z.string().optional(),
  operatorUuid: z.string().uuid('Invalid operator UUID'),
  createdAt: z.number().int().positive('createdAt must be positive'),
});

export type KeyResultWeightSnapshotServerDTOType = z.infer<
  typeof KeyResultWeightSnapshotServerDTOSchema
>;
```

### Domain 层代码示例

**src/goal/errors/InvalidWeightError.ts**:

```typescript
import { DomainError } from '@dailyuse/utils';

export class InvalidWeightError extends DomainError {
  constructor(field: 'oldWeight' | 'newWeight', value: number) {
    super(
      'INVALID_WEIGHT',
      `Invalid ${field}: ${value}. Weight must be between 0 and 100`,
      { field, value },
      400,
    );
  }
}
```

**src/goal/errors/KeyResultNotFoundError.ts**:

```typescript
import { DomainError } from '@dailyuse/utils';

export class KeyResultNotFoundError extends DomainError {
  constructor(krUuid: string, goalUuid: string) {
    super(
      'KEY_RESULT_NOT_FOUND',
      `KeyResult ${krUuid} not found in Goal ${goalUuid}`,
      { krUuid, goalUuid },
      404,
    );
  }
}
```

**src/goal/valueObjects/KeyResultWeightSnapshot.ts**:

```typescript
import type { KeyResultWeightSnapshotServerDTO, SnapshotTrigger } from '@dailyuse/contracts';
import { InvalidWeightError } from '../errors';

/**
 * KR 权重快照值对象
 *
 * 不可变对象，用于记录某个时间点的 KR 权重变更。
 * 包含权重变化的完整上下文信息（谁、什么时候、为什么、怎么变的）。
 */
export class KeyResultWeightSnapshot {
  constructor(
    public readonly uuid: string,
    public readonly goalUuid: string,
    public readonly keyResultUuid: string,
    public readonly oldWeight: number,
    public readonly newWeight: number,
    public readonly snapshotTime: number,
    public readonly trigger: SnapshotTrigger,
    public readonly operatorUuid: string,
    public readonly reason?: string,
    public readonly createdAt?: number,
  ) {
    this.validateWeights();
  }

  /**
   * 计算权重变化量
   * @returns 权重增量（可为负数）
   */
  get weightDelta(): number {
    return this.newWeight - this.oldWeight;
  }

  /**
   * 验证权重值范围
   * @throws {InvalidWeightError} 如果权重不在 0-100 范围内
   */
  private validateWeights(): void {
    if (this.oldWeight < 0 || this.oldWeight > 100) {
      throw new InvalidWeightError('oldWeight', this.oldWeight);
    }
    if (this.newWeight < 0 || this.newWeight > 100) {
      throw new InvalidWeightError('newWeight', this.newWeight);
    }
  }

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): KeyResultWeightSnapshotServerDTO {
    return {
      uuid: this.uuid,
      goalUuid: this.goalUuid,
      keyResultUuid: this.keyResultUuid,
      oldWeight: this.oldWeight,
      newWeight: this.newWeight,
      weightDelta: this.weightDelta,
      snapshotTime: this.snapshotTime,
      trigger: this.trigger,
      reason: this.reason,
      operatorUuid: this.operatorUuid,
      createdAt: this.createdAt ?? Date.now(),
    };
  }

  /**
   * 从 ServerDTO 创建实例
   */
  public static fromServerDTO(dto: KeyResultWeightSnapshotServerDTO): KeyResultWeightSnapshot {
    return new KeyResultWeightSnapshot(
      dto.uuid,
      dto.goalUuid,
      dto.keyResultUuid,
      dto.oldWeight,
      dto.newWeight,
      dto.snapshotTime,
      dto.trigger,
      dto.operatorUuid,
      dto.reason,
      dto.createdAt,
    );
  }
}
```

**src/goal/entities/Goal.ts** (部分代码):

```typescript
import { KeyResultWeightSnapshot } from '../valueObjects/KeyResultWeightSnapshot';
import { KeyResultNotFoundError } from '../errors';
import type { SnapshotTrigger } from '@dailyuse/contracts';

export class Goal {
  // ... 现有属性 ...
  private _weightSnapshots: KeyResultWeightSnapshot[] = [];

  // ... 现有方法 ...

  get weightSnapshots(): ReadonlyArray<KeyResultWeightSnapshot> {
    return this._weightSnapshots;
  }

  /**
   * 记录 KR 权重变更快照
   *
   * @param krUuid - KeyResult UUID
   * @param oldWeight - 调整前权重
   * @param newWeight - 调整后权重
   * @param trigger - 触发方式
   * @param operatorUuid - 操作人 UUID
   * @param reason - 调整原因（可选）
   * @throws {KeyResultNotFoundError} 如果 KR 不存在于该 Goal 中
   */
  public recordWeightSnapshot(
    krUuid: string,
    oldWeight: number,
    newWeight: number,
    trigger: SnapshotTrigger,
    operatorUuid: string,
    reason?: string,
  ): void {
    // 验证 KR 存在
    const kr = this._keyResults.find((k) => k.uuid === krUuid);
    if (!kr) {
      throw new KeyResultNotFoundError(krUuid, this.uuid);
    }

    // 创建快照
    const snapshot = new KeyResultWeightSnapshot(
      crypto.randomUUID(),
      this.uuid,
      krUuid,
      oldWeight,
      newWeight,
      Date.now(),
      trigger,
      operatorUuid,
      reason,
    );

    // 添加到快照数组
    this._weightSnapshots.push(snapshot);
  }
}
```

---

## ✅ Definition of Done

### 功能完整性

- [ ] KeyResultWeightSnapshotServerDTO 定义完成并导出
- [ ] SnapshotTrigger 类型定义完成
- [ ] Zod 验证器覆盖所有字段
- [ ] KeyResultWeightSnapshot 值对象实现完成
- [ ] Goal.recordWeightSnapshot() 方法实现完成

### 代码质量

- [ ] TypeScript strict 模式无错误
- [ ] ESLint 无警告
- [ ] 所有公共方法有 JSDoc 注释
- [ ] 单元测试覆盖率 ≥ 80%

### 测试

- [ ] 所有单元测试通过
- [ ] 测试覆盖成功和失败场景
- [ ] weightDelta 计算测试通过
- [ ] 权重范围验证测试通过
- [ ] Goal 快照记录测试通过

### 文档

- [ ] JSDoc 注释完整
- [ ] 接口说明清晰

### Code Review

- [ ] Code Review 完成 (至少 1 人)
- [ ] Code Review 反馈已解决

---

## 📊 预估时间

| 任务                        | 预估时间     |
| --------------------------- | ------------ |
| Contracts 层开发            | 1.5 小时     |
| Domain 层开发 (值对象)      | 2 小时       |
| Domain 层开发 (Goal 聚合根) | 1 小时       |
| 单元测试编写                | 2 小时       |
| Code Review & 修复          | 1 小时       |
| **总计**                    | **7.5 小时** |

**Story Points**: 3 SP (对应 7.5 小时工作量)

---

## 🔗 依赖关系

### 上游依赖

- 无 (这是 Sprint 2a 的第一个 Story)
- 参考 Sprint 1 的 UserSetting 模块架构

### 下游依赖

- STORY-GOAL-002-002 (Application Service) 依赖此 Story
- STORY-GOAL-002-003 (Repository) 依赖此 Story
- 所有其他 Sprint 2a Stories 间接依赖此 Story

---

## 🚨 风险与注意事项

### 技术风险

1. **Goal 聚合根复杂度**: Goal 已有较多业务逻辑，添加快照功能可能增加复杂度
   - 缓解: 使用值对象封装快照逻辑，保持 Goal 聚合根简洁
2. **权重总和校验**: 快照记录时是否需要校验所有 KR 权重总和 = 100%
   - 决策: 本 Story 只记录快照，不做业务校验（校验在 Application Service）

### 业务风险

1. **快照数据量**: 长时间运行后快照数据可能很大
   - 缓解: 考虑添加 createdAt 索引，支持按时间范围查询

---

## 📝 开发笔记

### 技术决策

- 使用值对象而非实体: KeyResultWeightSnapshot 不可变，适合值对象模式
- weightDelta 使用计算属性: 避免数据冗余和不一致
- 快照记录在 Goal 聚合根: 保持领域模型内聚性

### 待讨论问题

- 是否需要支持批量快照？（当前一次记录一个）
- 是否需要快照版本号？（支持快照的快照）
- 快照是否支持软删除？

---

**Story 创建日期**: 2025-10-22  
**Story 创建者**: SM  
**最后更新**: 2025-10-22
