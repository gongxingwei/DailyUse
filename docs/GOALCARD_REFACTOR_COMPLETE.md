# GoalCard 组件重构完成报告

## 概述

已成功将 `GoalCard` 组件从基于 props/emit 的外部控制模式重构为使用内部业务逻辑的自包含组件。

## 重构要点

### 1. 移除了 Props/Emit 模式

**之前的设计：**
```typescript
// Emits 接口定义
interface Emits {
  (e: 'edit-goal', goal: Goal): void;
  (e: 'start-delete-goal', goalUuid: string): void;
  (e: 'add-key-result', goalUuid: string): void;
  (e: 'edit-key-result', goalUuid: string, keyResult: KeyResult): void;
  (e: 'review-goal', goalUuid: string): void;
}

// 模板中的事件处理
@click="$emit('edit-goal', goal)"
@click="$emit('start-delete-goal', goal.uuid)"
```

**现在的设计：**
```typescript
// 内部业务逻辑方法
const editGoal = async () => {
  try {
    goalComposable.openEditDialog(props.goal);
  } catch (error) {
    console.error('Failed to open edit dialog:', error);
  }
};

// 模板中的事件处理
@click="editGoal"
@click="deleteGoal"
```

### 2. 集成 useGoal Composable

```typescript
import { useGoal } from '../../composables/useGoal';

const goalComposable = useGoal();
```

组件现在直接使用 `useGoal` composable 中的业务逻辑方法：
- `goalComposable.openEditDialog()` - 打开编辑对话框
- `goalComposable.deleteGoal()` - 删除目标
- 导航到复盘页面等

### 3. 添加了 openCard 暴露方法

```typescript
/**
 * 打开卡片详情 - 可供外部调用的方法
 */
const openCard = () => {
  isCardOpen.value = true;
  goToGoalDetailView();
};

/**
 * 关闭卡片
 */
const closeCard = () => {
  isCardOpen.value = false;
};

// 暴露方法给父组件
defineExpose({
  openCard,
  closeCard,
});
```

### 4. 内部状态管理

```typescript
// 内部状态控制
const isCardOpen = ref(false);
```

## 使用方式

### 1. 基本使用

```vue
<template>
  <GoalCard 
    :goal="goal"
    @click="selectGoal(goal)"
  />
</template>

<script setup>
import GoalCard from './GoalCard.vue'
</script>
```

### 2. 程序化控制

```vue
<template>
  <GoalCard 
    :goal="goal"
    ref="goalCardRef"
  />
  <v-btn @click="openCard">打开卡片</v-btn>
</template>

<script setup>
import { ref } from 'vue'
import GoalCard from './GoalCard.vue'

const goalCardRef = ref()

const openCard = () => {
  goalCardRef.value.openCard()
}
</script>
```

### 3. 批量控制示例

```vue
<template>
  <GoalCard
    v-for="goal in goals"
    :key="goal.uuid"
    :goal="goal"
    ref="goalCardRefs"
  />
  <v-btn @click="openSelectedCard">打开选中的卡片</v-btn>
</template>

<script setup>
import { ref, computed } from 'vue'

const goalCardRefs = ref([])
const selectedIndex = ref(0)

const openSelectedCard = () => {
  const selectedCard = goalCardRefs.value[selectedIndex.value]
  if (selectedCard) {
    selectedCard.openCard()
  }
}
</script>
```

## 新增功能

### 内部业务逻辑处理

1. **编辑目标**: 直接调用 `useGoal` 的 `openEditDialog` 方法
2. **删除目标**: 包含确认对话框，直接调用 API 删除
3. **复盘功能**: 自动导航到复盘页面
4. **错误处理**: 所有操作都有完整的错误处理

### 状态管理

- `isCardOpen`: 控制卡片打开状态
- 完整的计算属性支持进度显示、状态颜色等

## 优势

1. **减少耦合**: 父组件无需处理具体的业务逻辑
2. **更简洁的 API**: 只需传入 `goal` 属性
3. **更好的封装**: 内部状态和业务逻辑完全封装
4. **类型安全**: TypeScript 完全支持
5. **可复用性**: 组件可以在任何地方使用，无需重复业务逻辑

## 示例文件

已创建 `GoalCardDemo.vue` 文件，展示了如何使用重构后的 GoalCard 组件，包括：

- 基本渲染
- 程序化控制 openCard 方法
- 与 useGoal composable 的集成
- 响应式数据绑定

## 兼容性

该重构保持了组件的核心功能，但改变了交互模式：

- ✅ 保持：所有显示功能
- ✅ 保持：样式和布局
- ✅ 保持：所有计算属性
- ✅ 新增：openCard/closeCard 暴露方法
- ❌ 移除：props/emit 事件系统
- ✅ 改进：内部业务逻辑处理

## 总结

GoalCard 组件现在是一个真正的自包含组件，使用内部业务逻辑处理所有用户交互，同时暴露 `openCard` 方法供外部程序化控制。这种设计更符合现代 Vue 3 组件开发的最佳实践。
