# 任务实例生成流程设计文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-18
- **架构模式**: DDD (Task 模块)
- **相关模块**: Task, Reminder
- **业务场景**: 从任务模板生成任务实例

---

## 1. 业务概述

### 1.1 业务目标

TaskInstance（任务实例）是从 TaskTemplate（任务模板）生成的具体执行单元：

- **自动生成**: 根据模板的重复规则自动生成实例
- **批量创建**: 提前 N 天生成待执行的实例
- **独立管理**: 每个实例独立追踪状态和完成情况
- **提醒关联**: 实例生成后自动创建对应的提醒任务
- **实例复制**: 支持从模板直接复制生成单个实例

### 1.2 核心原则

- **模板不变性**: 生成后的实例与模板解耦，修改模板不影响已生成的实例
- **时间精确性**: 实例的计划时间根据模板规则精确计算
- **状态独立性**: 每个实例有独立的生命周期状态
- **批量优化**: 生成多个实例时使用批量插入优化性能

### 1.3 生成时机

| 触发场景 | 说明                 | 生成规则                                     |
| -------- | -------------------- | -------------------------------------------- |
| 模板激活 | 用户首次激活任务模板 | 根据 `generateAheadDays` 生成未来 N 天的实例 |
| 定时调度 | 每日凌晨自动检查     | 为即将到期的模板生成新实例                   |
| 手动生成 | 用户手动触发         | 生成指定日期范围的实例                       |
| 实例完成 | 完成一次性重复任务   | 自动生成下一次实例（可选）                   |

---

## 2. API 定义

### 2.1 自动生成（模板激活时）

在 [CREATE_TASK_TEMPLATE_FLOW](./CREATE_TASK_TEMPLATE_FLOW.md) 中，当 `activateImmediately = true` 时会自动调用此流程。

### 2.2 手动生成

```http
POST /api/task-templates/:templateUuid/generate-instances
```

#### 请求体

```typescript
interface GenerateTaskInstancesRequest {
  accountUuid: string;
  startDate: number;                   // 开始日期（timestamp）
  endDate: number;                     // 结束日期（timestamp）
  skipExisting?: boolean;              // 是否跳过已存在的实例（默认true）
}
```

#### 响应

```typescript
interface GenerateTaskInstancesResponse {
  instances: TaskInstanceClientDTO[];
  skippedCount: number;                // 跳过的实例数量
  message: string;
}

interface TaskInstanceClientDTO {
  uuid: string;
  templateUuid: string;
  accountUuid: string;
  instanceDate: number;                // 实例日期（timestamp）
  
  // 时间配置（继承自模板，可修改）
  timeConfig: {
    timeType: TimeType;
    scheduledTime: number | null;
    deadline: number | null;
    estimatedDuration: number | null;
  };
  
  status: TaskInstanceStatus;          // PENDING | IN_PROGRESS | COMPLETED | CANCELLED | DELETED
  
  // 完成记录
  completionRecord: {
    completedAt: number;
    actualDuration: number | null;
    note: string | null;
  } | null;
  
  // 跳过记录
  skipRecord: {
    skippedAt: number;
    reason: string | null;
  } | null;
  
  // 实际执行时间
  actualStartTime: number | null;
  actualEndTime: number | null;
  note: string | null;
  
  createdAt: number;
  updatedAt: number;
  
  // 前端计算字段
  isOverdue: boolean;                  // 是否逾期
  remainingTime: number | null;        // 剩余时间（分钟）
  progressPercentage: number;          // 进度百分比
}
```

---

## 3. 领域模型设计

### 3.1 TaskInstance 聚合根

```typescript
// TaskInstance.ts
export class TaskInstance extends AggregateRoot {
  private _templateUuid: string;
  private _accountUuid: string;
  private _instanceDate: number;               // 实例归属日期
  private _timeConfig: TaskTimeConfig;         // 值对象（可独立修改）
  private _status: TaskInstanceStatus;
  private _completionRecord: CompletionRecord | null;  // 值对象
  private _skipRecord: SkipRecord | null;      // 值对象
  private _actualStartTime: number | null;
  private _actualEndTime: number | null;
  private _note: string | null;
  private _createdAt: number;
  private _updatedAt: number;

  // 从模板创建实例
  public static createFromTemplate(
    template: TaskTemplate,
    instanceDate: number
  ): TaskInstance {
    const instance = new TaskInstance();
    instance._uuid = instance.generateUUID();
    instance._templateUuid = template.uuid;
    instance._accountUuid = template.accountUuid;
    instance._instanceDate = instanceDate;
    
    // 复制模板的时间配置
    instance._timeConfig = template.timeConfig.clone();
    
    // 调整时间到实例日期
    instance.adjustTimeToInstanceDate(instanceDate);
    
    instance._status = TaskInstanceStatus.PENDING;
    instance._completionRecord = null;
    instance._skipRecord = null;
    instance._actualStartTime = null;
    instance._actualEndTime = null;
    instance._note = null;
    instance._createdAt = Date.now();
    instance._updatedAt = Date.now();

    return instance;
  }

  // 调整时间配置到实例日期
  private adjustTimeToInstanceDate(instanceDate: number): void {
    const instanceDay = new Date(instanceDate);
    instanceDay.setHours(0, 0, 0, 0);

    if (this._timeConfig.scheduledTime) {
      const originalTime = new Date(this._timeConfig.scheduledTime);
      const hours = originalTime.getHours();
      const minutes = originalTime.getMinutes();
      
      const newTime = new Date(instanceDay);
      newTime.setHours(hours, minutes, 0, 0);
      
      this._timeConfig = this._timeConfig.withScheduledTime(newTime.getTime());
    }

    if (this._timeConfig.deadline) {
      const originalDeadline = new Date(this._timeConfig.deadline);
      const hours = originalDeadline.getHours();
      const minutes = originalDeadline.getMinutes();
      
      const newDeadline = new Date(instanceDay);
      newDeadline.setHours(hours, minutes, 0, 0);
      
      this._timeConfig = this._timeConfig.withDeadline(newDeadline.getTime());
    }
  }

  // 开始任务
  public start(): void {
    if (this._status !== TaskInstanceStatus.PENDING) {
      throw new Error('只能开始待处理状态的任务');
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
    if (this._status !== TaskInstanceStatus.PENDING && 
        this._status !== TaskInstanceStatus.IN_PROGRESS) {
      throw new Error('只能完成待处理或进行中的任务');
    }

    const now = Date.now();
    const actualDuration = this._actualStartTime
      ? Math.round((now - this._actualStartTime) / 60000)
      : null;

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
      },
    });
  }

  // 取消任务
  public cancel(reason?: string): void {
    if (this._status === TaskInstanceStatus.COMPLETED ||
        this._status === TaskInstanceStatus.CANCELLED) {
      throw new Error('不能取消已完成或已取消的任务');
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

  // Getter 方法
  public get templateUuid(): string {
    return this._templateUuid;
  }

  public get accountUuid(): string {
    return this._accountUuid;
  }

  public get instanceDate(): number {
    return this._instanceDate;
  }

  public get status(): TaskInstanceStatus {
    return this._status;
  }

  public get timeConfig(): TaskTimeConfig {
    return this._timeConfig;
  }

  // 判断是否逾期
  public isOverdue(): boolean {
    if (this._status === TaskInstanceStatus.COMPLETED ||
        this._status === TaskInstanceStatus.CANCELLED) {
      return false;
    }

    if (!this._timeConfig.deadline) {
      return false;
    }

    return Date.now() > this._timeConfig.deadline;
  }

  // 获取剩余时间（分钟）
  public getRemainingMinutes(): number | null {
    if (!this._timeConfig.deadline) {
      return null;
    }

    if (this._status === TaskInstanceStatus.COMPLETED ||
        this._status === TaskInstanceStatus.CANCELLED) {
      return null;
    }

    const remaining = Math.round((this._timeConfig.deadline - Date.now()) / 60000);
    return Math.max(0, remaining);
  }
}
```

### 3.2 CompletionRecord 值对象

```typescript
// CompletionRecord.ts
export class CompletionRecord {
  private readonly _completedAt: number;
  private readonly _actualDuration: number | null;
  private readonly _note: string | null;

  private constructor(
    completedAt: number,
    actualDuration: number | null,
    note: string | null
  ) {
    this._completedAt = completedAt;
    this._actualDuration = actualDuration;
    this._note = note;
  }

  public static create(params: {
    completedAt: number;
    actualDuration: number | null;
    note: string | null;
  }): CompletionRecord {
    return new CompletionRecord(
      params.completedAt,
      params.actualDuration,
      params.note
    );
  }

  public get completedAt(): number {
    return this._completedAt;
  }

  public get actualDuration(): number | null {
    return this._actualDuration;
  }

  public get note(): string | null {
    return this._note;
  }
}
```

---

## 4. 应用服务

```typescript
// TaskInstanceApplicationService.ts
export class TaskInstanceApplicationService {
  constructor(
    private taskTemplateRepository: ITaskTemplateRepository,
    private taskInstanceRepository: ITaskInstanceRepository,
    private reminderService: IReminderService,
    private eventBus: IEventBus
  ) {}

  async generateInstances(
    templateUuid: string,
    request: GenerateTaskInstancesRequest
  ): Promise<GenerateTaskInstancesResponse> {
    // 1. 加载模板
    const template = await this.taskTemplateRepository.findByUuid(templateUuid);
    if (!template) {
      throw new Error('任务模板不存在');
    }

    // 2. 权限检查
    if (template.accountUuid !== request.accountUuid) {
      throw new Error('无权操作此任务模板');
    }

    // 3. 状态检查
    if (template.status !== TaskTemplateStatus.ACTIVE) {
      throw new Error('只能为激活状态的模板生成实例');
    }

    // 4. 查询已存在的实例
    const existingInstances = await this.taskInstanceRepository.findByTemplateAndDateRange(
      templateUuid,
      request.startDate,
      request.endDate
    );
    const existingDates = new Set(
      existingInstances.map(i => this.normalizeDate(i.instanceDate))
    );

    // 5. 计算需要生成的日期
    const datesToGenerate = this.calculateGenerationDates(
      template,
      request.startDate,
      request.endDate
    );

    // 6. 过滤已存在的日期
    const newDates = request.skipExisting
      ? datesToGenerate.filter(date => !existingDates.has(this.normalizeDate(date)))
      : datesToGenerate;

    // 7. 生成实例
    const instances: TaskInstance[] = [];
    newDates.forEach(date => {
      const instance = TaskInstance.createFromTemplate(template, date);
      instances.push(instance);
    });

    // 8. 批量保存
    if (instances.length > 0) {
      await this.taskInstanceRepository.saveAll(instances);
    }

    // 9. 为每个实例创建提醒
    for (const instance of instances) {
      if (template.reminderConfig) {
        await this.reminderService.createTaskReminders(instance, template.reminderConfig);
      }
    }

    // 10. 发布事件
    instances.forEach(instance => {
      this.publishDomainEvents(instance);
    });

    // 11. 更新模板的最后生成日期
    template.updateLastGeneratedDate(Date.now());
    await this.taskTemplateRepository.save(template);

    return {
      instances: instances.map(i => i.toClientDTO()),
      skippedCount: datesToGenerate.length - newDates.length,
      message: `成功生成 ${instances.length} 个任务实例${
        request.skipExisting && existingDates.size > 0
          ? `，跳过 ${datesToGenerate.length - newDates.length} 个已存在的实例`
          : ''
      }`,
    };
  }

  private calculateGenerationDates(
    template: TaskTemplate,
    startDate: number,
    endDate: number
  ): number[] {
    if (template.taskType === TaskType.ONE_TIME) {
      // 一次性任务只生成一次
      const taskDate = template.timeConfig.scheduledTime || startDate;
      return taskDate >= startDate && taskDate <= endDate ? [taskDate] : [];
    }

    if (!template.recurrenceRule) {
      throw new Error('重复任务缺少重复规则');
    }

    // 使用重复规则计算日期
    return template.recurrenceRule.getOccurrencesUntil(startDate, endDate);
  }

  private normalizeDate(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  private publishDomainEvents(instance: TaskInstance): void {
    const events = instance.getDomainEvents();
    events.forEach(event => {
      this.eventBus.publish(event);
    });
    instance.clearDomainEvents();
  }
}
```

---

## 5. 定时调度服务

```typescript
// TaskInstanceScheduler.ts
export class TaskInstanceScheduler {
  constructor(
    private taskTemplateRepository: ITaskTemplateRepository,
    private taskInstanceService: TaskInstanceApplicationService
  ) {}

  // 每日凌晨执行
  async generateUpcomingInstances(): Promise<void> {
    console.log('[TaskScheduler] 开始生成即将到期的任务实例...');

    // 1. 获取所有激活的任务模板
    const activeTemplates = await this.taskTemplateRepository.findByStatus(
      TaskTemplateStatus.ACTIVE
    );

    console.log(`[TaskScheduler] 找到 ${activeTemplates.length} 个激活的模板`);

    const now = Date.now();
    const results = {
      processed: 0,
      generated: 0,
      failed: 0,
    };

    // 2. 为每个模板生成实例
    for (const template of activeTemplates) {
      try {
        const endDate = now + template.generateAheadDays * 24 * 60 * 60 * 1000;

        const response = await this.taskInstanceService.generateInstances(
          template.uuid,
          {
            accountUuid: template.accountUuid,
            startDate: now,
            endDate,
            skipExisting: true,
          }
        );

        results.processed++;
        results.generated += response.instances.length;

        console.log(
          `[TaskScheduler] 模板 "${template.title}" 生成了 ${response.instances.length} 个实例`
        );
      } catch (error) {
        results.failed++;
        console.error(
          `[TaskScheduler] 模板 "${template.title}" 生成实例失败:`,
          error
        );
      }
    }

    console.log('[TaskScheduler] 任务实例生成完成:', results);
  }
}

// 注册定时任务（Cron 表达式: 每天凌晨 2 点执行）
// cron.schedule('0 2 * * *', () => {
//   const scheduler = new TaskInstanceScheduler(
//     taskTemplateRepository,
//     taskInstanceService
//   );
//   scheduler.generateUpcomingInstances();
// });
```

---

## 6. 数据库模型

```prisma
model TaskInstance {
  uuid                String    @id @default(uuid())
  templateUuid        String
  accountUuid         String
  instanceDate        DateTime              // 实例归属日期
  
  // 时间配置（JSON，可独立修改）
  timeConfig          Json
  
  status              String    @default("PENDING")
  
  // 完成记录（JSON，可选）
  completionRecord    Json?
  
  // 跳过记录（JSON，可选）
  skipRecord          Json?
  
  actualStartTime     DateTime?
  actualEndTime       DateTime?
  note                String?   @db.Text
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // 关系
  template            TaskTemplate @relation(fields: [templateUuid], references: [uuid], onDelete: Cascade)
  account             Account      @relation(fields: [accountUuid], references: [uuid])

  @@index([templateUuid])
  @@index([accountUuid])
  @@index([instanceDate])
  @@index([status])
  @@unique([templateUuid, instanceDate]) // 同一模板同一天只能有一个实例
  @@map("task_instances")
}
```

---

## 7. 前端实现

### 7.1 手动生成实例对话框

```vue
<!-- GenerateInstancesDialog.vue -->
<template>
  <el-dialog
    v-model="visible"
    title="生成任务实例"
    width="500px"
  >
    <el-alert
      type="info"
      :closable="false"
      show-icon
    >
      <template #title>
        模板: {{ template?.title }}
      </template>
      根据任务模板的重复规则生成指定日期范围内的任务实例。
    </el-alert>

    <el-form 
      :model="form"
      label-width="100px"
      class="mt-4"
    >
      <el-form-item label="开始日期">
        <el-date-picker
          v-model="startDate"
          type="date"
          placeholder="选择开始日期"
        />
      </el-form-item>

      <el-form-item label="结束日期">
        <el-date-picker
          v-model="endDate"
          type="date"
          placeholder="选择结束日期"
        />
      </el-form-item>

      <el-form-item label="跳过已有">
        <el-switch v-model="form.skipExisting" />
        <span class="ml-2 text-sm text-gray-500">
          跳过已经生成的实例
        </span>
      </el-form-item>

      <el-form-item>
        <el-text type="info">
          预计生成约 {{ estimatedCount }} 个实例
        </el-text>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button 
        type="primary"
        @click="handleGenerate"
        :loading="isGenerating"
      >
        生成实例
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { useTaskStore } from '../stores/taskStore';

const props = defineProps<{
  template: any;
}>();

const taskStore = useTaskStore();
const visible = defineModel<boolean>('visible', { required: true });
const isGenerating = ref(false);

const startDate = ref(new Date());
const endDate = ref(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30天后

const form = ref({
  skipExisting: true,
});

const estimatedCount = computed(() => {
  if (!props.template || !startDate.value || !endDate.value) {
    return 0;
  }

  const start = startDate.value.getTime();
  const end = endDate.value.getTime();
  const days = Math.ceil((end - start) / (24 * 60 * 60 * 1000));

  if (props.template.taskType === 'ONE_TIME') {
    return 1;
  }

  if (props.template.taskType === 'DAILY') {
    return days;
  }

  if (props.template.taskType === 'WEEKLY') {
    return Math.ceil(days / 7);
  }

  if (props.template.taskType === 'MONTHLY') {
    return Math.ceil(days / 30);
  }

  return '?';
});

async function handleGenerate() {
  isGenerating.value = true;
  try {
    const response = await taskStore.generateTaskInstances(props.template.uuid, {
      startDate: startDate.value.getTime(),
      endDate: endDate.value.getTime(),
      skipExisting: form.value.skipExisting,
    });

    ElMessage.success(response.message);
    visible.value = false;
  } catch (error: any) {
    ElMessage.error(error.message || '生成失败');
  } finally {
    isGenerating.value = false;
  }
}
</script>
```

---

## 8. 参考文档

- [创建任务模板流程](./CREATE_TASK_TEMPLATE_FLOW.md)
- [Task 模块设计规划](../TASK_MODULE_PLAN.md)
- [Goal 模块设计参考](../../goal/GOAL_MODULE_PLAN.md)
