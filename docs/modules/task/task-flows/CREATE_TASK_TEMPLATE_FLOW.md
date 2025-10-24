# 创建任务模板流程设计文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-18
- **架构模式**: DDD (Task 模块)
- **相关模块**: Task, Reminder, Statistics
- **业务场景**: 创建任务模板（包含步骤、重复规则、提醒配置）

---

## 1. 业务概述

### 1.1 业务目标

用户通过提供任务信息（标题、描述、时间配置、重复规则等）创建任务模板，系统需要：

- 验证信息的合法性（标题非空、时间配置合理）
- 创建 TaskTemplate 聚合根并设置初始状态
- 创建任务步骤（TaskStep）实体（可选）
- 配置重复规则（RecurrenceRule）
- 配置提醒规则（ReminderConfig）
- 关联目标或关键结果（可选）
- 发布领域事件通知相关模块
- 自动生成首批任务实例（如果立即激活）

### 1.2 核心原则

- **模板驱动**: TaskTemplate 是生成 TaskInstance 的蓝图
- **时间管理**: 支持一次性任务、重复任务（每日/每周/每月/自定义）
- **步骤分解**: 复杂任务支持子步骤（CheckList 模式）
- **智能提醒**: 支持多种提醒时机（开始前/截止前/自定义时间）
- **目标绑定**: 任务可关联目标（Goal）或关键结果（KeyResult）

### 1.3 任务类型

| 类型     | 说明       | 示例         |
| -------- | ---------- | ------------ |
| ONE_TIME | 一次性任务 | 完成项目报告 |
| DAILY    | 每日重复   | 每日站会     |
| WEEKLY   | 每周重复   | 周一健身     |
| MONTHLY  | 每月重复   | 月度总结     |
| CUSTOM   | 自定义重复 | 每隔3天复习  |

---

## 2. API 定义

### 2.1 HTTP API

```http
POST /api/task-templates
```

### 2.2 请求体

```typescript
interface CreateTaskTemplateRequest {
  accountUuid: string;

  // 基本信息
  title: string; // 标题（必填，最大100字符）
  description?: string | null; // 描述
  taskType: TaskType; // ONE_TIME | DAILY | WEEKLY | MONTHLY | CUSTOM

  // 时间配置
  timeConfig: {
    timeType: TimeType; // SCHEDULED | DEADLINE | FLOATING
    scheduledTime?: number | null; // 计划开始时间（timestamp）
    deadline?: number | null; // 截止时间（timestamp）
    estimatedDuration?: number | null; // 预计时长（分钟）
    reminderLeadMinutes?: number | null; // 提前提醒时间（分钟）
  };

  // 重复规则（可选）
  recurrenceRule?: {
    frequency: RecurrenceFrequency; // DAILY | WEEKLY | MONTHLY | YEARLY | CUSTOM
    interval: number; // 间隔（如每2天 = 2）
    byWeekday?: number[] | null; // 周几重复（0=周日, 1=周一...）
    byMonthDay?: number[] | null; // 每月几号重复
    count?: number | null; // 重复次数（null 表示无限）
    until?: number | null; // 重复截止日期（timestamp）
  } | null;

  // 提醒配置（可选）
  reminderConfig?: {
    enabled: boolean;
    reminders: Array<{
      minutesBefore: number; // 提前多少分钟提醒
      notificationTitle?: string | null;
      notificationBody?: string | null;
    }>;
  } | null;

  // 重要性与紧急性
  importance: ImportanceLevel; // LOW | MEDIUM | HIGH | CRITICAL
  urgency: UrgencyLevel; // LOW | MEDIUM | HIGH | URGENT

  // 目标绑定（可选）
  goalBinding?: {
    goalUuid?: string | null;
    keyResultUuid?: string | null;
  } | null;

  // 组织
  folderUuid?: string | null; // 所属文件夹
  tags?: string[]; // 标签
  color?: string | null; // 主题色（hex）

  // 任务步骤（可选）
  steps?: Array<{
    title: string;
    description?: string | null;
    orderIndex: number;
    estimatedMinutes?: number | null;
  }>;

  // 生成配置
  generateAheadDays?: number; // 提前生成天数（默认7天）
  activateImmediately?: boolean; // 是否立即激活（默认false）
}
```

### 2.3 响应体

```typescript
interface CreateTaskTemplateResponse {
  template: TaskTemplateClientDTO;
  instances: TaskInstanceClientDTO[]; // 如果立即激活，返回生成的实例
  message: string;
}

interface TaskTemplateClientDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description: string | null;
  taskType: TaskType;
  timeConfig: TaskTimeConfigClientDTO;
  recurrenceRule: RecurrenceRuleClientDTO | null;
  reminderConfig: TaskReminderConfigClientDTO | null;
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  goalBinding: TaskGoalBindingClientDTO | null;
  folderUuid: string | null;
  tags: string[];
  color: string | null;
  status: TaskTemplateStatus; // DRAFT | ACTIVE | PAUSED | ARCHIVED | DELETED

  // 子实体
  steps: TaskStepClientDTO[];
  history: TaskTemplateHistoryClientDTO[];

  // 元数据
  lastGeneratedDate: number | null; // 最后一次生成实例的日期
  generateAheadDays: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;

  // 前端计算字段
  priorityScore: number; // 优先级分数
  instanceCount: number; // 生成的实例数量
  completionRate: number; // 完成率（%）
}
```

---

## 3. 领域模型设计

### 3.1 TaskTemplate 聚合根

```typescript
// TaskTemplate.ts
export class TaskTemplate extends AggregateRoot {
  private _accountUuid: string;
  private _title: string;
  private _description: string | null;
  private _taskType: TaskType;
  private _timeConfig: TaskTimeConfig; // 值对象
  private _recurrenceRule: RecurrenceRule | null; // 值对象
  private _reminderConfig: TaskReminderConfig | null; // 值对象
  private _importance: ImportanceLevel;
  private _urgency: UrgencyLevel;
  private _goalBinding: TaskGoalBinding | null; // 值对象
  private _folderUuid: string | null;
  private _tags: string[];
  private _color: string | null;
  private _status: TaskTemplateStatus;

  // 子实体集合
  private _steps: TaskStep[]; // 实体集合
  private _history: TaskTemplateHistory[]; // 实体集合

  // 元数据
  private _lastGeneratedDate: number | null;
  private _generateAheadDays: number;
  private _createdAt: number;
  private _updatedAt: number;
  private _deletedAt: number | null;

  public static create(params: CreateTaskTemplateParams): TaskTemplate {
    // 1. 验证必填字段
    if (!params.title || params.title.trim().length === 0) {
      throw new Error('任务标题不能为空');
    }
    if (params.title.length > 100) {
      throw new Error('任务标题不能超过100个字符');
    }

    // 2. 验证时间配置
    this.validateTimeConfig(params.timeConfig, params.taskType);

    // 3. 验证重复规则
    if (params.taskType !== TaskType.ONE_TIME && !params.recurrenceRule) {
      throw new Error('重复任务必须配置重复规则');
    }

    // 4. 创建实例
    const template = new TaskTemplate();
    template._uuid = template.generateUUID();
    template._accountUuid = params.accountUuid;
    template._title = params.title.trim();
    template._description = params.description?.trim() || null;
    template._taskType = params.taskType;

    // 5. 创建值对象
    template._timeConfig = TaskTimeConfig.create(params.timeConfig);
    template._recurrenceRule = params.recurrenceRule
      ? RecurrenceRule.create(params.recurrenceRule)
      : null;
    template._reminderConfig = params.reminderConfig
      ? TaskReminderConfig.create(params.reminderConfig)
      : null;
    template._goalBinding = params.goalBinding ? TaskGoalBinding.create(params.goalBinding) : null;

    template._importance = params.importance || ImportanceLevel.MEDIUM;
    template._urgency = params.urgency || UrgencyLevel.MEDIUM;
    template._folderUuid = params.folderUuid || null;
    template._tags = params.tags || [];
    template._color = params.color || null;
    template._status = TaskTemplateStatus.DRAFT;

    // 6. 创建步骤实体
    template._steps = [];
    if (params.steps && params.steps.length > 0) {
      params.steps.forEach((stepParams, index) => {
        const step = TaskStep.create({
          ...stepParams,
          templateUuid: template._uuid,
          orderIndex: index,
        });
        template._steps.push(step);
      });
    }

    template._history = [];
    template._lastGeneratedDate = null;
    template._generateAheadDays = params.generateAheadDays || 7;
    template._createdAt = Date.now();
    template._updatedAt = Date.now();
    template._deletedAt = null;

    // 7. 添加创建历史记录
    template.addHistory({
      changeType: 'CREATED',
      changeDescription: '创建任务模板',
      oldValue: null,
      newValue: template._title,
    });

    return template;
  }

  private static validateTimeConfig(timeConfig: TaskTimeConfigParams, taskType: TaskType): void {
    // SCHEDULED 类型必须有 scheduledTime
    if (timeConfig.timeType === TimeType.SCHEDULED && !timeConfig.scheduledTime) {
      throw new Error('SCHEDULED 类型任务必须指定计划时间');
    }

    // DEADLINE 类型必须有 deadline
    if (timeConfig.timeType === TimeType.DEADLINE && !timeConfig.deadline) {
      throw new Error('DEADLINE 类型任务必须指定截止时间');
    }

    // 验证时间逻辑
    if (timeConfig.scheduledTime && timeConfig.deadline) {
      if (timeConfig.scheduledTime >= timeConfig.deadline) {
        throw new Error('计划时间必须早于截止时间');
      }
    }

    // 一次性任务的时间不能在过去
    if (taskType === TaskType.ONE_TIME) {
      const now = Date.now();
      if (timeConfig.scheduledTime && timeConfig.scheduledTime < now) {
        throw new Error('一次性任务的计划时间不能在过去');
      }
      if (timeConfig.deadline && timeConfig.deadline < now) {
        throw new Error('一次性任务的截止时间不能在过去');
      }
    }
  }

  // 激活模板（生成实例）
  public activate(): TaskInstance[] {
    if (this._status !== TaskTemplateStatus.DRAFT) {
      throw new Error('只能激活草稿状态的任务模板');
    }

    this._status = TaskTemplateStatus.ACTIVE;
    this._updatedAt = Date.now();

    // 生成初始实例
    const instances = this.generateInstances();

    this.addDomainEvent({
      eventType: 'TaskTemplateActivatedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        accountUuid: this._accountUuid,
        title: this._title,
        instanceCount: instances.length,
      },
    });

    this.addHistory({
      changeType: 'STATUS_CHANGED',
      changeDescription: '激活任务模板',
      oldValue: TaskTemplateStatus.DRAFT,
      newValue: TaskTemplateStatus.ACTIVE,
    });

    return instances;
  }

  // 生成任务实例
  private generateInstances(): TaskInstance[] {
    const instances: TaskInstance[] = [];
    const now = Date.now();
    const generateUntil = now + this._generateAheadDays * 24 * 60 * 60 * 1000;

    if (this._taskType === TaskType.ONE_TIME) {
      // 一次性任务只生成一个实例
      const instance = TaskInstance.createFromTemplate(this, now);
      instances.push(instance);
    } else if (this._recurrenceRule) {
      // 重复任务根据规则生成多个实例
      const dates = this._recurrenceRule.getOccurrencesUntil(now, generateUntil);
      dates.forEach((date) => {
        const instance = TaskInstance.createFromTemplate(this, date);
        instances.push(instance);
      });
    }

    this._lastGeneratedDate = now;
    return instances;
  }

  // 添加步骤
  public addStep(params: CreateTaskStepParams): TaskStep {
    const step = TaskStep.create({
      ...params,
      templateUuid: this._uuid,
      orderIndex: this._steps.length,
    });

    this._steps.push(step);
    this._updatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'TaskStepAddedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        stepUuid: step.uuid,
        stepTitle: step.title,
      },
    });

    return step;
  }

  // 移除步骤
  public removeStep(stepUuid: string): void {
    const index = this._steps.findIndex((s) => s.uuid === stepUuid);
    if (index === -1) {
      throw new Error('步骤不存在');
    }

    const step = this._steps[index];
    this._steps.splice(index, 1);

    // 重新排序
    this._steps.forEach((s, idx) => s.updateOrderIndex(idx));

    this._updatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'TaskStepRemovedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        stepUuid: step.uuid,
      },
    });
  }

  // 添加历史记录
  private addHistory(params: {
    changeType: string;
    changeDescription: string;
    oldValue: any;
    newValue: any;
  }): void {
    const history = TaskTemplateHistory.create({
      templateUuid: this._uuid,
      ...params,
    });
    this._history.push(history);
  }

  // Getter 方法
  public get accountUuid(): string {
    return this._accountUuid;
  }

  public get title(): string {
    return this._title;
  }

  public get status(): TaskTemplateStatus {
    return this._status;
  }

  public get steps(): TaskStep[] {
    return [...this._steps];
  }

  public get taskType(): TaskType {
    return this._taskType;
  }

  public get timeConfig(): TaskTimeConfig {
    return this._timeConfig;
  }

  public get recurrenceRule(): RecurrenceRule | null {
    return this._recurrenceRule;
  }

  public getPriorityScore(): number {
    const importanceWeight = {
      [ImportanceLevel.LOW]: 1,
      [ImportanceLevel.MEDIUM]: 2,
      [ImportanceLevel.HIGH]: 3,
      [ImportanceLevel.CRITICAL]: 4,
    };
    const urgencyWeight = {
      [UrgencyLevel.LOW]: 1,
      [UrgencyLevel.MEDIUM]: 2,
      [UrgencyLevel.HIGH]: 3,
      [UrgencyLevel.URGENT]: 4,
    };
    return importanceWeight[this._importance] * urgencyWeight[this._urgency];
  }
}
```

### 3.2 TaskStep 实体

```typescript
// TaskStep.ts
export class TaskStep extends Entity {
  private _templateUuid: string;
  private _title: string;
  private _description: string | null;
  private _orderIndex: number;
  private _estimatedMinutes: number | null;
  private _isOptional: boolean;
  private _createdAt: number;
  private _updatedAt: number;

  public static create(params: CreateTaskStepParams): TaskStep {
    if (!params.title || params.title.trim().length === 0) {
      throw new Error('步骤标题不能为空');
    }

    const step = new TaskStep();
    step._uuid = step.generateUUID();
    step._templateUuid = params.templateUuid;
    step._title = params.title.trim();
    step._description = params.description?.trim() || null;
    step._orderIndex = params.orderIndex;
    step._estimatedMinutes = params.estimatedMinutes || null;
    step._isOptional = params.isOptional || false;
    step._createdAt = Date.now();
    step._updatedAt = Date.now();

    return step;
  }

  public updateOrderIndex(newIndex: number): void {
    this._orderIndex = newIndex;
    this._updatedAt = Date.now();
  }

  public get uuid(): string {
    return this._uuid;
  }

  public get title(): string {
    return this._title;
  }
}
```

---

## 4. 应用服务

```typescript
// TaskTemplateApplicationService.ts
export class TaskTemplateApplicationService {
  constructor(
    private taskTemplateRepository: ITaskTemplateRepository,
    private taskInstanceRepository: ITaskInstanceRepository,
    private eventBus: IEventBus,
  ) {}

  async createTaskTemplate(
    request: CreateTaskTemplateRequest,
  ): Promise<CreateTaskTemplateResponse> {
    // 1. 验证目标绑定（如果指定）
    if (request.goalBinding?.goalUuid) {
      await this.validateGoalExists(request.goalBinding.goalUuid);
    }

    // 2. 创建任务模板
    const template = TaskTemplate.create({
      accountUuid: request.accountUuid,
      title: request.title,
      description: request.description,
      taskType: request.taskType,
      timeConfig: request.timeConfig,
      recurrenceRule: request.recurrenceRule,
      reminderConfig: request.reminderConfig,
      importance: request.importance,
      urgency: request.urgency,
      goalBinding: request.goalBinding,
      folderUuid: request.folderUuid,
      tags: request.tags,
      color: request.color,
      steps: request.steps,
      generateAheadDays: request.generateAheadDays,
    });

    // 3. 立即激活（如果指定）
    let instances: TaskInstance[] = [];
    if (request.activateImmediately) {
      instances = template.activate();
    }

    // 4. 持久化
    await this.taskTemplateRepository.save(template);

    if (instances.length > 0) {
      await this.taskInstanceRepository.saveAll(instances);
    }

    // 5. 发布领域事件
    this.publishDomainEvents(template);

    // 6. 返回响应
    return {
      template: template.toClientDTO(),
      instances: instances.map((i) => i.toClientDTO()),
      message: request.activateImmediately
        ? `任务模板已创建并激活，生成了 ${instances.length} 个实例`
        : '任务模板已创建',
    };
  }

  private async validateGoalExists(goalUuid: string): Promise<void> {
    // 调用 Goal 模块的服务检查目标是否存在
    // 这里简化处理
    const exists = true; // await goalService.exists(goalUuid);
    if (!exists) {
      throw new Error('关联的目标不存在');
    }
  }

  private publishDomainEvents(template: TaskTemplate): void {
    const events = template.getDomainEvents();
    events.forEach((event) => {
      this.eventBus.publish(event);
    });
    template.clearDomainEvents();
  }
}
```

---

## 5. 前端实现

### 5.1 创建任务模板表单

```vue
<!-- TaskTemplateCreateForm.vue -->
<template>
  <el-dialog v-model="visible" title="创建任务模板" width="700px" @close="handleClose">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <!-- 基本信息 -->
      <el-form-item label="任务标题" prop="title">
        <el-input v-model="form.title" placeholder="输入任务标题" maxlength="100" show-word-limit />
      </el-form-item>

      <el-form-item label="任务描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="详细描述任务内容"
        />
      </el-form-item>

      <!-- 任务类型 -->
      <el-form-item label="任务类型" prop="taskType">
        <el-radio-group v-model="form.taskType">
          <el-radio label="ONE_TIME">一次性</el-radio>
          <el-radio label="DAILY">每日重复</el-radio>
          <el-radio label="WEEKLY">每周重复</el-radio>
          <el-radio label="MONTHLY">每月重复</el-radio>
          <el-radio label="CUSTOM">自定义</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 时间配置 -->
      <el-form-item label="时间类型" prop="timeConfig.timeType">
        <el-select v-model="form.timeConfig.timeType">
          <el-option label="计划时间" value="SCHEDULED" />
          <el-option label="截止时间" value="DEADLINE" />
          <el-option label="灵活时间" value="FLOATING" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="form.timeConfig.timeType === 'SCHEDULED'" label="计划时间">
        <el-date-picker
          v-model="scheduledTimeDate"
          type="datetime"
          placeholder="选择计划时间"
          format="YYYY-MM-DD HH:mm"
        />
      </el-form-item>

      <el-form-item v-if="form.timeConfig.timeType === 'DEADLINE'" label="截止时间">
        <el-date-picker
          v-model="deadlineDate"
          type="datetime"
          placeholder="选择截止时间"
          format="YYYY-MM-DD HH:mm"
        />
      </el-form-item>

      <el-form-item label="预计时长">
        <el-input-number
          v-model="form.timeConfig.estimatedDuration"
          :min="0"
          :step="15"
          placeholder="分钟"
        />
        <span class="ml-2 text-gray-500">分钟</span>
      </el-form-item>

      <!-- 重复规则（重复任务才显示） -->
      <template v-if="form.taskType !== 'ONE_TIME'">
        <el-divider>重复规则</el-divider>

        <el-form-item label="重复频率">
          <el-select v-model="form.recurrenceRule.frequency">
            <el-option label="每日" value="DAILY" />
            <el-option label="每周" value="WEEKLY" />
            <el-option label="每月" value="MONTHLY" />
            <el-option label="每年" value="YEARLY" />
          </el-select>
        </el-form-item>

        <el-form-item label="重复间隔">
          <el-input-number v-model="form.recurrenceRule.interval" :min="1" :max="365" />
          <span class="ml-2 text-gray-500">
            {{ getIntervalLabel() }}
          </span>
        </el-form-item>

        <el-form-item v-if="form.recurrenceRule.frequency === 'WEEKLY'" label="重复星期">
          <el-checkbox-group v-model="form.recurrenceRule.byWeekday">
            <el-checkbox :label="0">日</el-checkbox>
            <el-checkbox :label="1">一</el-checkbox>
            <el-checkbox :label="2">二</el-checkbox>
            <el-checkbox :label="3">三</el-checkbox>
            <el-checkbox :label="4">四</el-checkbox>
            <el-checkbox :label="5">五</el-checkbox>
            <el-checkbox :label="6">六</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="重复次数">
          <el-radio-group v-model="recurrenceEndType">
            <el-radio label="forever">永久重复</el-radio>
            <el-radio label="count">指定次数</el-radio>
            <el-radio label="until">指定日期</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="recurrenceEndType === 'count'">
          <el-input-number v-model="form.recurrenceRule.count" :min="1" :max="1000" />
          <span class="ml-2 text-gray-500">次</span>
        </el-form-item>

        <el-form-item v-if="recurrenceEndType === 'until'">
          <el-date-picker v-model="recurrenceUntilDate" type="date" placeholder="选择结束日期" />
        </el-form-item>
      </template>

      <!-- 优先级 -->
      <el-divider>优先级设置</el-divider>

      <el-form-item label="重要性">
        <el-radio-group v-model="form.importance">
          <el-radio label="LOW">低</el-radio>
          <el-radio label="MEDIUM">中</el-radio>
          <el-radio label="HIGH">高</el-radio>
          <el-radio label="CRITICAL">紧急</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="紧急性">
        <el-radio-group v-model="form.urgency">
          <el-radio label="LOW">低</el-radio>
          <el-radio label="MEDIUM">中</el-radio>
          <el-radio label="HIGH">高</el-radio>
          <el-radio label="URGENT">紧急</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 任务步骤 -->
      <el-divider>任务步骤（可选）</el-divider>

      <el-form-item>
        <el-button type="primary" text @click="handleAddStep">
          <el-icon><Plus /></el-icon>
          添加步骤
        </el-button>
      </el-form-item>

      <div v-for="(step, index) in form.steps" :key="index" class="step-item">
        <el-input v-model="step.title" placeholder="步骤标题">
          <template #prepend>{{ index + 1 }}</template>
          <template #append>
            <el-button text @click="handleRemoveStep(index)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>

      <!-- 关联目标 -->
      <el-divider>关联目标（可选）</el-divider>

      <el-form-item label="关联目标">
        <el-select v-model="form.goalBinding.goalUuid" placeholder="选择目标" clearable>
          <el-option
            v-for="goal in activeGoals"
            :key="goal.uuid"
            :label="goal.title"
            :value="goal.uuid"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit(false)" :loading="isSubmitting">
        保存草稿
      </el-button>
      <el-button type="success" @click="handleSubmit(true)" :loading="isSubmitting">
        创建并激活
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';
import { useTaskStore } from '../stores/taskStore';
import { useGoalStore } from '@/modules/goal/stores/goalStore';

const taskStore = useTaskStore();
const goalStore = useGoalStore();

const visible = defineModel<boolean>('visible', { required: true });
const isSubmitting = ref(false);

const form = ref({
  title: '',
  description: '',
  taskType: 'ONE_TIME',
  timeConfig: {
    timeType: 'SCHEDULED',
    scheduledTime: null,
    deadline: null,
    estimatedDuration: 30,
  },
  recurrenceRule: {
    frequency: 'DAILY',
    interval: 1,
    byWeekday: [],
    count: null,
    until: null,
  },
  importance: 'MEDIUM',
  urgency: 'MEDIUM',
  goalBinding: {
    goalUuid: null,
  },
  steps: [] as Array<{ title: string; description: string }>,
});

const scheduledTimeDate = ref<Date | null>(null);
const deadlineDate = ref<Date | null>(null);
const recurrenceUntilDate = ref<Date | null>(null);
const recurrenceEndType = ref('forever');

const activeGoals = computed(() => {
  return goalStore.goals.filter((g) => g.status === 'ACTIVE');
});

const rules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { max: 100, message: '标题不能超过100个字符', trigger: 'blur' },
  ],
  taskType: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  'timeConfig.timeType': [{ required: true, message: '请选择时间类型', trigger: 'change' }],
};

function handleAddStep() {
  form.value.steps.push({
    title: '',
    description: '',
  });
}

function handleRemoveStep(index: number) {
  form.value.steps.splice(index, 1);
}

function getIntervalLabel(): string {
  const labels = {
    DAILY: '天',
    WEEKLY: '周',
    MONTHLY: '月',
    YEARLY: '年',
  };
  return labels[form.value.recurrenceRule.frequency] || '天';
}

async function handleSubmit(activateImmediately: boolean) {
  isSubmitting.value = true;
  try {
    // 转换日期
    const request = {
      ...form.value,
      timeConfig: {
        ...form.value.timeConfig,
        scheduledTime: scheduledTimeDate.value?.getTime() || null,
        deadline: deadlineDate.value?.getTime() || null,
      },
      recurrenceRule:
        form.value.taskType !== 'ONE_TIME'
          ? {
              ...form.value.recurrenceRule,
              until:
                recurrenceEndType.value === 'until' ? recurrenceUntilDate.value?.getTime() : null,
              count: recurrenceEndType.value === 'count' ? form.value.recurrenceRule.count : null,
            }
          : null,
      activateImmediately,
    };

    await taskStore.createTaskTemplate(request);

    ElMessage.success(activateImmediately ? '任务模板已创建并激活' : '任务模板已保存为草稿');

    handleClose();
  } catch (error: any) {
    ElMessage.error(error.message || '创建失败');
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  visible.value = false;
  // 重置表单
}
</script>

<style scoped>
.step-item {
  margin-bottom: 12px;
}
</style>
```

---

## 6. 数据库模型

```prisma
model TaskTemplate {
  uuid                String    @id @default(uuid())
  accountUuid         String
  title               String
  description         String?   @db.Text
  taskType            String    // ONE_TIME | DAILY | WEEKLY | MONTHLY | CUSTOM

  // 时间配置（JSON）
  timeConfig          Json

  // 重复规则（JSON，可选）
  recurrenceRule      Json?

  // 提醒配置（JSON，可选）
  reminderConfig      Json?

  importance          String    @default("MEDIUM")
  urgency             String    @default("MEDIUM")

  // 目标绑定（JSON，可选）
  goalBinding         Json?

  folderUuid          String?
  tags                String[]  @default([])
  color               String?
  status              String    @default("DRAFT")

  lastGeneratedDate   DateTime?
  generateAheadDays   Int       @default(7)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?

  // 关系
  account             Account   @relation(fields: [accountUuid], references: [uuid])
  folder              TaskFolder? @relation(fields: [folderUuid], references: [uuid])
  steps               TaskStep[]
  history             TaskTemplateHistory[]
  instances           TaskInstance[]

  @@index([accountUuid])
  @@index([status])
  @@index([folderUuid])
  @@map("task_templates")
}

model TaskStep {
  uuid                String    @id @default(uuid())
  templateUuid        String
  title               String
  description         String?   @db.Text
  orderIndex          Int
  estimatedMinutes    Int?
  isOptional          Boolean   @default(false)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // 关系
  template            TaskTemplate @relation(fields: [templateUuid], references: [uuid], onDelete: Cascade)

  @@index([templateUuid])
  @@map("task_steps")
}

model TaskTemplateHistory {
  uuid                String    @id @default(uuid())
  templateUuid        String
  changeType          String    // CREATED | STATUS_CHANGED | FIELD_UPDATED | STEP_ADDED
  changeDescription   String
  oldValue            String?   @db.Text
  newValue            String?   @db.Text
  changedAt           DateTime  @default(now())

  // 关系
  template            TaskTemplate @relation(fields: [templateUuid], references: [uuid], onDelete: Cascade)

  @@index([templateUuid])
  @@map("task_template_history")
}
```

---

## 7. 参考文档

- [Task 模块设计规划](../TASK_MODULE_PLAN.md)
- [Goal 创建流程](../../goal/goal-flows/CREATE_GOAL_FLOW.md)
- [DDD 规范](../../../architecture/DDD规范.md)
