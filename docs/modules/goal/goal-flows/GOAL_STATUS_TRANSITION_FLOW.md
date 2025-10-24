# 目标状态转换流程设计文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-18
- **架构模式**: DDD (Goal 模块)
- **相关模块**: Goal, Statistics
- **业务场景**: 目标状态转换（激活、完成、归档、删除）

---

## 1. 业务概述

### 1.1 业务目标

用户可以管理目标的生命周期，通过状态转换实现：

- **激活目标** (DRAFT → ACTIVE): 开始追踪目标
- **完成目标** (ACTIVE → COMPLETED): 标记目标已完成
- **归档目标** (ACTIVE/COMPLETED → ARCHIVED): 归档不再追踪的目标
- **删除目标** (任意状态 → DELETED): 软删除目标（可恢复）
- **恢复目标** (DELETED → 原状态): 从删除状态恢复

### 1.2 核心原则

- **状态机模式**: 严格的状态转换规则
- **原子性**: 状态转换和相关数据更新在同一事务中完成
- **事件驱动**: 每次状态转换发布领域事件
- **软删除**: 删除操作不物理删除数据，便于恢复

### 1.3 状态机图

```
        ┌──────┐
        │DRAFT │
        └──┬───┘
           │ activate()
           ▼
        ┌──────┐      complete()      ┌──────────┐
    ┌──▶│ACTIVE├─────────────────────▶│COMPLETED │
    │   └──┬───┘                      └────┬─────┘
    │      │                               │
    │      │ archive()         archive()   │
    │      ▼                               ▼
    │   ┌──────────┐                  ┌──────────┐
    │   │ARCHIVED  │◀─────────────────┤          │
    │   └────┬─────┘                  └──────────┘
    │        │
    │        │ unarchive()
    │        │
    └────────┘

    任意状态 ──softDelete()──▶ DELETED
    DELETED  ──restore()────▶ 原状态
```

### 1.4 状态转换规则表

| 当前状态  | 可转换到  | 触发方法     | 业务规则                   |
| --------- | --------- | ------------ | -------------------------- |
| DRAFT     | ACTIVE    | activate()   | 无                         |
| DRAFT     | DELETED   | softDelete() | 无                         |
| ACTIVE    | COMPLETED | complete()   | 所有关键结果需完成（可选） |
| ACTIVE    | ARCHIVED  | archive()    | 无                         |
| ACTIVE    | DELETED   | softDelete() | 无                         |
| COMPLETED | ARCHIVED  | archive()    | 无                         |
| COMPLETED | DELETED   | softDelete() | 无                         |
| ARCHIVED  | ACTIVE    | unarchive()  | 无                         |
| ARCHIVED  | DELETED   | softDelete() | 无                         |
| DELETED   | 原状态    | restore()    | 无                         |

---

## 2. 详细流程设计

### 2.1 激活目标 (Activate Goal)

#### 业务场景

用户完成目标规划，准备开始追踪进度。

#### API

```
PUT /api/goals/:uuid/activate
```

#### 请求体参数

```typescript
interface ActivateGoalRequest {
  // 空请求体
}
```

#### 响应数据

```typescript
interface ActivateGoalResponse {
  goal: GoalClientDTO;
  message: string;
}
```

#### 领域逻辑

```typescript
// Goal.ts
public activate(): void {
  // 1. 验证状态
  if (this._status !== GoalStatus.DRAFT) {
    throw new Error(`只能激活草稿状态的目标，当前状态: ${this._status}`);
  }

  // 2. 更新状态
  this._status = GoalStatus.ACTIVE;
  this._updatedAt = new Date();

  // 3. 发布领域事件
  this.addDomainEvent({
    eventType: 'GoalActivatedEvent',
    aggregateId: this._uuid,
    occurredOn: new Date(),
    payload: {
      goalUuid: this._uuid,
      accountUuid: this._accountUuid,
      title: this._title,
    },
  });
}
```

#### 应用服务

```typescript
async activateGoal(goalUuid: string, accountUuid: string): Promise<GoalClientDTO> {
  // 1. 加载 Goal 聚合根
  const goal = await this.goalRepository.findByUuid(goalUuid);
  if (!goal) {
    throw new Error('目标不存在');
  }

  // 2. 权限检查
  if (goal.accountUuid !== accountUuid) {
    throw new Error('无权操作此目标');
  }

  // 3. 执行状态转换
  goal.activate();

  // 4. 持久化
  await this.goalRepository.save(goal);

  // 5. 发布事件
  this.publishDomainEvents(goal);

  // 6. 返回 DTO
  return goal.toClientDTO(true);
}
```

---

### 2.2 完成目标 (Complete Goal)

#### 业务场景

用户达成目标的所有关键结果，标记为完成。

#### API

```
PUT /api/goals/:uuid/complete
```

#### 请求体参数

```typescript
interface CompleteGoalRequest {
  forceComplete?: boolean; // 强制完成（不检查关键结果）
}
```

#### 领域逻辑

```typescript
// Goal.ts
public complete(forceComplete = false): void {
  // 1. 验证状态
  if (this._status !== GoalStatus.ACTIVE) {
    throw new Error(`只能完成进行中的目标，当前状态: ${this._status}`);
  }

  // 2. 检查关键结果完成度（可选）
  if (!forceComplete) {
    const allCompleted = this._keyResults.every(kr =>
      kr.currentValue >= kr.targetValue
    );
    if (!allCompleted) {
      throw new Error('部分关键结果未完成，无法标记目标为完成');
    }
  }

  // 3. 更新状态
  this._status = GoalStatus.COMPLETED;
  this._completedAt = new Date();
  this._updatedAt = new Date();

  // 4. 发布领域事件
  this.addDomainEvent({
    eventType: 'GoalCompletedEvent',
    aggregateId: this._uuid,
    occurredOn: new Date(),
    payload: {
      goalUuid: this._uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      completedAt: this._completedAt,
    },
  });
}
```

---

### 2.3 归档目标 (Archive Goal)

#### 业务场景

用户将不再追踪的目标归档（已完成或放弃的目标）。

#### API

```
PUT /api/goals/:uuid/archive
```

#### 领域逻辑实现

```typescript

```

#### 领域逻辑

```typescript
// Goal.ts
public archive(): void {
  // 1. 验证状态
  if (this._status === GoalStatus.ARCHIVED) {
    throw new Error('目标已归档');
  }
  if (this._status === GoalStatus.DELETED) {
    throw new Error('已删除的目标无法归档');
  }

  // 2. 保存原状态（用于 unarchive）
  this._previousStatus = this._status;

  // 3. 更新状态
  this._status = GoalStatus.ARCHIVED;
  this._archivedAt = new Date();
  this._updatedAt = new Date();

  // 4. 发布领域事件
  this.addDomainEvent({
    eventType: 'GoalArchivedEvent',
    aggregateId: this._uuid,
    occurredOn: new Date(),
    payload: {
      goalUuid: this._uuid,
      accountUuid: this._accountUuid,
      previousStatus: this._previousStatus,
    },
  });
}

public unarchive(): void {
  if (this._status !== GoalStatus.ARCHIVED) {
    throw new Error('只能取消归档已归档的目标');
  }

  // 恢复到原状态
  this._status = this._previousStatus || GoalStatus.ACTIVE;
  this._archivedAt = null;
  this._updatedAt = new Date();

  this.addDomainEvent({
    eventType: 'GoalUnarchivedEvent',
    aggregateId: this._uuid,
    occurredOn: new Date(),
    payload: {
      goalUuid: this._uuid,
      accountUuid: this._accountUuid,
      restoredStatus: this._status,
    },
  });
}
```

---

### 2.4 删除目标 (Soft Delete Goal)

#### 业务场景

用户删除目标（软删除，可恢复）。

#### API

```
DELETE /api/goals/:uuid
```

#### 领域逻辑

```typescript
// Goal.ts
public softDelete(): void {
  if (this._status === GoalStatus.DELETED) {
    throw new Error('目标已删除');
  }

  // 1. 保存原状态
  this._previousStatus = this._status;

  // 2. 更新状态
  this._status = GoalStatus.DELETED;
  this._deletedAt = new Date();
  this._updatedAt = new Date();

  // 3. 发布领域事件
  this.addDomainEvent({
    eventType: 'GoalDeletedEvent',
    aggregateId: this._uuid,
    occurredOn: new Date(),
    payload: {
      goalUuid: this._uuid,
      accountUuid: this._accountUuid,
      previousStatus: this._previousStatus,
      deletedAt: this._deletedAt,
    },
  });
}

public restore(): void {
  if (this._status !== GoalStatus.DELETED) {
    throw new Error('只能恢复已删除的目标');
  }

  // 恢复到原状态
  this._status = this._previousStatus || GoalStatus.DRAFT;
  this._deletedAt = null;
  this._updatedAt = new Date();

  this.addDomainEvent({
    eventType: 'GoalRestoredEvent',
    aggregateId: this._uuid,
    occurredOn: new Date(),
    payload: {
      goalUuid: this._uuid,
      accountUuid: this._accountUuid,
      restoredStatus: this._status,
    },
  });
}
```

---

## 3. 应用服务统一实现

```typescript
// GoalApplicationService.ts
export class GoalApplicationService {
  async activateGoal(goalUuid: string, accountUuid: string): Promise<GoalClientDTO> {
    return this.executeStateTransition(goalUuid, accountUuid, (goal) => {
      goal.activate();
    });
  }

  async completeGoal(
    goalUuid: string,
    accountUuid: string,
    forceComplete = false,
  ): Promise<GoalClientDTO> {
    return this.executeStateTransition(goalUuid, accountUuid, (goal) => {
      goal.complete(forceComplete);
    });
  }

  async archiveGoal(goalUuid: string, accountUuid: string): Promise<GoalClientDTO> {
    return this.executeStateTransition(goalUuid, accountUuid, (goal) => {
      goal.archive();
    });
  }

  async unarchiveGoal(goalUuid: string, accountUuid: string): Promise<GoalClientDTO> {
    return this.executeStateTransition(goalUuid, accountUuid, (goal) => {
      goal.unarchive();
    });
  }

  async softDeleteGoal(goalUuid: string, accountUuid: string): Promise<void> {
    await this.executeStateTransition(goalUuid, accountUuid, (goal) => {
      goal.softDelete();
    });
  }

  async restoreGoal(goalUuid: string, accountUuid: string): Promise<GoalClientDTO> {
    return this.executeStateTransition(goalUuid, accountUuid, (goal) => {
      goal.restore();
    });
  }

  // 私有辅助方法：统一的状态转换执行流程
  private async executeStateTransition(
    goalUuid: string,
    accountUuid: string,
    transition: (goal: Goal) => void,
  ): Promise<GoalClientDTO | void> {
    // 1. 加载聚合根
    const goal = await this.goalRepository.findByUuid(goalUuid);
    if (!goal) {
      throw new Error('目标不存在');
    }

    // 2. 权限检查
    if (goal.accountUuid !== accountUuid) {
      throw new Error('无权操作此目标');
    }

    // 3. 执行状态转换
    transition(goal);

    // 4. 持久化
    await this.goalRepository.save(goal);

    // 5. 发布事件
    this.publishDomainEvents(goal);

    // 6. 返回 DTO（除非是删除操作）
    if (goal.status !== GoalStatus.DELETED) {
      return goal.toClientDTO(true);
    }
  }

  private publishDomainEvents(goal: Goal): void {
    const events = goal.getDomainEvents();
    events.forEach((event) => {
      eventBus.publish(event);
    });
    goal.clearDomainEvents();
  }
}
```

---

## 4. 前端实现

### 4.1 状态操作按钮组件

```vue
<!-- GoalStatusActions.vue -->
<template>
  <div class="goal-status-actions">
    <!-- 激活按钮 (DRAFT) -->
    <el-button
      v-if="goal.status === 'DRAFT'"
      type="primary"
      @click="handleActivate"
      :loading="isLoading"
    >
      激活目标
    </el-button>

    <!-- 完成按钮 (ACTIVE) -->
    <el-button
      v-if="goal.status === 'ACTIVE'"
      type="success"
      @click="handleComplete"
      :loading="isLoading"
    >
      标记完成
    </el-button>

    <!-- 归档按钮 (ACTIVE/COMPLETED) -->
    <el-button
      v-if="['ACTIVE', 'COMPLETED'].includes(goal.status)"
      type="info"
      @click="handleArchive"
      :loading="isLoading"
    >
      归档
    </el-button>

    <!-- 取消归档按钮 (ARCHIVED) -->
    <el-button v-if="goal.status === 'ARCHIVED'" @click="handleUnarchive" :loading="isLoading">
      取消归档
    </el-button>

    <!-- 删除按钮 (所有非删除状态) -->
    <el-button
      v-if="goal.status !== 'DELETED'"
      type="danger"
      @click="handleDelete"
      :loading="isLoading"
    >
      删除
    </el-button>

    <!-- 恢复按钮 (DELETED) -->
    <el-button
      v-if="goal.status === 'DELETED'"
      type="warning"
      @click="handleRestore"
      :loading="isLoading"
    >
      恢复
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useGoalStore } from '../stores/goalStore';
import type { GoalClientDTO } from '@daily-use/contracts';

const props = defineProps<{
  goal: GoalClientDTO;
}>();

const goalStore = useGoalStore();
const isLoading = ref(false);

async function handleActivate() {
  isLoading.value = true;
  try {
    await goalStore.activateGoal(props.goal.uuid);
    ElMessage.success('目标已激活');
  } catch (error: any) {
    ElMessage.error(error.message || '激活失败');
  } finally {
    isLoading.value = false;
  }
}

async function handleComplete() {
  isLoading.value = true;
  try {
    // 检查关键结果完成度
    const allCompleted = props.goal.keyResults.every((kr) => kr.currentValue >= kr.targetValue);

    if (!allCompleted) {
      await ElMessageBox.confirm('部分关键结果未完成，确认要标记为完成吗？', '确认', {
        confirmButtonText: '强制完成',
        cancelButtonText: '取消',
        type: 'warning',
      });
    }

    await goalStore.completeGoal(props.goal.uuid, !allCompleted);
    ElMessage.success('目标已完成');
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '完成失败');
    }
  } finally {
    isLoading.value = false;
  }
}

async function handleArchive() {
  isLoading.value = true;
  try {
    await goalStore.archiveGoal(props.goal.uuid);
    ElMessage.success('目标已归档');
  } catch (error: any) {
    ElMessage.error(error.message || '归档失败');
  } finally {
    isLoading.value = false;
  }
}

async function handleUnarchive() {
  isLoading.value = true;
  try {
    await goalStore.unarchiveGoal(props.goal.uuid);
    ElMessage.success('已取消归档');
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    isLoading.value = false;
  }
}

async function handleDelete() {
  try {
    await ElMessageBox.confirm('确认要删除此目标吗？删除后可在回收站恢复。', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });

    isLoading.value = true;
    await goalStore.softDeleteGoal(props.goal.uuid);
    ElMessage.success('目标已删除');
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败');
    }
  } finally {
    isLoading.value = false;
  }
}

async function handleRestore() {
  isLoading.value = true;
  try {
    await goalStore.restoreGoal(props.goal.uuid);
    ElMessage.success('目标已恢复');
  } catch (error: any) {
    ElMessage.error(error.message || '恢复失败');
  } finally {
    isLoading.value = false;
  }
}
</script>
```

---

## 5. 领域事件处理

### 5.1 统计模块监听

```typescript
// apps/api/src/modules/statistics/initialization/eventHandlers.ts

eventBus.on('GoalActivatedEvent', async (event) => {
  await statisticsService.incrementActiveGoalCount(event.payload.accountUuid);
});

eventBus.on('GoalCompletedEvent', async (event) => {
  await statisticsService.incrementCompletedGoalCount(event.payload.accountUuid);
  await statisticsService.decrementActiveGoalCount(event.payload.accountUuid);
});

eventBus.on('GoalArchivedEvent', async (event) => {
  if (event.payload.previousStatus === 'ACTIVE') {
    await statisticsService.decrementActiveGoalCount(event.payload.accountUuid);
  }
  await statisticsService.incrementArchivedGoalCount(event.payload.accountUuid);
});

eventBus.on('GoalDeletedEvent', async (event) => {
  // 从统计中移除
  await statisticsService.decrementGoalCount(
    event.payload.accountUuid,
    event.payload.previousStatus,
  );
});
```

---

## 6. 错误处理

### 6.1 状态转换异常

| 错误场景       | HTTP 状态码 | 错误信息               | 处理方式             |
| -------------- | ----------- | ---------------------- | -------------------- |
| 非法状态转换   | 400         | 当前状态无法执行该操作 | 前端禁用按钮         |
| 目标不存在     | 404         | 目标不存在             | 返回错误页面         |
| 无权操作       | 403         | 无权操作此目标         | 权限检查             |
| 关键结果未完成 | 400         | 部分关键结果未完成     | 提示用户选择强制完成 |

---

## 7. 测试用例

```typescript
describe('Goal Status Transitions', () => {
  describe('activate()', () => {
    it('should activate draft goal', () => {
      const goal = Goal.create({ ...params, status: 'DRAFT' });
      goal.activate();
      expect(goal.status).toBe('ACTIVE');
    });

    it('should throw error if not draft', () => {
      const goal = Goal.create({ ...params, status: 'ACTIVE' });
      expect(() => goal.activate()).toThrow('只能激活草稿状态的目标');
    });
  });

  describe('complete()', () => {
    it('should complete active goal when all key results done', () => {
      const goal = Goal.create({ ...params, status: 'ACTIVE' });
      goal.addKeyResult({ title: 'KR1', targetValue: 100, currentValue: 100 });
      goal.complete();
      expect(goal.status).toBe('COMPLETED');
    });

    it('should throw error if key results not done', () => {
      const goal = Goal.create({ ...params, status: 'ACTIVE' });
      goal.addKeyResult({ title: 'KR1', targetValue: 100, currentValue: 50 });
      expect(() => goal.complete()).toThrow('部分关键结果未完成');
    });

    it('should force complete when flag is true', () => {
      const goal = Goal.create({ ...params, status: 'ACTIVE' });
      goal.addKeyResult({ title: 'KR1', targetValue: 100, currentValue: 50 });
      goal.complete(true);
      expect(goal.status).toBe('COMPLETED');
    });
  });
});
```

---

## 8. 参考文档

- [创建目标流程](./CREATE_GOAL_FLOW.md)
- [Goal 模块设计规划](../GOAL_MODULE_PLAN.md)
- [状态机模式](https://refactoring.guru/design-patterns/state)
