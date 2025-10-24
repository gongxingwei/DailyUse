# 任务步骤管理流程设计文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-18
- **架构模式**: DDD (Task 模块)
- **相关模块**: Task
- **业务场景**: 管理任务模板的步骤（添加、更新、删除、排序）

---

## 1. 业务概述

### 1.1 业务目标

TaskStep（任务步骤）是 TaskTemplate 的子实体，用于分解复杂任务：

- **添加步骤**: 为任务模板添加新的步骤
- **更新步骤**: 修改步骤的标题、描述、预计时长
- **删除步骤**: 移除不需要的步骤
- **排序步骤**: 调整步骤的执行顺序
- **批量更新**: 一次性更新多个步骤
- **CheckList 模式**: 步骤可标记为可选/必需

### 1.2 核心原则

- **聚合根管理**: 步骤的所有操作必须通过 TaskTemplate 聚合根进行
- **顺序性**: 步骤有明确的执行顺序（orderIndex）
- **灵活性**: 步骤可以是必需的或可选的
- **时长估算**: 每个步骤可以有预计时长
- **实例继承**: 新生成的任务实例会继承模板的步骤

### 1.3 步骤类型

| 类型     | 说明               | 示例               |
| -------- | ------------------ | ------------------ |
| 必需步骤 | isOptional = false | 提交报告、发送邮件 |
| 可选步骤 | isOptional = true  | 添加附件、抄送他人 |

---

## 2. API 定义

### 2.1 添加步骤

```http
POST /api/task-templates/:templateUuid/steps
```

#### 请求体

```typescript
interface AddTaskStepRequest {
  accountUuid: string;
  title: string; // 步骤标题（必填）
  description?: string | null; // 步骤描述
  estimatedMinutes?: number | null; // 预计时长（分钟）
  isOptional?: boolean; // 是否可选（默认false）
  insertAfter?: string | null; // 插入到指定步骤之后（stepUuid）
}
```

#### 响应

```typescript
interface AddTaskStepResponse {
  step: TaskStepClientDTO;
  template: TaskTemplateClientDTO; // 更新后的模板
  message: string;
}

interface TaskStepClientDTO {
  uuid: string;
  templateUuid: string;
  title: string;
  description: string | null;
  orderIndex: number; // 排序索引
  estimatedMinutes: number | null;
  isOptional: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### 2.2 更新步骤

```http
PUT /api/task-templates/:templateUuid/steps/:stepUuid
```

#### 请求体

```typescript
interface UpdateTaskStepRequest {
  accountUuid: string;
  title?: string;
  description?: string | null;
  estimatedMinutes?: number | null;
  isOptional?: boolean;
}
```

#### 响应

```typescript
interface UpdateTaskStepResponse {
  step: TaskStepClientDTO;
  message: string;
}
```

### 2.3 删除步骤

```http
DELETE /api/task-templates/:templateUuid/steps/:stepUuid
```

#### 请求体

```typescript
interface DeleteTaskStepRequest {
  accountUuid: string;
}
```

#### 响应

```typescript
interface DeleteTaskStepResponse {
  message: string;
}
```

### 2.4 批量更新步骤顺序

```http
PUT /api/task-templates/:templateUuid/steps/reorder
```

#### 请求体

```typescript
interface ReorderTaskStepsRequest {
  accountUuid: string;
  stepOrders: Array<{
    stepUuid: string;
    newOrderIndex: number;
  }>;
}
```

#### 响应

```typescript
interface ReorderTaskStepsResponse {
  steps: TaskStepClientDTO[];
  message: string;
}
```

### 2.5 批量添加步骤

```http
POST /api/task-templates/:templateUuid/steps/batch
```

#### 请求体

```typescript
interface BatchAddTaskStepsRequest {
  accountUuid: string;
  steps: Array<{
    title: string;
    description?: string | null;
    estimatedMinutes?: number | null;
    isOptional?: boolean;
  }>;
}
```

#### 响应

```typescript
interface BatchAddTaskStepsResponse {
  steps: TaskStepClientDTO[];
  template: TaskTemplateClientDTO;
  message: string;
}
```

---

## 3. 领域模型设计

### 3.1 TaskTemplate 步骤管理方法

```typescript
// TaskTemplate.ts (续)
export class TaskTemplate extends AggregateRoot {
  private _steps: TaskStep[]; // 步骤集合

  // 添加步骤
  public addStep(params: {
    title: string;
    description?: string | null;
    estimatedMinutes?: number | null;
    isOptional?: boolean;
    insertAfter?: string | null;
  }): TaskStep {
    // 1. 验证标题
    if (!params.title || params.title.trim().length === 0) {
      throw new Error('步骤标题不能为空');
    }
    if (params.title.length > 100) {
      throw new Error('步骤标题不能超过100个字符');
    }

    // 2. 计算插入位置
    let orderIndex: number;
    if (params.insertAfter) {
      const afterStepIndex = this._steps.findIndex((s) => s.uuid === params.insertAfter);
      if (afterStepIndex === -1) {
        throw new Error('指定的步骤不存在');
      }
      orderIndex = afterStepIndex + 1;

      // 重新排序后面的步骤
      this._steps.slice(orderIndex).forEach((step) => {
        step.updateOrderIndex(step.orderIndex + 1);
      });
    } else {
      // 添加到末尾
      orderIndex = this._steps.length;
    }

    // 3. 创建步骤
    const step = TaskStep.create({
      templateUuid: this._uuid,
      title: params.title.trim(),
      description: params.description?.trim() || null,
      orderIndex,
      estimatedMinutes: params.estimatedMinutes || null,
      isOptional: params.isOptional || false,
    });

    // 4. 插入到指定位置
    this._steps.splice(orderIndex, 0, step);
    this._updatedAt = Date.now();

    // 5. 发布事件
    this.addDomainEvent({
      eventType: 'TaskStepAddedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        stepUuid: step.uuid,
        stepTitle: step.title,
        orderIndex,
      },
    });

    // 6. 添加历史记录
    this.addHistory({
      changeType: 'STEP_ADDED',
      changeDescription: `添加步骤: ${step.title}`,
      oldValue: null,
      newValue: step.title,
    });

    return step;
  }

  // 更新步骤
  public updateStep(
    stepUuid: string,
    params: {
      title?: string;
      description?: string | null;
      estimatedMinutes?: number | null;
      isOptional?: boolean;
    },
  ): TaskStep {
    // 1. 查找步骤
    const step = this._steps.find((s) => s.uuid === stepUuid);
    if (!step) {
      throw new Error('步骤不存在');
    }

    // 2. 验证标题
    if (params.title !== undefined) {
      if (!params.title || params.title.trim().length === 0) {
        throw new Error('步骤标题不能为空');
      }
      if (params.title.length > 100) {
        throw new Error('步骤标题不能超过100个字符');
      }
    }

    // 3. 记录旧值
    const oldTitle = step.title;

    // 4. 更新步骤
    step.update(params);
    this._updatedAt = Date.now();

    // 5. 发布事件
    this.addDomainEvent({
      eventType: 'TaskStepUpdatedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        stepUuid: step.uuid,
        oldTitle,
        newTitle: step.title,
      },
    });

    // 6. 添加历史记录
    if (params.title && params.title !== oldTitle) {
      this.addHistory({
        changeType: 'STEP_UPDATED',
        changeDescription: `更新步骤标题`,
        oldValue: oldTitle,
        newValue: params.title,
      });
    }

    return step;
  }

  // 删除步骤
  public removeStep(stepUuid: string): void {
    // 1. 查找步骤
    const index = this._steps.findIndex((s) => s.uuid === stepUuid);
    if (index === -1) {
      throw new Error('步骤不存在');
    }

    const step = this._steps[index];
    const stepTitle = step.title;

    // 2. 移除步骤
    this._steps.splice(index, 1);

    // 3. 重新排序后续步骤
    this._steps.slice(index).forEach((s, idx) => {
      s.updateOrderIndex(index + idx);
    });

    this._updatedAt = Date.now();

    // 4. 发布事件
    this.addDomainEvent({
      eventType: 'TaskStepRemovedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        stepUuid: step.uuid,
        stepTitle,
      },
    });

    // 5. 添加历史记录
    this.addHistory({
      changeType: 'STEP_REMOVED',
      changeDescription: `删除步骤: ${stepTitle}`,
      oldValue: stepTitle,
      newValue: null,
    });
  }

  // 重新排序步骤
  public reorderSteps(stepOrders: Array<{ stepUuid: string; newOrderIndex: number }>): void {
    // 1. 验证所有步骤都存在
    const stepMap = new Map(this._steps.map((s) => [s.uuid, s]));
    for (const order of stepOrders) {
      if (!stepMap.has(order.stepUuid)) {
        throw new Error(`步骤 ${order.stepUuid} 不存在`);
      }
    }

    // 2. 验证新索引的唯一性和连续性
    const newIndices = stepOrders.map((o) => o.newOrderIndex).sort((a, b) => a - b);
    for (let i = 0; i < newIndices.length; i++) {
      if (newIndices[i] !== i) {
        throw new Error('步骤索引必须从0开始连续');
      }
    }

    // 3. 应用新顺序
    for (const order of stepOrders) {
      const step = stepMap.get(order.stepUuid)!;
      step.updateOrderIndex(order.newOrderIndex);
    }

    // 4. 重新排序数组
    this._steps.sort((a, b) => a.orderIndex - b.orderIndex);
    this._updatedAt = Date.now();

    // 5. 发布事件
    this.addDomainEvent({
      eventType: 'TaskStepsReorderedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        templateUuid: this._uuid,
        stepCount: this._steps.length,
      },
    });

    // 6. 添加历史记录
    this.addHistory({
      changeType: 'STEPS_REORDERED',
      changeDescription: `重新排序步骤`,
      oldValue: null,
      newValue: `${this._steps.length} 个步骤`,
    });
  }

  // 批量添加步骤
  public addSteps(
    stepsParams: Array<{
      title: string;
      description?: string | null;
      estimatedMinutes?: number | null;
      isOptional?: boolean;
    }>,
  ): TaskStep[] {
    const addedSteps: TaskStep[] = [];

    for (const params of stepsParams) {
      const step = this.addStep(params);
      addedSteps.push(step);
    }

    return addedSteps;
  }

  // 获取总预计时长
  public getTotalEstimatedMinutes(): number {
    return this._steps.reduce((total, step) => {
      return total + (step.estimatedMinutes || 0);
    }, 0);
  }

  // 获取必需步骤数量
  public getRequiredStepCount(): number {
    return this._steps.filter((s) => !s.isOptional).length;
  }

  // Getter
  public get steps(): TaskStep[] {
    return [...this._steps].sort((a, b) => a.orderIndex - b.orderIndex);
  }
}
```

### 3.2 TaskStep 实体方法

```typescript
// TaskStep.ts (续)
export class TaskStep extends Entity {
  private _templateUuid: string;
  private _title: string;
  private _description: string | null;
  private _orderIndex: number;
  private _estimatedMinutes: number | null;
  private _isOptional: boolean;
  private _createdAt: number;
  private _updatedAt: number;

  public static create(params: {
    templateUuid: string;
    title: string;
    description?: string | null;
    orderIndex: number;
    estimatedMinutes?: number | null;
    isOptional?: boolean;
  }): TaskStep {
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

  public update(params: {
    title?: string;
    description?: string | null;
    estimatedMinutes?: number | null;
    isOptional?: boolean;
  }): void {
    if (params.title !== undefined) {
      this._title = params.title.trim();
    }
    if (params.description !== undefined) {
      this._description = params.description?.trim() || null;
    }
    if (params.estimatedMinutes !== undefined) {
      this._estimatedMinutes = params.estimatedMinutes;
    }
    if (params.isOptional !== undefined) {
      this._isOptional = params.isOptional;
    }
    this._updatedAt = Date.now();
  }

  public updateOrderIndex(newIndex: number): void {
    this._orderIndex = newIndex;
    this._updatedAt = Date.now();
  }

  // Getters
  public get uuid(): string {
    return this._uuid;
  }

  public get templateUuid(): string {
    return this._templateUuid;
  }

  public get title(): string {
    return this._title;
  }

  public get description(): string | null {
    return this._description;
  }

  public get orderIndex(): number {
    return this._orderIndex;
  }

  public get estimatedMinutes(): number | null {
    return this._estimatedMinutes;
  }

  public get isOptional(): boolean {
    return this._isOptional;
  }

  public get createdAt(): number {
    return this._createdAt;
  }

  public get updatedAt(): number {
    return this._updatedAt;
  }

  // DTO 转换
  public toClientDTO(): TaskStepClientDTO {
    return {
      uuid: this._uuid,
      templateUuid: this._templateUuid,
      title: this._title,
      description: this._description,
      orderIndex: this._orderIndex,
      estimatedMinutes: this._estimatedMinutes,
      isOptional: this._isOptional,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
```

---

## 4. 应用服务

```typescript
// TaskStepApplicationService.ts
export class TaskStepApplicationService {
  constructor(
    private taskTemplateRepository: ITaskTemplateRepository,
    private eventBus: IEventBus,
  ) {}

  async addStep(templateUuid: string, request: AddTaskStepRequest): Promise<AddTaskStepResponse> {
    // 1. 加载模板
    const template = await this.taskTemplateRepository.findByUuid(templateUuid);
    if (!template) {
      throw new Error('任务模板不存在');
    }

    // 2. 权限检查
    if (template.accountUuid !== request.accountUuid) {
      throw new Error('无权操作此任务模板');
    }

    // 3. 添加步骤
    const step = template.addStep({
      title: request.title,
      description: request.description,
      estimatedMinutes: request.estimatedMinutes,
      isOptional: request.isOptional,
      insertAfter: request.insertAfter,
    });

    // 4. 持久化
    await this.taskTemplateRepository.save(template);

    // 5. 发布事件
    this.publishDomainEvents(template);

    return {
      step: step.toClientDTO(),
      template: template.toClientDTO(),
      message: '步骤已添加',
    };
  }

  async updateStep(
    templateUuid: string,
    stepUuid: string,
    request: UpdateTaskStepRequest,
  ): Promise<UpdateTaskStepResponse> {
    // 1. 加载模板
    const template = await this.taskTemplateRepository.findByUuid(templateUuid);
    if (!template) {
      throw new Error('任务模板不存在');
    }

    // 2. 权限检查
    if (template.accountUuid !== request.accountUuid) {
      throw new Error('无权操作此任务模板');
    }

    // 3. 更新步骤
    const step = template.updateStep(stepUuid, {
      title: request.title,
      description: request.description,
      estimatedMinutes: request.estimatedMinutes,
      isOptional: request.isOptional,
    });

    // 4. 持久化
    await this.taskTemplateRepository.save(template);

    // 5. 发布事件
    this.publishDomainEvents(template);

    return {
      step: step.toClientDTO(),
      message: '步骤已更新',
    };
  }

  async deleteStep(
    templateUuid: string,
    stepUuid: string,
    request: DeleteTaskStepRequest,
  ): Promise<DeleteTaskStepResponse> {
    // 1. 加载模板
    const template = await this.taskTemplateRepository.findByUuid(templateUuid);
    if (!template) {
      throw new Error('任务模板不存在');
    }

    // 2. 权限检查
    if (template.accountUuid !== request.accountUuid) {
      throw new Error('无权操作此任务模板');
    }

    // 3. 删除步骤
    template.removeStep(stepUuid);

    // 4. 持久化
    await this.taskTemplateRepository.save(template);

    // 5. 发布事件
    this.publishDomainEvents(template);

    return {
      message: '步骤已删除',
    };
  }

  async reorderSteps(
    templateUuid: string,
    request: ReorderTaskStepsRequest,
  ): Promise<ReorderTaskStepsResponse> {
    // 1. 加载模板
    const template = await this.taskTemplateRepository.findByUuid(templateUuid);
    if (!template) {
      throw new Error('任务模板不存在');
    }

    // 2. 权限检查
    if (template.accountUuid !== request.accountUuid) {
      throw new Error('无权操作此任务模板');
    }

    // 3. 重新排序
    template.reorderSteps(request.stepOrders);

    // 4. 持久化
    await this.taskTemplateRepository.save(template);

    // 5. 发布事件
    this.publishDomainEvents(template);

    return {
      steps: template.steps.map((s) => s.toClientDTO()),
      message: '步骤顺序已更新',
    };
  }

  async batchAddSteps(
    templateUuid: string,
    request: BatchAddTaskStepsRequest,
  ): Promise<BatchAddTaskStepsResponse> {
    // 1. 加载模板
    const template = await this.taskTemplateRepository.findByUuid(templateUuid);
    if (!template) {
      throw new Error('任务模板不存在');
    }

    // 2. 权限检查
    if (template.accountUuid !== request.accountUuid) {
      throw new Error('无权操作此任务模板');
    }

    // 3. 批量添加步骤
    const steps = template.addSteps(request.steps);

    // 4. 持久化
    await this.taskTemplateRepository.save(template);

    // 5. 发布事件
    this.publishDomainEvents(template);

    return {
      steps: steps.map((s) => s.toClientDTO()),
      template: template.toClientDTO(),
      message: `成功添加 ${steps.length} 个步骤`,
    };
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

### 5.1 步骤列表组件

```vue
<!-- TaskStepList.vue -->
<template>
  <div class="task-step-list">
    <div class="header">
      <h4>任务步骤</h4>
      <el-button type="primary" text @click="handleAddStep">
        <el-icon><Plus /></el-icon>
        添加步骤
      </el-button>
    </div>

    <!-- 步骤列表（可拖拽排序） -->
    <el-empty v-if="steps.length === 0" description="暂无步骤，点击上方按钮添加" />

    <draggable
      v-else
      v-model="localSteps"
      item-key="uuid"
      handle=".drag-handle"
      @end="handleDragEnd"
    >
      <template #item="{ element, index }">
        <div class="step-item">
          <div class="step-content">
            <!-- 拖拽手柄 -->
            <el-icon class="drag-handle">
              <Rank />
            </el-icon>

            <!-- 序号 -->
            <span class="step-number">{{ index + 1 }}</span>

            <!-- 步骤信息 -->
            <div class="step-info">
              <div class="step-title">
                {{ element.title }}
                <el-tag v-if="element.isOptional" size="small" type="info"> 可选 </el-tag>
              </div>
              <div v-if="element.description" class="step-description">
                {{ element.description }}
              </div>
              <div v-if="element.estimatedMinutes" class="step-duration">
                <el-icon><Clock /></el-icon>
                预计 {{ element.estimatedMinutes }} 分钟
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="step-actions">
              <el-button text @click="handleEditStep(element)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button text type="danger" @click="handleDeleteStep(element)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </template>
    </draggable>

    <!-- 统计信息 -->
    <div v-if="steps.length > 0" class="step-stats">
      <el-text type="info">
        共 {{ steps.length }} 个步骤
        <span v-if="totalEstimatedMinutes > 0">
          · 预计总时长 {{ totalEstimatedMinutes }} 分钟
        </span>
        <span v-if="requiredStepCount > 0"> · {{ requiredStepCount }} 个必需步骤 </span>
      </el-text>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="showStepDialog"
      :title="editingStep ? '编辑步骤' : '添加步骤'"
      width="500px"
    >
      <el-form ref="stepFormRef" :model="stepForm" :rules="stepRules" label-width="100px">
        <el-form-item label="步骤标题" prop="title">
          <el-input
            v-model="stepForm.title"
            placeholder="输入步骤标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="步骤描述">
          <el-input
            v-model="stepForm.description"
            type="textarea"
            :rows="3"
            placeholder="详细描述步骤内容（可选）"
          />
        </el-form-item>

        <el-form-item label="预计时长">
          <el-input-number
            v-model="stepForm.estimatedMinutes"
            :min="0"
            :step="5"
            placeholder="分钟"
          />
          <span class="ml-2 text-gray-500">分钟</span>
        </el-form-item>

        <el-form-item label="步骤类型">
          <el-switch
            v-model="stepForm.isOptional"
            active-text="可选步骤"
            inactive-text="必需步骤"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showStepDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveStep" :loading="isSaving">
          {{ editingStep ? '更新' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Rank, Clock, Edit, Delete } from '@element-plus/icons-vue';
import draggable from 'vuedraggable';
import { useTaskStore } from '../stores/taskStore';

const props = defineProps<{
  templateUuid: string;
  steps: any[];
}>();

const emit = defineEmits<{
  updated: [];
}>();

const taskStore = useTaskStore();

const localSteps = ref([...props.steps]);
const showStepDialog = ref(false);
const editingStep = ref<any>(null);
const isSaving = ref(false);

const stepForm = ref({
  title: '',
  description: '',
  estimatedMinutes: null as number | null,
  isOptional: false,
});

const stepRules = {
  title: [
    { required: true, message: '请输入步骤标题', trigger: 'blur' },
    { max: 100, message: '标题不能超过100个字符', trigger: 'blur' },
  ],
};

const totalEstimatedMinutes = computed(() => {
  return localSteps.value.reduce((total, step) => {
    return total + (step.estimatedMinutes || 0);
  }, 0);
});

const requiredStepCount = computed(() => {
  return localSteps.value.filter((s) => !s.isOptional).length;
});

// 监听 props 变化
watch(
  () => props.steps,
  (newSteps) => {
    localSteps.value = [...newSteps];
  },
  { deep: true },
);

function handleAddStep() {
  editingStep.value = null;
  stepForm.value = {
    title: '',
    description: '',
    estimatedMinutes: null,
    isOptional: false,
  };
  showStepDialog.value = true;
}

function handleEditStep(step: any) {
  editingStep.value = step;
  stepForm.value = {
    title: step.title,
    description: step.description || '',
    estimatedMinutes: step.estimatedMinutes,
    isOptional: step.isOptional,
  };
  showStepDialog.value = true;
}

async function handleSaveStep() {
  isSaving.value = true;
  try {
    if (editingStep.value) {
      // 更新步骤
      await taskStore.updateTaskStep(props.templateUuid, editingStep.value.uuid, stepForm.value);
      ElMessage.success('步骤已更新');
    } else {
      // 添加步骤
      await taskStore.addTaskStep(props.templateUuid, stepForm.value);
      ElMessage.success('步骤已添加');
    }

    showStepDialog.value = false;
    emit('updated');
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    isSaving.value = false;
  }
}

async function handleDeleteStep(step: any) {
  try {
    await ElMessageBox.confirm(`确定要删除步骤"${step.title}"吗？`, '确认删除', {
      type: 'warning',
    });

    await taskStore.deleteTaskStep(props.templateUuid, step.uuid);
    ElMessage.success('步骤已删除');
    emit('updated');
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败');
    }
  }
}

async function handleDragEnd() {
  try {
    // 构造新的排序
    const stepOrders = localSteps.value.map((step, index) => ({
      stepUuid: step.uuid,
      newOrderIndex: index,
    }));

    await taskStore.reorderTaskSteps(props.templateUuid, stepOrders);
    ElMessage.success('步骤顺序已更新');
    emit('updated');
  } catch (error: any) {
    // 恢复原顺序
    localSteps.value = [...props.steps];
    ElMessage.error(error.message || '排序失败');
  }
}
</script>

<style scoped>
.task-step-list {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.step-item {
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.step-item:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.step-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.drag-handle {
  cursor: move;
  color: var(--el-text-color-secondary);
  font-size: 18px;
  margin-top: 2px;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-info {
  flex: 1;
}

.step-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-description {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.step-duration {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.step-actions {
  display: flex;
  gap: 4px;
}

.step-stats {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color);
}
</style>
```

---

## 6. 数据库存储

步骤数据存储在 `task_steps` 表中（参见 [CREATE_TASK_TEMPLATE_FLOW](./CREATE_TASK_TEMPLATE_FLOW.md#6-数据库模型)）。

关键点：

- `orderIndex` 字段用于排序
- `templateUuid` 外键关联模板，设置 `onDelete: Cascade`
- 索引：`[templateUuid]` 用于快速查询模板的所有步骤

---

## 7. 参考文档

- [创建任务模板流程](./CREATE_TASK_TEMPLATE_FLOW.md)
- [管理关键结果流程](../../goal/goal-flows/MANAGE_KEY_RESULT_FLOW.md)（相似模式）
- [Task 模块设计规划](../TASK_MODULE_PLAN.md)
