# 乐观更新（Optimistic Updates）完整指南

## 什么是乐观更新？

**乐观更新**（Optimistic Updates）是一种UI交互模式，在发送API请求之前就先更新UI，假设请求会成功。如果请求失败，再回滚到之前的状态。

### 传统方式 vs 乐观更新

```typescript
// ❌ 传统方式：等待后端响应
async function createGoal(data) {
  setLoading(true);
  try {
    const response = await api.createGoal(data); // 等待后端
    store.addGoal(response.data); // 成功后才更新UI
    setLoading(false);
  } catch (error) {
    setLoading(false);
    showError(error);
  }
}

// ✅ 乐观更新：立即更新UI
async function createGoalOptimistic(data) {
  const goalUuid = uuidv4(); // 前端生成UUID
  const tempGoal = {
    uuid: goalUuid,
    ...data,
    _optimistic: true, // 标记为乐观更新
  };
  
  // 1. 立即更新UI（乐观）
  store.addGoal(tempGoal);
  
  try {
    // 2. 发送请求
    const response = await api.createGoal({ uuid: goalUuid, ...data });
    
    // 3. 成功：用服务器数据替换临时数据
    store.updateGoal(goalUuid, response.data);
  } catch (error) {
    // 4. 失败：回滚
    store.removeGoal(goalUuid);
    showError(error);
  }
}
```

## 为什么需要前端 UUID 生成？

乐观更新的**关键前提**是：**前端需要知道创建的资源的 ID**。

```typescript
// ❌ 没有前端UUID：无法乐观更新
async function createGoal(data) {
  // 问题：不知道新目标的ID是什么
  const tempGoal = { id: '???', ...data };
  store.addGoal(tempGoal); // ❌ ID不确定，无法关联
  
  const response = await api.createGoal(data);
  // ❌ 无法找到之前添加的临时数据
  store.updateGoal('???', response.data);
}

// ✅ 有前端UUID：完美支持乐观更新
async function createGoalOptimistic(data) {
  const goalUuid = uuidv4(); // ✅ 前端生成确定的UUID
  const tempGoal = { uuid: goalUuid, ...data };
  store.addGoal(tempGoal); // ✅ ID确定
  
  const response = await api.createGoal({ uuid: goalUuid, ...data });
  store.updateGoal(goalUuid, response.data); // ✅ 可以通过UUID找到
}
```

## 乐观更新的优势

### 1. **即时反馈** ⚡
用户操作立即生效，无需等待网络请求。

```typescript
// 用户点击"创建目标" → UI立即显示新目标 → 后台发送请求
// 体验：0ms 延迟 vs 传统方式的 100-500ms 延迟
```

### 2. **离线支持** 📱
可以在离线状态下继续操作，等恢复网络后同步。

```typescript
// 离线时
store.addGoal(tempGoal);
queue.add({ type: 'createGoal', data: tempGoal });

// 恢复网络后
await syncQueue();
```

### 3. **更流畅的用户体验** 🎯
减少加载状态，应用感觉更快、更响应。

## 实现乐观更新 - Domain-Client

### 1. Goal 实体的 forCreate 方法

```typescript
// packages/domain-client/src/goal/aggregates/Goal.ts

import { v4 as uuidv4 } from 'uuid';
import type { GoalContracts } from '@dailyuse/contracts';

export class Goal {
  private _uuid: string;
  private _name: string;
  // ... 其他字段

  /**
   * 创建用于新建目标的对象（前端预生成UUID）
   * 用于乐观更新
   */
  static forCreate(data: {
    name: string;
    description?: string;
    color?: string;
    startTime: number;
    endTime: number;
    analysis: GoalContracts.GoalDTO['analysis'];
    metadata?: GoalContracts.GoalDTO['metadata'];
  }): Goal {
    const uuid = uuidv4(); // ✅ 前端生成UUID
    
    return new Goal({
      uuid,
      name: data.name,
      description: data.description,
      color: data.color || '#3B82F6',
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      note: undefined,
      dirUuid: undefined,
      analysis: data.analysis,
      lifecycle: {
        createdAt: new Date(),
        updatedAt: new Date(),
        status: GoalContracts.GoalStatus.ACTIVE,
      },
      metadata: data.metadata || { tags: [], category: '' },
      version: 1,
      keyResults: [],
      records: [],
      reviews: [],
    });
  }

  /**
   * 转换为创建请求DTO
   */
  toCreateRequest(): GoalContracts.CreateGoalRequest {
    return {
      uuid: this._uuid, // ✅ 包含前端生成的UUID
      name: this._name,
      description: this._description,
      color: this._color,
      startTime: this._startTime.getTime(),
      endTime: this._endTime.getTime(),
      note: this._note,
      dirUuid: this._dirUuid,
      analysis: this._analysis,
      metadata: this._metadata,
    };
  }

  /**
   * 从服务器响应创建实体
   */
  static fromClientDTO(dto: GoalContracts.GoalClientDTO): Goal {
    return new Goal(dto);
  }
}
```

### 2. 前端 Store/Composable 实现

```typescript
// apps/web/src/modules/goal/presentation/composables/useGoal.ts

import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { Goal } from '@dailyuse/domain-client';
import { goalApi } from '../../infrastructure/api/goalApi';
import type { GoalContracts } from '@dailyuse/contracts';

interface OptimisticGoal extends GoalContracts.GoalClientDTO {
  _optimistic?: boolean; // 标记为乐观更新
  _error?: string; // 如果失败，存储错误信息
}

export function useGoal() {
  const goals = ref<Map<string, OptimisticGoal>>(new Map());
  const isLoading = ref(false);

  /**
   * 乐观创建目标
   */
  async function createGoalOptimistic(data: {
    name: string;
    description?: string;
    color?: string;
    startTime: number;
    endTime: number;
    analysis: GoalContracts.GoalDTO['analysis'];
    metadata?: GoalContracts.GoalDTO['metadata'];
  }) {
    // 1. 使用 forCreate 创建前端实体（自动生成UUID）
    const goal = Goal.forCreate(data);
    const goalUuid = goal.uuid;

    // 2. 立即添加到本地状态（乐观更新）
    const tempGoal: OptimisticGoal = {
      ...goal.toClientDTO(),
      _optimistic: true, // ✅ 标记为乐观数据
    };
    goals.value.set(goalUuid, tempGoal);

    try {
      // 3. 发送创建请求（包含前端UUID）
      const request = goal.toCreateRequest();
      const response = await goalApi.createGoal(request);

      // 4. 成功：用服务器数据替换临时数据
      goals.value.set(goalUuid, {
        ...response.data,
        _optimistic: false, // ✅ 移除乐观标记
      });

      return { success: true, data: response.data };
    } catch (error) {
      // 5. 失败：标记错误但保留数据（让用户看到失败）
      const failedGoal = goals.value.get(goalUuid);
      if (failedGoal) {
        goals.value.set(goalUuid, {
          ...failedGoal,
          _optimistic: false,
          _error: error.message, // ✅ 显示错误信息
        });
      }

      // 可选：自动重试或移除
      setTimeout(() => {
        goals.value.delete(goalUuid);
      }, 3000);

      return { success: false, error };
    }
  }

  /**
   * 乐观添加关键结果
   */
  async function addKeyResultOptimistic(
    goalUuid: string,
    data: {
      name: string;
      startValue: number;
      targetValue: number;
      unit: string;
      weight: number;
    }
  ) {
    const krUuid = uuidv4();

    // 1. 立即添加到本地目标
    const goal = goals.value.get(goalUuid);
    if (!goal) return { success: false, error: 'Goal not found' };

    const tempKR: GoalContracts.KeyResultClientDTO = {
      uuid: krUuid,
      goalUuid,
      name: data.name,
      startValue: data.startValue,
      targetValue: data.targetValue,
      currentValue: data.startValue,
      unit: data.unit,
      weight: data.weight,
      calculationMethod: GoalContracts.KeyResultCalculationMethod.SUM,
      lifecycle: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: GoalContracts.KeyResultStatus.ACTIVE,
      },
      // 计算属性
      progress: 0,
      isCompleted: false,
      remaining: data.targetValue - data.startValue,
    };

    goal.keyResults = [...(goal.keyResults || []), tempKR];
    goals.value.set(goalUuid, { ...goal });

    try {
      // 2. 发送请求
      const response = await goalApi.createKeyResult(goalUuid, {
        uuid: krUuid,
        ...data,
      });

      // 3. 成功：更新数据
      goal.keyResults = goal.keyResults?.map((kr) =>
        kr.uuid === krUuid ? response.data : kr
      );
      goals.value.set(goalUuid, { ...goal });

      return { success: true, data: response.data };
    } catch (error) {
      // 4. 失败：移除临时数据
      goal.keyResults = goal.keyResults?.filter((kr) => kr.uuid !== krUuid);
      goals.value.set(goalUuid, { ...goal });

      return { success: false, error };
    }
  }

  /**
   * 乐观添加进度记录
   */
  async function addRecordOptimistic(
    goalUuid: string,
    keyResultUuid: string,
    value: number,
    note?: string
  ) {
    const recordUuid = uuidv4();

    // 1. 立即更新本地数据
    const goal = goals.value.get(goalUuid);
    if (!goal) return { success: false, error: 'Goal not found' };

    // 更新关键结果的当前值
    const kr = goal.keyResults?.find((k) => k.uuid === keyResultUuid);
    if (!kr) return { success: false, error: 'KeyResult not found' };

    const newCurrentValue = kr.currentValue + value;
    kr.currentValue = newCurrentValue;
    kr.progress = ((newCurrentValue - kr.startValue) / (kr.targetValue - kr.startValue)) * 100;
    kr.isCompleted = newCurrentValue >= kr.targetValue;
    kr.remaining = Math.max(0, kr.targetValue - newCurrentValue);

    // 添加记录
    const tempRecord: GoalContracts.GoalRecordClientDTO = {
      uuid: recordUuid,
      goalUuid,
      keyResultUuid,
      value,
      note,
      createdAt: Date.now(),
    };

    goal.records = [...(goal.records || []), tempRecord];
    goals.value.set(goalUuid, { ...goal });

    try {
      // 2. 发送请求
      const response = await goalApi.createRecord(goalUuid, {
        uuid: recordUuid,
        keyResultUuid,
        value,
        note,
      });

      // 3. 成功：确认数据
      goal.records = goal.records?.map((r) =>
        r.uuid === recordUuid ? response.data : r
      );
      goals.value.set(goalUuid, { ...goal });

      return { success: true, data: response.data };
    } catch (error) {
      // 4. 失败：回滚
      kr.currentValue -= value;
      kr.progress = ((kr.currentValue - kr.startValue) / (kr.targetValue - kr.startValue)) * 100;
      kr.isCompleted = kr.currentValue >= kr.targetValue;
      kr.remaining = Math.max(0, kr.targetValue - kr.currentValue);

      goal.records = goal.records?.filter((r) => r.uuid !== recordUuid);
      goals.value.set(goalUuid, { ...goal });

      return { success: false, error };
    }
  }

  /**
   * 获取所有目标（包括乐观数据）
   */
  const allGoals = computed(() => {
    return Array.from(goals.value.values());
  });

  /**
   * 获取确认的目标（排除乐观数据）
   */
  const confirmedGoals = computed(() => {
    return Array.from(goals.value.values()).filter((g) => !g._optimistic);
  });

  /**
   * 获取待确认的目标（仅乐观数据）
   */
  const pendingGoals = computed(() => {
    return Array.from(goals.value.values()).filter((g) => g._optimistic);
  });

  return {
    goals: allGoals,
    confirmedGoals,
    pendingGoals,
    isLoading,
    createGoalOptimistic,
    addKeyResultOptimistic,
    addRecordOptimistic,
  };
}
```

### 3. UI 组件使用

```vue
<!-- apps/web/src/modules/goal/presentation/components/GoalCreateDialog.vue -->

<script setup lang="ts">
import { ref } from 'vue';
import { useGoal } from '../composables/useGoal';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

const { createGoalOptimistic, pendingGoals } = useGoal();
const goalName = ref('');
const isCreating = ref(false);

async function handleCreate() {
  if (!goalName.value.trim()) return;

  isCreating.value = true;

  const result = await createGoalOptimistic({
    name: goalName.value,
    color: '#3B82F6',
    startTime: Date.now(),
    endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
    analysis: {
      motive: '',
      feasibility: '',
      importanceLevel: ImportanceLevel.Moderate,
      urgencyLevel: UrgencyLevel.Medium,
    },
    metadata: {
      tags: [],
      category: '',
    },
  });

  isCreating.value = false;

  if (result.success) {
    // ✅ UI已经立即更新，这里只需要关闭对话框
    goalName.value = '';
    // 显示成功提示（可选）
  } else {
    // ❌ 显示错误（目标已被标记错误，仍显示在列表中）
    alert('创建失败：' + result.error);
  }
}
</script>

<template>
  <div class="goal-create-dialog">
    <input v-model="goalName" placeholder="输入目标名称" />
    <button @click="handleCreate" :disabled="isCreating">
      {{ isCreating ? '创建中...' : '创建目标' }}
    </button>

    <!-- 显示待确认的目标 -->
    <div v-if="pendingGoals.length > 0" class="pending-goals">
      <p>等待确认的目标: {{ pendingGoals.length }}</p>
      <ul>
        <li v-for="goal in pendingGoals" :key="goal.uuid">
          {{ goal.name }}
          <span v-if="goal._error" class="error">❌ {{ goal._error }}</span>
          <span v-else class="syncing">🔄 同步中...</span>
        </li>
      </ul>
    </div>
  </div>
</template>
```

## 乐观更新的最佳实践

### 1. **视觉反馈**
使用视觉样式区分乐观数据：

```css
.goal-item.optimistic {
  opacity: 0.7;
  border: 1px dashed #ccc;
}

.goal-item.optimistic::after {
  content: "🔄";
  margin-left: 8px;
}

.goal-item.error {
  background-color: #fee;
  border-color: #f00;
}
```

### 2. **错误处理策略**

```typescript
// 策略 1: 立即移除
catch (error) {
  goals.value.delete(goalUuid);
  showError(error);
}

// 策略 2: 标记错误，保留数据，允许重试
catch (error) {
  goal._error = error.message;
  goal._retryable = true;
  goals.value.set(goalUuid, goal);
}

// 策略 3: 加入重试队列
catch (error) {
  retryQueue.add({
    type: 'createGoal',
    data: goal,
    retryCount: 0,
  });
}
```

### 3. **并发控制**

```typescript
// 防止重复提交
const pendingRequests = new Map<string, Promise<any>>();

async function createGoalOptimistic(data) {
  const goalUuid = uuidv4();
  
  if (pendingRequests.has(goalUuid)) {
    return pendingRequests.get(goalUuid);
  }

  const promise = (async () => {
    // ... 创建逻辑
  })();

  pendingRequests.set(goalUuid, promise);
  
  try {
    return await promise;
  } finally {
    pendingRequests.delete(goalUuid);
  }
}
```

## 总结

### 乐观更新的核心要素

1. **前端 UUID 生成** - 使用 `uuid` 库生成确定的ID
2. **forCreate 方法** - 实体提供预创建方法
3. **立即更新 UI** - 不等待服务器响应
4. **视觉区分** - 标记乐观数据（_optimistic）
5. **错误处理** - 失败时回滚或标记错误
6. **最终一致性** - 服务器响应后同步数据

### 优势

- ⚡ **即时反馈**：0ms 延迟
- 📱 **离线支持**：可排队同步
- 🎯 **更好的用户体验**：应用感觉更快

### 注意事项

- ⚠️ 需要处理失败回滚
- ⚠️ 需要考虑并发冲突
- ⚠️ 后端需要支持幂等性（使用前端UUID）
