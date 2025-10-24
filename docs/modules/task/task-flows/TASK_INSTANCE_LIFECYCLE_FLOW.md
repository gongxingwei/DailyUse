# 任务实例生命周期流程设计文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-18
- **架构模式**: DDD (Task 模块)
- **相关模块**: Task, Reminder, Statistics
- **业务场景**: 任务实例状态转换（开始/完成/取消/重新安排）

---

## 1. 业务概述

### 1.1 业务目标

TaskInstance 从创建到完成经历多个状态转换：

- **开始任务**: 从待处理转为进行中
- **完成任务**: 标记任务为已完成，记录实际时长
- **取消任务**: 取消不再执行的任务
- **跳过任务**: 跳过本次重复任务
- **撤销完成**: 重新打开已完成的任务
- **重新安排**: 修改任务的计划时间或截止时间

### 1.2 核心原则

- **状态机模式**: 严格的状态转换规则
- **时间追踪**: 记录实际开始、结束时间和时长
- **原子性**: 状态转换和相关数据更新在同一事务中完成
- **事件驱动**: 每次状态转换发布领域事件
- **统计更新**: 完成任务时自动更新统计数据

### 1.3 状态机图

```plaintext
        ┌─────────┐
        │ PENDING │ (待处理)
        └────┬────┘
             │ start()
             ▼
        ┌─────────────┐      complete()      ┌───────────┐
    ┌──▶│ IN_PROGRESS ├─────────────────────▶│ COMPLETED │
    │   └──────┬──────┘                      └─────┬─────┘
    │          │                                   │
    │          │                       undoComplete()
    │          │                                   │
    │          ▼                                   │
    │   ┌───────────┐                             │
    │   │ CANCELLED │◀────────────────────────────┘
    │   └───────────┘
    │          ▲
    │          │ cancel() / skip()
    │          │
    └──────────┘

    任意状态 ──softDelete()──▶ DELETED
```

### 1.4 状态转换规则表

| 当前状态    | 可转换到    | 触发方法          | 业务规则     |
| ----------- | ----------- | ----------------- | ------------ |
| PENDING     | IN_PROGRESS | start()           | 无           |
| PENDING     | CANCELLED   | cancel() / skip() | 无           |
| PENDING     | DELETED     | softDelete()      | 无           |
| IN_PROGRESS | COMPLETED   | complete()        | 记录实际时长 |
| IN_PROGRESS | CANCELLED   | cancel()          | 无           |
| IN_PROGRESS | DELETED     | softDelete()      | 无           |
| COMPLETED   | IN_PROGRESS | undoComplete()    | 清除完成记录 |
| COMPLETED   | DELETED     | softDelete()      | 无           |
| CANCELLED   | PENDING     | reschedule()      | 重新安排时间 |
| CANCELLED   | DELETED     | softDelete()      | 无           |

---

## 2. API 定义

### 2.1 开始任务

```http
PUT /api/task-instances/:uuid/start
```

#### 请求体

```typescript
interface StartTaskInstanceRequest {
  accountUuid: string;
}
```

#### 响应

```typescript
interface StartTaskInstanceResponse {
  instance: TaskInstanceClientDTO;
  message: string;
}
```

### 2.2 完成任务

```http
PUT /api/task-instances/:uuid/complete
```

#### 请求体

```typescript
interface CompleteTaskInstanceRequest {
  accountUuid: string;
  note?: string | null; // 完成备注
}
```

#### 响应

```typescript
interface CompleteTaskInstanceResponse {
  instance: TaskInstanceClientDTO;
  statistics: {
    totalCompleted: number; // 今日完成总数
    completionRate: number; // 完成率
  };
  message: string;
}
```

### 2.3 撤销完成

```http
PUT /api/task-instances/:uuid/undo-complete
```

#### 请求体

```typescript
interface UndoCompleteTaskInstanceRequest {
  accountUuid: string;
}
```

### 2.4 取消任务

```http
PUT /api/task-instances/:uuid/cancel
```

#### 请求体

```typescript
interface CancelTaskInstanceRequest {
  accountUuid: string;
  reason?: string | null; // 取消原因
}
```

### 2.5 跳过任务

```http
PUT /api/task-instances/:uuid/skip
```

#### 请求体

```typescript
interface SkipTaskInstanceRequest {
  accountUuid: string;
  reason?: string | null; // 跳过原因
}
```

### 2.6 重新安排

```http
PUT /api/task-instances/:uuid/reschedule
```

#### 请求体

```typescript
interface RescheduleTaskInstanceRequest {
  accountUuid: string;
  newScheduledTime?: number | null; // 新的计划时间
  newDeadline?: number | null; // 新的截止时间
  resetStatus?: boolean; // 是否重置状态为PENDING
}
```

---

## 3. 领域逻辑

### 3.1 TaskInstance 状态转换方法

```typescript
// TaskInstance.ts (续)
export class TaskInstance extends AggregateRoot {
  // ... 前面的代码 ...

  // 开始任务
  public start(): void {
    if (this._status !== TaskInstanceStatus.PENDING) {
      throw new Error(`只能开始待处理状态的任务，当前状态: ${this._status}`);
    }

    this._status = TaskInstanceStatus.IN_PROGRESS;
    this._actualStartTime = Date.now();
    this._updatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'TaskInstanceStartedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        instanceUuid: this._uuid,
        templateUuid: this._templateUuid,
        accountUuid: this._accountUuid,
        startedAt: this._actualStartTime,
      },
    });
  }

  // 完成任务
  public complete(note?: string): void {
    if (
      this._status !== TaskInstanceStatus.PENDING &&
      this._status !== TaskInstanceStatus.IN_PROGRESS
    ) {
      throw new Error(`只能完成待处理或进行中的任务，当前状态: ${this._status}`);
    }

    const now = Date.now();

    // 计算实际时长
    let actualDuration: number | null = null;
    if (this._actualStartTime) {
      actualDuration = Math.round((now - this._actualStartTime) / 60000);
    } else if (this._timeConfig.estimatedDuration) {
      // 如果没有开始时间，使用预估时长
      actualDuration = this._timeConfig.estimatedDuration;
    }

    this._status = TaskInstanceStatus.COMPLETED;
    this._actualEndTime = now;
    this._completionRecord = CompletionRecord.create({
      completedAt: now,
      actualDuration,
      note: note || null,
    });
    this._updatedAt = now;

    this.addDomainEvent({
      eventType: 'TaskInstanceCompletedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        instanceUuid: this._uuid,
        templateUuid: this._templateUuid,
        accountUuid: this._accountUuid,
        completedAt: now,
        actualDuration,
        isOnTime: this._timeConfig.deadline ? now <= this._timeConfig.deadline : true,
      },
    });
  }

  // 撤销完成
  public undoComplete(): void {
    if (this._status !== TaskInstanceStatus.COMPLETED) {
      throw new Error('只能撤销已完成的任务');
    }

    this._status = TaskInstanceStatus.IN_PROGRESS;
    this._completionRecord = null;
    this._actualEndTime = null;
    this._updatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'TaskInstanceUndoCompletedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        instanceUuid: this._uuid,
        templateUuid: this._templateUuid,
        accountUuid: this._accountUuid,
      },
    });
  }

  // 取消任务
  public cancel(reason?: string): void {
    if (this._status === TaskInstanceStatus.COMPLETED) {
      throw new Error('不能取消已完成的任务，请先撤销完成');
    }
    if (this._status === TaskInstanceStatus.CANCELLED) {
      throw new Error('任务已经是取消状态');
    }

    this._status = TaskInstanceStatus.CANCELLED;
    this._note = reason || null;
    this._updatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'TaskInstanceCancelledEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        instanceUuid: this._uuid,
        templateUuid: this._templateUuid,
        accountUuid: this._accountUuid,
        cancelledAt: Date.now(),
        reason,
      },
    });
  }

  // 跳过任务（用于重复任务）
  public skip(reason?: string): void {
    if (this._status !== TaskInstanceStatus.PENDING) {
      throw new Error('只能跳过待处理状态的任务');
    }

    this._status = TaskInstanceStatus.CANCELLED;
    this._skipRecord = SkipRecord.create({
      skippedAt: Date.now(),
      reason: reason || null,
    });
    this._updatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'TaskInstanceSkippedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        instanceUuid: this._uuid,
        templateUuid: this._templateUuid,
        accountUuid: this._accountUuid,
        skippedAt: Date.now(),
        reason,
      },
    });
  }

  // 重新安排
  public reschedule(params: {
    newScheduledTime?: number | null;
    newDeadline?: number | null;
    resetStatus?: boolean;
  }): void {
    if (this._status === TaskInstanceStatus.COMPLETED) {
      throw new Error('不能重新安排已完成的任务');
    }

    // 验证时间逻辑
    if (params.newScheduledTime && params.newDeadline) {
      if (params.newScheduledTime >= params.newDeadline) {
        throw new Error('计划时间必须早于截止时间');
      }
    }

    // 更新时间配置
    if (params.newScheduledTime !== undefined) {
      this._timeConfig = this._timeConfig.withScheduledTime(params.newScheduledTime);
    }
    if (params.newDeadline !== undefined) {
      this._timeConfig = this._timeConfig.withDeadline(params.newDeadline);
    }

    // 重置状态（可选）
    if (params.resetStatus && this._status === TaskInstanceStatus.CANCELLED) {
      this._status = TaskInstanceStatus.PENDING;
      this._actualStartTime = null;
      this._skipRecord = null;
      this._note = null;
    }

    this._updatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'TaskInstanceRescheduledEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        instanceUuid: this._uuid,
        templateUuid: this._templateUuid,
        accountUuid: this._accountUuid,
        oldScheduledTime: this._timeConfig.scheduledTime,
        newScheduledTime: params.newScheduledTime,
        oldDeadline: this._timeConfig.deadline,
        newDeadline: params.newDeadline,
      },
    });
  }

  // 软删除
  public softDelete(): void {
    if (this._status === TaskInstanceStatus.IN_PROGRESS) {
      throw new Error('不能删除进行中的任务，请先取消');
    }

    this._status = TaskInstanceStatus.DELETED;
    this._updatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'TaskInstanceDeletedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        instanceUuid: this._uuid,
        templateUuid: this._templateUuid,
        accountUuid: this._accountUuid,
      },
    });
  }
}
```

---

## 4. 应用服务

```typescript
// TaskInstanceApplicationService.ts (续)
export class TaskInstanceApplicationService {
  // ... 前面的代码 ...

  async startTask(
    instanceUuid: string,
    request: StartTaskInstanceRequest,
  ): Promise<StartTaskInstanceResponse> {
    // 1. 加载实例
    const instance = await this.taskInstanceRepository.findByUuid(instanceUuid);
    if (!instance) {
      throw new Error('任务实例不存在');
    }

    // 2. 权限检查
    if (instance.accountUuid !== request.accountUuid) {
      throw new Error('无权操作此任务实例');
    }

    // 3. 执行开始操作
    instance.start();

    // 4. 持久化
    await this.taskInstanceRepository.save(instance);

    // 5. 发布事件
    this.publishDomainEvents(instance);

    return {
      instance: instance.toClientDTO(),
      message: '任务已开始',
    };
  }

  async completeTask(
    instanceUuid: string,
    request: CompleteTaskInstanceRequest,
  ): Promise<CompleteTaskInstanceResponse> {
    // 1. 加载实例
    const instance = await this.taskInstanceRepository.findByUuid(instanceUuid);
    if (!instance) {
      throw new Error('任务实例不存在');
    }

    // 2. 权限检查
    if (instance.accountUuid !== request.accountUuid) {
      throw new Error('无权操作此任务实例');
    }

    // 3. 执行完成操作
    instance.complete(request.note);

    // 4. 持久化
    await this.taskInstanceRepository.save(instance);

    // 5. 发布事件
    this.publishDomainEvents(instance);

    // 6. 获取统计数据
    const statistics = await this.statisticsService.getTaskStatistics(request.accountUuid);

    return {
      instance: instance.toClientDTO(),
      statistics: {
        totalCompleted: statistics.todayCompleted,
        completionRate: statistics.completionRate,
      },
      message: '任务已完成',
    };
  }

  async undoCompleteTask(
    instanceUuid: string,
    request: UndoCompleteTaskInstanceRequest,
  ): Promise<TaskInstanceClientDTO> {
    const instance = await this.taskInstanceRepository.findByUuid(instanceUuid);
    if (!instance) {
      throw new Error('任务实例不存在');
    }

    if (instance.accountUuid !== request.accountUuid) {
      throw new Error('无权操作此任务实例');
    }

    instance.undoComplete();
    await this.taskInstanceRepository.save(instance);
    this.publishDomainEvents(instance);

    return instance.toClientDTO();
  }

  async cancelTask(
    instanceUuid: string,
    request: CancelTaskInstanceRequest,
  ): Promise<TaskInstanceClientDTO> {
    const instance = await this.taskInstanceRepository.findByUuid(instanceUuid);
    if (!instance) {
      throw new Error('任务实例不存在');
    }

    if (instance.accountUuid !== request.accountUuid) {
      throw new Error('无权操作此任务实例');
    }

    instance.cancel(request.reason);
    await this.taskInstanceRepository.save(instance);
    this.publishDomainEvents(instance);

    return instance.toClientDTO();
  }

  async skipTask(
    instanceUuid: string,
    request: SkipTaskInstanceRequest,
  ): Promise<TaskInstanceClientDTO> {
    const instance = await this.taskInstanceRepository.findByUuid(instanceUuid);
    if (!instance) {
      throw new Error('任务实例不存在');
    }

    if (instance.accountUuid !== request.accountUuid) {
      throw new Error('无权操作此任务实例');
    }

    instance.skip(request.reason);
    await this.taskInstanceRepository.save(instance);
    this.publishDomainEvents(instance);

    return instance.toClientDTO();
  }

  async rescheduleTask(
    instanceUuid: string,
    request: RescheduleTaskInstanceRequest,
  ): Promise<TaskInstanceClientDTO> {
    const instance = await this.taskInstanceRepository.findByUuid(instanceUuid);
    if (!instance) {
      throw new Error('任务实例不存在');
    }

    if (instance.accountUuid !== request.accountUuid) {
      throw new Error('无权操作此任务实例');
    }

    instance.reschedule({
      newScheduledTime: request.newScheduledTime,
      newDeadline: request.newDeadline,
      resetStatus: request.resetStatus,
    });

    await this.taskInstanceRepository.save(instance);
    this.publishDomainEvents(instance);

    // 更新提醒时间
    if (request.newScheduledTime || request.newDeadline) {
      await this.reminderService.updateTaskReminders(instance);
    }

    return instance.toClientDTO();
  }
}
```

---

## 5. 前端实现

### 5.1 任务实例操作按钮

```vue
<!-- TaskInstanceActions.vue -->
<template>
  <div class="task-actions">
    <!-- 待处理状态 -->
    <template v-if="instance.status === 'PENDING'">
      <el-button type="primary" size="small" @click="handleStart" :loading="isOperating">
        <el-icon><VideoPlay /></el-icon>
        开始
      </el-button>

      <el-button type="success" size="small" @click="handleComplete" :loading="isOperating">
        <el-icon><Check /></el-icon>
        完成
      </el-button>

      <el-dropdown @command="handleCommand">
        <el-button size="small">
          更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="skip">
              <el-icon><Close /></el-icon>
              跳过
            </el-dropdown-item>
            <el-dropdown-item command="reschedule">
              <el-icon><Clock /></el-icon>
              重新安排
            </el-dropdown-item>
            <el-dropdown-item command="cancel" divided>
              <el-icon><CircleClose /></el-icon>
              取消
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>

    <!-- 进行中状态 -->
    <template v-else-if="instance.status === 'IN_PROGRESS'">
      <el-button type="success" size="small" @click="handleComplete" :loading="isOperating">
        <el-icon><Check /></el-icon>
        完成
      </el-button>

      <el-button size="small" @click="handleCancel" :loading="isOperating">
        <el-icon><CircleClose /></el-icon>
        取消
      </el-button>
    </template>

    <!-- 已完成状态 -->
    <template v-else-if="instance.status === 'COMPLETED'">
      <el-tag type="success" size="large">
        <el-icon><CircleCheck /></el-icon>
        已完成
      </el-tag>

      <el-button
        type="warning"
        size="small"
        text
        @click="handleUndoComplete"
        :loading="isOperating"
      >
        <el-icon><RefreshLeft /></el-icon>
        撤销
      </el-button>
    </template>

    <!-- 已取消状态 -->
    <template v-else-if="instance.status === 'CANCELLED'">
      <el-tag type="info" size="large">
        <el-icon><CircleClose /></el-icon>
        已取消
      </el-tag>

      <el-button size="small" text @click="handleReschedule" :loading="isOperating">
        <el-icon><Clock /></el-icon>
        重新安排
      </el-button>
    </template>

    <!-- 重新安排对话框 -->
    <el-dialog v-model="showRescheduleDialog" title="重新安排任务" width="500px">
      <el-form label-width="100px">
        <el-form-item label="计划时间">
          <el-date-picker
            v-model="rescheduleForm.scheduledTime"
            type="datetime"
            placeholder="选择新的计划时间"
          />
        </el-form-item>

        <el-form-item label="截止时间">
          <el-date-picker
            v-model="rescheduleForm.deadline"
            type="datetime"
            placeholder="选择新的截止时间"
          />
        </el-form-item>

        <el-form-item label="重置状态">
          <el-switch v-model="rescheduleForm.resetStatus" />
          <span class="ml-2 text-sm text-gray-500"> 将状态重置为待处理 </span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showRescheduleDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmReschedule" :loading="isOperating">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  VideoPlay,
  Check,
  Close,
  Clock,
  CircleClose,
  CircleCheck,
  RefreshLeft,
  ArrowDown,
} from '@element-plus/icons-vue';
import { useTaskStore } from '../stores/taskStore';

const props = defineProps<{
  instance: any;
}>();

const taskStore = useTaskStore();
const isOperating = ref(false);
const showRescheduleDialog = ref(false);

const rescheduleForm = ref({
  scheduledTime: null as Date | null,
  deadline: null as Date | null,
  resetStatus: true,
});

async function handleStart() {
  isOperating.value = true;
  try {
    await taskStore.startTaskInstance(props.instance.uuid);
    ElMessage.success('任务已开始');
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    isOperating.value = false;
  }
}

async function handleComplete() {
  isOperating.value = true;
  try {
    const { value: note } = await ElMessageBox.prompt('添加完成备注（可选）', '完成任务', {
      confirmButtonText: '完成',
      cancelButtonText: '取消',
      inputType: 'textarea',
    });

    await taskStore.completeTaskInstance(props.instance.uuid, { note });

    ElMessage.success({
      message: '任务已完成！',
      type: 'success',
      duration: 3000,
    });
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败');
    }
  } finally {
    isOperating.value = false;
  }
}

async function handleUndoComplete() {
  isOperating.value = true;
  try {
    await ElMessageBox.confirm('确定要撤销完成吗？', '提示', { type: 'warning' });

    await taskStore.undoCompleteTaskInstance(props.instance.uuid);
    ElMessage.info('已撤销完成');
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败');
    }
  } finally {
    isOperating.value = false;
  }
}

async function handleCancel() {
  isOperating.value = true;
  try {
    const { value: reason } = await ElMessageBox.prompt('取消原因（可选）', '取消任务', {
      confirmButtonText: '确定',
      cancelButtonText: '返回',
      inputType: 'textarea',
    });

    await taskStore.cancelTaskInstance(props.instance.uuid, { reason });
    ElMessage.info('任务已取消');
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败');
    }
  } finally {
    isOperating.value = false;
  }
}

async function handleCommand(command: string) {
  if (command === 'skip') {
    await handleSkip();
  } else if (command === 'reschedule') {
    handleReschedule();
  } else if (command === 'cancel') {
    await handleCancel();
  }
}

async function handleSkip() {
  isOperating.value = true;
  try {
    const { value: reason } = await ElMessageBox.prompt('跳过原因（可选）', '跳过任务', {
      confirmButtonText: '跳过',
      cancelButtonText: '取消',
      inputType: 'textarea',
    });

    await taskStore.skipTaskInstance(props.instance.uuid, { reason });
    ElMessage.info('任务已跳过');
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败');
    }
  } finally {
    isOperating.value = false;
  }
}

function handleReschedule() {
  rescheduleForm.value = {
    scheduledTime: props.instance.timeConfig.scheduledTime
      ? new Date(props.instance.timeConfig.scheduledTime)
      : null,
    deadline: props.instance.timeConfig.deadline
      ? new Date(props.instance.timeConfig.deadline)
      : null,
    resetStatus: props.instance.status === 'CANCELLED',
  };
  showRescheduleDialog.value = true;
}

async function confirmReschedule() {
  isOperating.value = true;
  try {
    await taskStore.rescheduleTaskInstance(props.instance.uuid, {
      newScheduledTime: rescheduleForm.value.scheduledTime?.getTime() || null,
      newDeadline: rescheduleForm.value.deadline?.getTime() || null,
      resetStatus: rescheduleForm.value.resetStatus,
    });

    ElMessage.success('任务已重新安排');
    showRescheduleDialog.value = false;
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    isOperating.value = false;
  }
}
</script>

<style scoped>
.task-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
```

---

## 6. 事件处理

### 6.1 统计模块事件处理

```typescript
// apps/api/src/modules/statistics/initialization/eventHandlers.ts

eventBus.on('TaskInstanceCompletedEvent', async (event) => {
  const { accountUuid, templateUuid, completedAt, actualDuration, isOnTime } = event.payload;

  // 更新任务统计
  await statisticsService.incrementTaskCompleted(accountUuid, {
    completedAt,
    actualDuration,
    isOnTime,
  });

  // 更新模板统计
  await statisticsService.updateTemplateStatistics(templateUuid, {
    incrementCompleted: 1,
    addDuration: actualDuration,
  });
});

eventBus.on('TaskInstanceUndoCompletedEvent', async (event) => {
  const { accountUuid, templateUuid } = event.payload;

  // 减少完成计数
  await statisticsService.decrementTaskCompleted(accountUuid);

  // 更新模板统计
  await statisticsService.updateTemplateStatistics(templateUuid, {
    decrementCompleted: 1,
  });
});
```

---

## 7. 参考文档

- [生成任务实例流程](./GENERATE_TASK_INSTANCE_FLOW.md)
- [创建任务模板流程](./CREATE_TASK_TEMPLATE_FLOW.md)
- [Goal 状态转换流程](../../goal/goal-flows/GOAL_STATUS_TRANSITION_FLOW.md)
- [Task 模块设计规划](../TASK_MODULE_PLAN.md)
