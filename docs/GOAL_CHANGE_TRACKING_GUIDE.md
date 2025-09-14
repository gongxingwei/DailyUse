# Goal 变更跟踪系统使用指南

## 概述

我们已经为客户端 Goal 类实现了一个完整的变更跟踪系统，能够精确跟踪 keyResults、records、reviews 的创建、更新、删除操作，并在调用 `toUpdateRequest()` 时生成正确的 `UpdateGoalRequest` 结构。

## 系统架构

### 1. 变更跟踪器结构

```typescript
private _changeTracker = {
  keyResults: {
    created: KeyResult[],     // 新创建的关键结果
    updated: Array<{          // 被修改的关键结果
      original: KeyResult,    // 原始状态
      current: KeyResult      // 当前状态
    }>,
    deleted: string[]         // 被删除的UUID列表
  },
  records: {
    created: GoalRecord[],
    updated: Array<{ original: GoalRecord, current: GoalRecord }>,
    deleted: string[]
  },
  reviews: {
    created: GoalReview[],
    updated: Array<{ original: GoalReview, current: GoalReview }>,
    deleted: string[]
  }
};
```

### 2. 核心方法

#### 开始编辑模式
```typescript
goalModel.startEditing(); // 保存当前状态并清空变更跟踪器
```

#### 关键结果操作
```typescript
// 添加新的关键结果
goalModel.addNewKeyResult(keyResult);

// 更新关键结果
goalModel.updateKeyResultWithTracking(uuid, updates);

// 删除关键结果
goalModel.removeKeyResultWithTracking(uuid);
```

#### 记录操作
```typescript
// 添加新记录
goalModel.addNewRecord(record);

// 删除记录
goalModel.removeRecordWithTracking(uuid);
```

#### 复盘操作
```typescript
// 添加新复盘
goalModel.addNewReview(review);

// 删除复盘
goalModel.removeReviewWithTracking(uuid);
```

## 使用示例

### 1. 在 GoalDialog 中的使用

```vue
<script setup lang="ts">
// 在编辑模式下启用变更跟踪
watch(
  [() => visible, () => propGoal.value],
  ([visible, goal]) => {
    if (visible) {
      if (goal) {
        goalModel.value = goal.clone();
        // 关键：启用变更跟踪
        goalModel.value.startEditing();
      } else {
        goalModel.value = Goal.forCreate();
      }
    }
  },
  { immediate: true }
);

// 删除关键结果时使用变更跟踪
const startRemoveKeyResult = (goal: Goal, keyResultUuid: string) => {
  if (isEditing.value) {
    // 使用变更跟踪方法
    goalModel.value.removeKeyResultWithTracking(keyResultUuid);
  } else {
    // 直接调用API
    deleteKeyResultForGoal(goal.uuid, keyResultUuid);
  }
};

// 保存时使用 toUpdateRequest()
const handleSave = () => {
  if (isEditing.value) {
    // 生成包含所有变更操作的请求
    updateGoal(goalModel.value.uuid, goalModel.value.toUpdateRequest());
  } else {
    createGoal(goalModel.value.toDTO());
  }
};
</script>
```

### 2. 在 KeyResultDialog 中的使用

```vue
<script setup lang="ts">
const handleSave = async () => {
  if (isEditing.value) {
    // 更新现有关键结果的逻辑...
  } else {
    if (isInGoalEditing.value) {
      // 在目标编辑模式下，使用变更跟踪添加
      propGoal.value?.addNewKeyResult(localKeyResult.value);
      closeDialog();
      return;
    }
    // 直接创建
    await createKeyResultForGoal(propGoalUuid.value!, localKeyResult.value.toDTO());
  }
};
</script>
```

## 生成的 UpdateGoalRequest 示例

当调用 `goalModel.toUpdateRequest()` 时，会生成如下结构：

```typescript
{
  // 基本字段更新
  name: "更新后的目标名称",
  description: "更新后的描述",
  color: "#FF5733",
  
  // 关键结果操作
  keyResults: [
    {
      action: "create",
      data: {
        goalUuid: "goal-uuid",
        name: "新关键结果",
        startValue: 0,
        targetValue: 100,
        currentValue: 0,
        unit: "个",
        weight: 30,
        calculationMethod: "sum"
      }
    },
    {
      action: "update", 
      uuid: "existing-kr-uuid",
      data: {
        name: "更新后的关键结果名称",
        currentValue: 25,
        weight: 35
      }
    },
    {
      action: "delete",
      uuid: "deleted-kr-uuid"
    }
  ],
  
  // 记录操作
  records: [
    {
      action: "create",
      data: {
        keyResultUuid: "kr-uuid",
        value: 10,
        note: "新增记录"
      }
    }
  ],
  
  // 复盘操作
  reviews: [
    {
      action: "create", 
      data: {
        title: "周复盘",
        type: "weekly",
        content: { achievements: "...", challenges: "..." },
        rating: { progressSatisfaction: 8, executionEfficiency: 7 }
      }
    }
  ]
}
```

## 后端处理

后端的 `GoalApplicationService.updateGoal()` 已经支持处理这种请求结构：

1. **create 操作**：创建新的子实体
2. **update 操作**：更新现有子实体的指定字段 
3. **delete 操作**：删除指定的子实体

系统会在一个事务中执行所有操作，最后返回完整的聚合根数据。

## 注意事项

1. **必须调用 startEditing()**：在编辑模式下必须调用此方法来启用变更跟踪
2. **使用正确的方法**：编辑模式下使用 `*WithTracking` 方法，创建模式下使用普通方法
3. **事务性**：所有变更都在后端的一个事务中执行，确保数据一致性
4. **完整数据**：后端会返回更新后的完整聚合根数据，前端会正确处理关联数据

## 测试验证

您可以通过以下步骤验证系统：

1. 打开一个现有目标进行编辑
2. 添加新的关键结果
3. 修改现有关键结果  
4. 删除某个关键结果
5. 保存目标

查看网络请求，应该能看到正确的 `UpdateGoalRequest` 结构，包含所有的 create/update/delete 操作。
