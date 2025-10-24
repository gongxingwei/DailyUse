# 关键结果管理流程设计文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-18
- **架构模式**: DDD (Goal 模块)
- **相关模块**: Goal
- **业务场景**: 管理目标的关键结果（添加、更新、删除、完成）

---

## 1. 业务概述

### 1.1 业务目标

关键结果（Key Result）是 OKR 模式中用于衡量目标达成度的具体指标。用户需要能够：

- **添加关键结果**: 为目标添加新的衡量指标
- **更新进度**: 更新关键结果的当前值
- **修改配置**: 修改目标值、单位、权重等
- **删除关键结果**: 移除不再需要的关键结果
- **标记完成**: 将关键结果标记为已完成

### 1.2 核心原则

- **实体管理**: KeyResult 是 Goal 聚合根的子实体
- **一致性边界**: 所有关键结果操作通过 Goal 聚合根进行
- **进度计算**: 目标总进度基于所有关键结果自动计算
- **原子性**: 关键结果的增删改与 Goal 的更新在同一事务中完成

### 1.3 关键结果类型

```typescript
enum KeyResultValueType {
  INCREMENTAL = 'INCREMENTAL', // 累积值（如完成 10 次）
  ABSOLUTE = 'ABSOLUTE', // 绝对值（如达到 90 分）
  PERCENTAGE = 'PERCENTAGE', // 百分比（如提升 20%）
  BINARY = 'BINARY', // 二元（完成/未完成）
}

enum AggregationMethod {
  SUM = 'SUM', // 求和（适合累计型）
  AVERAGE = 'AVERAGE', // 平均值
  MAX = 'MAX', // 最大值
  MIN = 'MIN', // 最小值
  LAST = 'LAST', // 最后一次（适合绝对值型）
}
```

---

## 2. 添加关键结果

### 2.1 API

```http
POST /api/goals/:goalUuid/key-results
```

### 2.2 请求体

```typescript
interface AddKeyResultRequest {
  title: string; // 必填，1-256 字符
  description?: string | null; // 可选描述
  valueType: KeyResultValueType; // 值类型
  targetValue: number; // 目标值
  currentValue?: number; // 当前值（默认 0）
  unit?: string | null; // 单位（如 "次"、"小时"、"%"）
  aggregationMethod?: AggregationMethod; // 聚合方式（默认 SUM）
  weight?: number; // 权重（默认 1）
  endDate?: number | null; // 截止日期（timestamp）
  order?: number; // 排序（默认最后）
}
```

### 2.3 响应

```typescript
interface AddKeyResultResponse {
  keyResult: KeyResultClientDTO;
  goal: GoalClientDTO; // 返回更新后的目标（包含新进度）
  message: string;
}
```

### 2.4 领域逻辑

```typescript
// Goal.ts
public addKeyResult(params: {
  title: string;
  description?: string | null;
  valueType: KeyResultValueType;
  targetValue: number;
  currentValue?: number;
  unit?: string | null;
  aggregationMethod?: AggregationMethod;
  weight?: number;
  endDate?: Date | null;
  order?: number;
}): KeyResult {
  // 1. 验证参数
  if (!params.title || params.title.trim().length === 0) {
    throw new Error('关键结果标题不能为空');
  }
  if (params.targetValue <= 0) {
    throw new Error('目标值必须大于 0');
  }

  // 2. 创建 KeyResult 实体
  const keyResult = KeyResult.create({
    goalUuid: this._uuid,
    title: params.title,
    description: params.description || null,
    valueType: params.valueType,
    targetValue: params.targetValue,
    currentValue: params.currentValue || 0,
    unit: params.unit || null,
    aggregationMethod: params.aggregationMethod || AggregationMethod.SUM,
    weight: params.weight || 1,
    endDate: params.endDate || null,
    order: params.order !== undefined ? params.order : this._keyResults.length,
  });

  // 3. 添加到集合
  this._keyResults.push(keyResult);

  // 4. 更新时间戳
  this._updatedAt = new Date();

  // 5. 发布领域事件
  this.addDomainEvent({
    eventType: 'KeyResultAddedEvent',
    aggregateId: this._uuid,
    occurredOn: new Date(),
    payload: {
      goalUuid: this._uuid,
      keyResultUuid: keyResult.uuid,
      title: keyResult.title,
      valueType: keyResult.valueType,
      targetValue: keyResult.targetValue,
    },
  });

  return keyResult;
}
```

### 2.5 应用服务

```typescript
// GoalApplicationService.ts
async addKeyResult(
  goalUuid: string,
  accountUuid: string,
  request: AddKeyResultRequest
): Promise<AddKeyResultResponse> {
  // 1. 加载 Goal 聚合根
  const goal = await this.goalRepository.findByUuid(goalUuid);
  if (!goal) {
    throw new Error('目标不存在');
  }

  // 2. 权限检查
  if (goal.accountUuid !== accountUuid) {
    throw new Error('无权操作此目标');
  }

  // 3. 调用领域方法添加关键结果
  const keyResult = goal.addKeyResult({
    title: request.title,
    description: request.description,
    valueType: request.valueType,
    targetValue: request.targetValue,
    currentValue: request.currentValue,
    unit: request.unit,
    aggregationMethod: request.aggregationMethod,
    weight: request.weight,
    endDate: request.endDate ? new Date(request.endDate) : null,
    order: request.order,
  });

  // 4. 持久化
  await this.goalRepository.save(goal);

  // 5. 发布事件
  this.publishDomainEvents(goal);

  // 6. 返回响应
  return {
    keyResult: keyResult.toClientDTO(),
    goal: goal.toClientDTO(true),
    message: '关键结果添加成功',
  };
}
```

### 2.6 前端实现

```vue
<!-- AddKeyResultForm.vue -->
<template>
  <el-dialog v-model="visible" title="添加关键结果" width="600px">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="form.title"
          placeholder="例如：完成 10 次演讲"
          maxlength="256"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="详细描述这个关键结果"
        />
      </el-form-item>

      <el-form-item label="值类型" prop="valueType">
        <el-select v-model="form.valueType" placeholder="选择值类型">
          <el-option label="累积值" value="INCREMENTAL" />
          <el-option label="绝对值" value="ABSOLUTE" />
          <el-option label="百分比" value="PERCENTAGE" />
          <el-option label="二元（是/否）" value="BINARY" />
        </el-select>
      </el-form-item>

      <el-form-item label="目标值" prop="targetValue">
        <el-input-number v-model="form.targetValue" :min="0.01" :precision="2" />
      </el-form-item>

      <el-form-item label="当前值" prop="currentValue">
        <el-input-number v-model="form.currentValue" :min="0" :precision="2" />
      </el-form-item>

      <el-form-item label="单位" prop="unit">
        <el-input v-model="form.unit" placeholder="如：次、小时、%" maxlength="20" />
      </el-form-item>

      <el-form-item label="权重" prop="weight">
        <el-slider v-model="form.weight" :min="0.1" :max="2" :step="0.1" show-input />
        <span class="tip">权重影响该关键结果在总进度中的占比</span>
      </el-form-item>

      <el-form-item label="截止日期" prop="endDate">
        <el-date-picker v-model="form.endDate" type="date" placeholder="选择截止日期" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="isSubmitting"> 添加 </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { useGoalStore } from '../stores/goalStore';
import type { AddKeyResultRequest } from '@daily-use/contracts';

const props = defineProps<{
  goalUuid: string;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const goalStore = useGoalStore();
const visible = ref(false);
const isSubmitting = ref(false);
const formRef = ref();

const form = reactive<AddKeyResultRequest>({
  title: '',
  description: '',
  valueType: 'INCREMENTAL',
  targetValue: 100,
  currentValue: 0,
  unit: '',
  weight: 1,
  endDate: null,
});

const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 1, max: 256, message: '标题长度应在 1-256 字符之间', trigger: 'blur' },
  ],
  valueType: [{ required: true, message: '请选择值类型', trigger: 'change' }],
  targetValue: [
    { required: true, message: '请输入目标值', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '目标值必须大于 0', trigger: 'blur' },
  ],
};

function open() {
  visible.value = true;
}

async function handleSubmit() {
  try {
    await formRef.value.validate();

    isSubmitting.value = true;
    await goalStore.addKeyResult(props.goalUuid, form);

    ElMessage.success('关键结果添加成功');
    visible.value = false;
    emit('success');

    // 重置表单
    formRef.value.resetFields();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '添加失败');
    }
  } finally {
    isSubmitting.value = false;
  }
}

defineExpose({
  open,
});
</script>
```

---

## 3. 更新关键结果进度

### 3.1 API

```http
PATCH /api/goals/:goalUuid/key-results/:keyResultUuid/progress
```

### 3.2 请求体

```typescript
interface UpdateKeyResultProgressRequest {
  currentValue: number; // 新的当前值
  incrementBy?: number; // 或者增量（二选一）
}
```

### 3.3 领域逻辑

```typescript
// Goal.ts
public updateKeyResultProgress(
  keyResultUuid: string,
  currentValue: number
): void {
  // 1. 查找关键结果
  const keyResult = this._keyResults.find(kr => kr.uuid === keyResultUuid);
  if (!keyResult) {
    throw new Error('关键结果不存在');
  }

  // 2. 验证值
  if (currentValue < 0) {
    throw new Error('当前值不能为负数');
  }

  // 3. 记录旧值
  const previousValue = keyResult.currentValue;

  // 4. 更新进度
  keyResult.updateProgress(currentValue);

  // 5. 检查是否完成
  if (currentValue >= keyResult.targetValue && !keyResult.completedAt) {
    keyResult.markAsCompleted();
  }

  // 6. 更新时间戳
  this._updatedAt = new Date();

  // 7. 发布事件
  this.addDomainEvent({
    eventType: 'KeyResultProgressUpdatedEvent',
    aggregateId: this._uuid,
    occurredOn: new Date(),
    payload: {
      goalUuid: this._uuid,
      keyResultUuid: keyResult.uuid,
      previousValue,
      newValue: currentValue,
      progress: keyResult.getProgress(),
      isCompleted: keyResult.isCompleted(),
    },
  });
}

// 增量更新
public incrementKeyResultProgress(
  keyResultUuid: string,
  incrementBy: number
): void {
  const keyResult = this._keyResults.find(kr => kr.uuid === keyResultUuid);
  if (!keyResult) {
    throw new Error('关键结果不存在');
  }

  const newValue = keyResult.currentValue + incrementBy;
  this.updateKeyResultProgress(keyResultUuid, newValue);
}
```

### 3.4 KeyResult 实体方法

```typescript
// KeyResult.ts
export class KeyResult extends Entity {
  public updateProgress(currentValue: number): void {
    this._currentValue = currentValue;
    this._updatedAt = new Date();
  }

  public markAsCompleted(): void {
    this._completedAt = new Date();
  }

  public getProgress(): number {
    if (this._targetValue === 0) return 0;
    return Math.min(100, (this._currentValue / this._targetValue) * 100);
  }

  public isCompleted(): boolean {
    return this._currentValue >= this._targetValue || this._completedAt !== null;
  }
}
```

### 3.5 前端实现

```vue
<!-- KeyResultProgressBar.vue -->
<template>
  <div class="key-result-progress">
    <div class="header">
      <span class="title">{{ keyResult.title }}</span>
      <span class="progress-text">
        {{ keyResult.currentValue }} / {{ keyResult.targetValue }}
        {{ keyResult.unit || '' }}
        ({{ progressPercent }}%)
      </span>
    </div>

    <el-progress
      :percentage="progressPercent"
      :color="progressColor"
      :status="keyResult.isCompleted ? 'success' : undefined"
    />

    <div class="actions">
      <el-button size="small" @click="showUpdateDialog = true"> 更新进度 </el-button>

      <el-button
        v-if="keyResult.valueType === 'INCREMENTAL'"
        size="small"
        type="primary"
        @click="handleQuickIncrement"
      >
        +1
      </el-button>
    </div>

    <!-- 更新进度对话框 -->
    <el-dialog v-model="showUpdateDialog" title="更新进度" width="400px">
      <el-form :model="progressForm">
        <el-form-item label="当前值">
          <el-input-number
            v-model="progressForm.currentValue"
            :min="0"
            :max="keyResult.targetValue * 2"
            :precision="2"
          />
        </el-form-item>

        <el-form-item label="或增加">
          <el-input-number v-model="progressForm.incrementBy" :precision="2" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showUpdateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateProgress" :loading="isUpdating">
          更新
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { useGoalStore } from '../stores/goalStore';
import type { KeyResultClientDTO } from '@daily-use/contracts';

const props = defineProps<{
  goalUuid: string;
  keyResult: KeyResultClientDTO;
}>();

const goalStore = useGoalStore();
const showUpdateDialog = ref(false);
const isUpdating = ref(false);

const progressForm = reactive({
  currentValue: props.keyResult.currentValue,
  incrementBy: 0,
});

const progressPercent = computed(() => {
  const progress = (props.keyResult.currentValue / props.keyResult.targetValue) * 100;
  return Math.min(100, Math.round(progress));
});

const progressColor = computed(() => {
  if (progressPercent.value >= 100) return '#67c23a';
  if (progressPercent.value >= 80) return '#409eff';
  if (progressPercent.value >= 50) return '#e6a23c';
  return '#f56c6c';
});

async function handleQuickIncrement() {
  isUpdating.value = true;
  try {
    await goalStore.incrementKeyResultProgress(props.goalUuid, props.keyResult.uuid, 1);
    ElMessage.success('进度 +1');
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败');
  } finally {
    isUpdating.value = false;
  }
}

async function handleUpdateProgress() {
  isUpdating.value = true;
  try {
    if (progressForm.incrementBy !== 0) {
      // 增量更新
      await goalStore.incrementKeyResultProgress(
        props.goalUuid,
        props.keyResult.uuid,
        progressForm.incrementBy,
      );
    } else {
      // 绝对值更新
      await goalStore.updateKeyResultProgress(
        props.goalUuid,
        props.keyResult.uuid,
        progressForm.currentValue,
      );
    }

    ElMessage.success('进度更新成功');
    showUpdateDialog.value = false;
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败');
  } finally {
    isUpdating.value = false;
  }
}
</script>

<style scoped>
.key-result-progress {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 12px;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.title {
  font-weight: 500;
}

.progress-text {
  color: #606266;
  font-size: 14px;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
</style>
```

---

## 4. 删除关键结果

### 4.1 API

```http
DELETE /api/goals/:goalUuid/key-results/:keyResultUuid
```

### 4.2 领域逻辑

```typescript
// Goal.ts
public removeKeyResult(keyResultUuid: string): void {
  // 1. 查找索引
  const index = this._keyResults.findIndex(kr => kr.uuid === keyResultUuid);
  if (index === -1) {
    throw new Error('关键结果不存在');
  }

  // 2. 获取关键结果信息（用于事件）
  const keyResult = this._keyResults[index];

  // 3. 从集合中移除
  this._keyResults.splice(index, 1);

  // 4. 更新时间戳
  this._updatedAt = new Date();

  // 5. 发布事件
  this.addDomainEvent({
    eventType: 'KeyResultRemovedEvent',
    aggregateId: this._uuid,
    occurredOn: new Date(),
    payload: {
      goalUuid: this._uuid,
      keyResultUuid: keyResult.uuid,
      title: keyResult.title,
    },
  });
}
```

### 4.3 应用服务

```typescript
async removeKeyResult(
  goalUuid: string,
  keyResultUuid: string,
  accountUuid: string
): Promise<void> {
  // 1. 加载 Goal
  const goal = await this.goalRepository.findByUuid(goalUuid);
  if (!goal) {
    throw new Error('目标不存在');
  }

  // 2. 权限检查
  if (goal.accountUuid !== accountUuid) {
    throw new Error('无权操作此目标');
  }

  // 3. 删除关键结果
  goal.removeKeyResult(keyResultUuid);

  // 4. 持久化
  await this.goalRepository.save(goal);

  // 5. 发布事件
  this.publishDomainEvents(goal);
}
```

---

## 5. 修改关键结果配置

### 5.1 API

```http
PATCH /api/goals/:goalUuid/key-results/:keyResultUuid
```

### 5.2 请求体

```typescript
interface UpdateKeyResultRequest {
  title?: string;
  description?: string | null;
  targetValue?: number;
  unit?: string | null;
  weight?: number;
  endDate?: number | null;
  order?: number;
}
```

### 5.3 领域逻辑

```typescript
// Goal.ts
public updateKeyResult(
  keyResultUuid: string,
  updates: {
    title?: string;
    description?: string | null;
    targetValue?: number;
    unit?: string | null;
    weight?: number;
    endDate?: Date | null;
    order?: number;
  }
): void {
  // 1. 查找关键结果
  const keyResult = this._keyResults.find(kr => kr.uuid === keyResultUuid);
  if (!keyResult) {
    throw new Error('关键结果不存在');
  }

  // 2. 验证并应用更新
  if (updates.title !== undefined) {
    if (!updates.title || updates.title.trim().length === 0) {
      throw new Error('标题不能为空');
    }
    keyResult.updateTitle(updates.title);
  }

  if (updates.description !== undefined) {
    keyResult.updateDescription(updates.description);
  }

  if (updates.targetValue !== undefined) {
    if (updates.targetValue <= 0) {
      throw new Error('目标值必须大于 0');
    }
    keyResult.updateTargetValue(updates.targetValue);
  }

  if (updates.unit !== undefined) {
    keyResult.updateUnit(updates.unit);
  }

  if (updates.weight !== undefined) {
    keyResult.updateWeight(updates.weight);
  }

  if (updates.endDate !== undefined) {
    keyResult.updateEndDate(updates.endDate);
  }

  if (updates.order !== undefined) {
    keyResult.updateOrder(updates.order);
  }

  // 3. 更新时间戳
  this._updatedAt = new Date();

  // 4. 发布事件
  this.addDomainEvent({
    eventType: 'KeyResultUpdatedEvent',
    aggregateId: this._uuid,
    occurredOn: new Date(),
    payload: {
      goalUuid: this._uuid,
      keyResultUuid: keyResult.uuid,
      updates: Object.keys(updates),
    },
  });
}
```

---

## 6. 目标进度自动计算

### 6.1 计算逻辑

```typescript
// Goal.ts
public getOverallProgress(): number {
  if (this._keyResults.length === 0) {
    return 0;
  }

  // 加权平均计算
  let totalWeight = 0;
  let weightedProgress = 0;

  for (const kr of this._keyResults) {
    const progress = kr.getProgress(); // 0-100
    const weight = kr.weight || 1;

    weightedProgress += progress * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return 0;
  }

  return Math.round(weightedProgress / totalWeight);
}
```

### 6.2 前端实时显示

```vue
<!-- GoalProgressCard.vue -->
<template>
  <div class="goal-progress-card">
    <h3>{{ goal.title }}</h3>

    <div class="overall-progress">
      <span>总体进度</span>
      <el-progress
        :percentage="goal.overallProgress"
        :color="progressColor"
        :status="goal.isCompleted ? 'success' : undefined"
      />
    </div>

    <div class="key-results-list">
      <KeyResultProgressBar
        v-for="kr in goal.keyResults"
        :key="kr.uuid"
        :goal-uuid="goal.uuid"
        :key-result="kr"
      />
    </div>

    <el-button type="primary" @click="handleAddKeyResult"> 添加关键结果 </el-button>
  </div>
</template>
```

---

## 7. 领域事件处理

### 7.1 统计模块监听

```typescript
// apps/api/src/modules/statistics/initialization/eventHandlers.ts

eventBus.on('KeyResultAddedEvent', async (event) => {
  await statisticsService.incrementKeyResultCount(event.payload.goalUuid);
});

eventBus.on('KeyResultProgressUpdatedEvent', async (event) => {
  const { goalUuid, isCompleted } = event.payload;

  if (isCompleted) {
    await statisticsService.incrementCompletedKeyResultCount(goalUuid);
  }

  // 更新目标进度统计
  await statisticsService.updateGoalProgress(goalUuid);
});

eventBus.on('KeyResultRemovedEvent', async (event) => {
  await statisticsService.decrementKeyResultCount(event.payload.goalUuid);
});
```

---

## 8. 错误处理

| 错误场景       | HTTP 状态码 | 错误信息             | 处理方式            |
| -------------- | ----------- | -------------------- | ------------------- |
| 标题为空       | 400         | 关键结果标题不能为空 | 前端校验 + 后端验证 |
| 目标值无效     | 400         | 目标值必须大于 0     | 前端校验 + 后端验证 |
| 当前值为负数   | 400         | 当前值不能为负数     | 前端校验 + 后端验证 |
| 关键结果不存在 | 404         | 关键结果不存在       | 后端检查            |
| 无权操作       | 403         | 无权操作此目标       | 权限检查            |

---

## 9. 测试用例

```typescript
describe('Goal.addKeyResult()', () => {
  it('should add key result to goal', () => {
    const goal = Goal.create({ ...params });

    const kr = goal.addKeyResult({
      title: 'Complete 10 presentations',
      valueType: 'INCREMENTAL',
      targetValue: 10,
      currentValue: 0,
      unit: 'times',
    });

    expect(goal.keyResults).toHaveLength(1);
    expect(kr.title).toBe('Complete 10 presentations');
  });

  it('should throw error when title is empty', () => {
    const goal = Goal.create({ ...params });

    expect(() => {
      goal.addKeyResult({
        title: '',
        valueType: 'INCREMENTAL',
        targetValue: 10,
      });
    }).toThrow('关键结果标题不能为空');
  });
});

describe('Goal.updateKeyResultProgress()', () => {
  it('should update progress and recalculate overall progress', () => {
    const goal = Goal.create({ ...params });
    const kr = goal.addKeyResult({
      title: 'KR1',
      valueType: 'PERCENTAGE',
      targetValue: 100,
      currentValue: 0,
    });

    goal.updateKeyResultProgress(kr.uuid, 50);

    expect(kr.currentValue).toBe(50);
    expect(goal.getOverallProgress()).toBe(50);
  });

  it('should mark key result as completed when target reached', () => {
    const goal = Goal.create({ ...params });
    const kr = goal.addKeyResult({
      title: 'KR1',
      valueType: 'PERCENTAGE',
      targetValue: 100,
      currentValue: 0,
    });

    goal.updateKeyResultProgress(kr.uuid, 100);

    expect(kr.isCompleted()).toBe(true);
    expect(kr.completedAt).not.toBeNull();
  });
});

describe('Goal.getOverallProgress()', () => {
  it('should calculate weighted average progress', () => {
    const goal = Goal.create({ ...params });

    goal.addKeyResult({
      title: 'KR1',
      valueType: 'PERCENTAGE',
      targetValue: 100,
      currentValue: 50,
      weight: 1,
    });

    goal.addKeyResult({
      title: 'KR2',
      valueType: 'PERCENTAGE',
      targetValue: 100,
      currentValue: 100,
      weight: 2,
    });

    // (50*1 + 100*2) / (1+2) = 250/3 ≈ 83
    expect(goal.getOverallProgress()).toBe(83);
  });
});
```

---

## 10. 性能优化

### 10.1 批量更新

```typescript
// 支持批量更新多个关键结果进度
async batchUpdateKeyResultsProgress(
  goalUuid: string,
  updates: Array<{ keyResultUuid: string; currentValue: number }>
): Promise<GoalClientDTO> {
  const goal = await this.goalRepository.findByUuid(goalUuid);

  for (const update of updates) {
    goal.updateKeyResultProgress(update.keyResultUuid, update.currentValue);
  }

  await this.goalRepository.save(goal);
  return goal.toClientDTO(true);
}
```

### 10.2 前端乐观更新

```typescript
// goalStore.ts
async updateKeyResultProgress(
  goalUuid: string,
  keyResultUuid: string,
  currentValue: number
) {
  // 1. 乐观更新本地状态
  const goal = this.goals.find(g => g.uuid === goalUuid);
  const kr = goal.keyResults.find(k => k.uuid === keyResultUuid);
  const oldValue = kr.currentValue;

  kr.currentValue = currentValue;
  goal.overallProgress = this.calculateOverallProgress(goal);

  try {
    // 2. 调用 API
    const response = await goalApiClient.updateKeyResultProgress(
      goalUuid,
      keyResultUuid,
      { currentValue }
    );

    // 3. 用服务器返回的数据替换
    this.replaceGoal(goalUuid, response.goal);
  } catch (error) {
    // 4. 失败时回滚
    kr.currentValue = oldValue;
    goal.overallProgress = this.calculateOverallProgress(goal);
    throw error;
  }
}
```

---

## 11. 参考文档

- [创建目标流程](./CREATE_GOAL_FLOW.md)
- [Goal 模块设计规划](../GOAL_MODULE_PLAN.md)
- [OKR 最佳实践](https://www.whatmatters.com/faqs/okr-meaning-definition-example)
