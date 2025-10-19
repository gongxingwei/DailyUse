# FocusSessionDomainService Implementation Summary

**Status**: ✅ Complete  
**Date**: 2024-10-19  
**File**: `packages/domain-server/src/goal/services/FocusSessionDomainService.ts`  
**Lines of Code**: ~400 lines

---

## 📋 Overview

FocusSessionDomainService 是一个**纯领域逻辑服务**，严格遵循 DDD 规范：

- ✅ **不注入 Repository**（不依赖数据库）
- ✅ **所有方法都是同步的**（纯业务逻辑）
- ✅ **接收聚合根作为参数**（由 ApplicationService 查询后传入）
- ✅ **只返回验证结果或计算结果**（不持久化）

---

## 🎯 核心方法

### 1. 验证方法（Business Rules Validation）

#### `validateDuration(durationMinutes: number): void`
- **职责**: 验证专注时长是否在有效范围内
- **业务规则**:
  - 时长必须 > 0 分钟
  - 时长不能超过 240 分钟（4 小时）
  - 可选警告：建议设置为 5 分钟的倍数
- **抛出异常**: 如果时长无效

#### `validateSingleActiveSession(existingSessions: FocusSession[], accountUuid: string): void`
- **职责**: 验证单个活跃会话规则
- **业务规则**: 每个账户同时只能有一个活跃的专注周期（IN_PROGRESS 或 PAUSED）
- **参数**: 接收会话列表（由 ApplicationService 查询后传入）
- **抛出异常**: 如果存在活跃会话

#### `validateAssociatedGoal(goal: Goal | null, accountUuid: string): void`
- **职责**: 验证关联目标的有效性
- **业务规则**:
  - 目标必须存在
  - 目标必须属于同一个账户
  - 目标不能是已归档或已删除的
- **参数**: 接收 Goal 聚合根（由 ApplicationService 查询后传入）
- **抛出异常**: 如果目标无效

#### `validateStateTransition(currentStatus, action): void`
- **职责**: 验证状态转换是否合法
- **业务规则**: 遵循状态机规则
  - `DRAFT → start() → IN_PROGRESS`
  - `IN_PROGRESS → pause() → PAUSED`
  - `PAUSED → resume() → IN_PROGRESS`
  - `IN_PROGRESS/PAUSED → complete() → COMPLETED`
  - `Any (except COMPLETED/CANCELLED) → cancel() → CANCELLED`
- **抛出异常**: 如果状态转换不合法

#### `validateSessionOwnership(session: FocusSession, accountUuid: string): void`
- **职责**: 验证会话所有权
- **业务规则**: 会话必须属于当前账户
- **抛出异常**: 如果会话不属于当前账户

#### `validateSessionDeletion(session: FocusSession): void`
- **职责**: 验证会话是否可以删除
- **业务规则**: 只能删除已完成或已取消的会话
- **抛出异常**: 如果会话不能删除

#### `validateDescription(description: string | null | undefined): void`
- **职责**: 验证会话描述
- **业务规则**: 描述不能超过 500 个字符
- **抛出异常**: 如果描述无效

#### `validatePauseCount(session: FocusSession): string | null`
- **职责**: 验证暂停次数是否合理
- **业务规则**: 推荐暂停次数 ≤ 3 次
- **返回**: 警告信息（如果超过推荐值）或 null

---

### 2. 计算方法（Domain Calculations）

#### `calculateActualDuration(session: FocusSession): number`
- **职责**: 计算实际专注时长（已完成的会话）
- **计算公式**: `actualDuration = totalDuration - pausedDuration`
- **前提条件**: 会话状态必须是 COMPLETED
- **返回**: 实际专注时长（分钟）

#### `calculateRemainingMinutes(session: FocusSession): number`
- **职责**: 计算剩余时间（活跃会话）
- **实现**: 直接调用聚合根的 `getRemainingMinutes()` 方法
- **返回**: 剩余时间（分钟）

#### `calculateProgressPercentage(session: FocusSession): number`
- **职责**: 计算进度百分比
- **计算逻辑**:
  - DRAFT: 0%
  - COMPLETED/CANCELLED: 100%
  - IN_PROGRESS/PAUSED: `(total - remaining) / total * 100`
- **返回**: 进度百分比（0-100）

#### `calculateSessionStatistics(sessions: FocusSession[]): Statistics`
- **职责**: 计算会话统计信息
- **参数**: 接收会话列表（由 ApplicationService 查询后传入）
- **返回**: 统计对象
  ```typescript
  {
    totalSessions: number;          // 总会话数
    completedSessions: number;      // 完成的会话数
    cancelledSessions: number;      // 取消的会话数
    totalFocusMinutes: number;      // 总专注时长
    totalPauseMinutes: number;      // 总暂停时长
    averageFocusMinutes: number;    // 平均专注时长
    completionRate: number;         // 完成率（%）
  }
  ```

---

### 3. 创建方法（Aggregate Creation）

#### `createFocusSession(params, goal?): FocusSession`
- **职责**: 协调专注周期创建逻辑
- **步骤**:
  1. 验证时长
  2. 验证描述
  3. 验证关联目标（如果提供）
  4. 调用聚合根工厂方法创建实例
  5. 返回聚合根（不持久化）
- **参数**:
  - `params`: 创建参数
  - `goal`: 关联的目标（可选，由 ApplicationService 查询后传入）
- **返回**: 新创建的 FocusSession 聚合根（未持久化）

---

## 🏗️ 架构设计原则

### ✅ 符合 DDD 规范

```typescript
export class FocusSessionDomainService {
  /**
   * 构造函数 - 无依赖注入
   */
  constructor() {
    // 领域服务不注入仓储
  }

  // 所有方法都是同步的
  validateDuration(durationMinutes: number): void { }
  validateSingleActiveSession(sessions: FocusSession[], accountUuid: string): void { }
  calculateActualDuration(session: FocusSession): number { }
}
```

### ❌ 不包含的逻辑

- ❌ 持久化操作（`repository.save()`）
- ❌ 查询数据库（`repository.find()`）
- ❌ 事务控制（应该在 ApplicationService）
- ❌ DTO 转换（应该在 ApplicationService 或聚合根）
- ❌ 简单的 CRUD（应该由 ApplicationService 编排）

---

## 🔗 与其他层的协作

### ApplicationService 调用示例

```typescript
// ✅ 正确的调用方式
export class FocusSessionApplicationService {
  constructor(
    private readonly domainService: FocusSessionDomainService,
    private readonly sessionRepository: IFocusSessionRepository,
    private readonly goalRepository: IGoalRepository,
  ) {}

  async createAndStartSession(request): Promise<FocusSessionClientDTO> {
    // 1. ApplicationService 查询数据
    const existingSessions = await this.sessionRepository.findByAccountUuid(
      request.accountUuid
    );
    
    // 2. DomainService 执行验证（接收查询结果作为参数）
    this.domainService.validateSingleActiveSession(
      existingSessions,
      request.accountUuid
    );

    // 3. 查询关联目标（如果需要）
    let goal: Goal | null = null;
    if (request.goalUuid) {
      goal = await this.goalRepository.findById(request.goalUuid);
    }

    // 4. DomainService 创建聚合根（不持久化）
    const session = this.domainService.createFocusSession(
      {
        accountUuid: request.accountUuid,
        goalUuid: request.goalUuid,
        durationMinutes: request.durationMinutes,
        description: request.description,
      },
      goal
    );

    // 5. 立即开始（如果指定）
    if (request.startImmediately !== false) {
      session.start();
    }

    // 6. ApplicationService 持久化
    await this.sessionRepository.save(session);

    // 7. 返回 ClientDTO
    return session.toClientDTO();
  }
}
```

---

## 📊 方法分类总结

| 分类         | 方法数量 | 示例方法                                                                                     |
| ------------ | -------- | -------------------------------------------------------------------------------------------- |
| **验证方法** | 8        | `validateDuration()`, `validateSingleActiveSession()`, `validateStateTransition()`           |
| **计算方法** | 4        | `calculateActualDuration()`, `calculateProgressPercentage()`, `calculateSessionStatistics()` |
| **创建方法** | 1        | `createFocusSession()`                                                                       |
| **总计**     | 13       | -                                                                                            |

---

## ✅ 验证清单

- [x] 不注入 Repository
- [x] 所有方法都是同步的
- [x] 接收聚合根作为参数（不查询数据库）
- [x] 只返回验证结果或计算结果（不持久化）
- [x] 清晰的业务规则验证
- [x] 详细的错误消息
- [x] 完整的 JSDoc 注释
- [x] TypeScript 编译通过
- [x] 已导出到 packages/domain-server/src/goal/index.ts

---

## 🔄 Next Steps

1. ✅ **FocusSessionDomainService** - Complete (~400 lines)
2. ⏳ **IFocusSessionRepository Interface** - Next (~30 lines)
3. ⏳ **FocusSessionApplicationService** - Pending (~350 lines)

---

**实现完成！** 🎉

FocusSessionDomainService 已完全实现，严格遵循 DDD 规范，不包含任何持久化逻辑，所有方法都是纯业务逻辑。
