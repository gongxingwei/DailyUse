# DDD 实体使用模式 - 完整示例

## 📋 概述

这个文档展示了如何在DailyUse项目中使用 **实体对象方式** 而不是 **结构化数据方式** 来操作聚合根中的子实体。

## 🎯 核心改进

### ❌ 旧方式：结构化数据
```typescript
// 手动创建数据结构
goal.createKeyResult({
  name: "减重10公斤",
  targetValue: 10,
  unit: "公斤",
  weight: 30
});
```

### ✅ 新方式：实体对象
```typescript
// 使用实体对象
const keyResult = goal.createKeyResultForEdit({
  accountUuid: "account-123",
  name: "减重10公斤", 
  unit: "公斤",
  targetValue: 10,
  weight: 30
});

// 可以利用实体的业务方法
keyResult.updateInfo({ name: "新名称" });
keyResult.updateProgress(5);

// 添加到聚合
goal.createKeyResult(keyResult);
```

## 🔄 完整的CRUD操作示例

### 1. 创建关键结果

```typescript
// 场景：用户在目标详情页面点击"添加关键结果"

// 1. 创建空白关键结果实体用于表单
const newKeyResult = goal.createKeyResultForEdit({
  accountUuid: currentUser.uuid,
  unit: "次" // 默认单位
});

// 2. 用户填写表单后更新实体
newKeyResult.updateInfo({
  name: "每周跑步3次",
  targetValue: 3,
  weight: 25
});

// 3. 通过聚合根添加（会进行业务规则验证）
try {
  const keyResultUuid = goal.createKeyResult(newKeyResult);
  console.log(`关键结果创建成功: ${keyResultUuid}`);
} catch (error) {
  console.error('创建失败:', error.message);
  // 例如："关键结果权重总和不能超过100%，当前总和: 80%"
}
```

### 2. 编辑关键结果

```typescript
// 场景：用户点击编辑某个关键结果

// 1. 获取关键结果的克隆版本用于编辑（避免影响原数据）
const keyResultForEdit = goal.getKeyResultForEdit("keyresult-uuid");
if (!keyResultForEdit) {
  throw new Error('关键结果不存在');
}

// 2. 用户修改表单，更新实体
keyResultForEdit.updateInfo({
  name: "每周跑步4次", // 修改名称
  targetValue: 4,     // 修改目标值
  weight: 30          // 修改权重
});

// 3. 通过聚合根保存更改
try {
  goal.updateKeyResult(keyResultForEdit);
  console.log('关键结果更新成功');
} catch (error) {
  console.error('更新失败:', error.message);
}
```

### 3. 更新进度

```typescript
// 场景：用户记录今天的跑步成果

// 1. 获取关键结果实体
const keyResult = goal.getKeyResultEntity("keyresult-uuid");
if (!keyResult) {
  throw new Error('关键结果不存在');
}

// 2. 更新进度（利用实体的业务方法）
keyResult.updateProgress(1, 'increment'); // 增加1次

// 3. 同时创建记录
const recordUuid = goal.createRecord({
  keyResultUuid: keyResult.uuid,
  value: keyResult.currentValue,
  note: "今天跑了5公里"
});

// 4. 保存关键结果的进度更新
goal.updateKeyResult(keyResult);
```

### 4. 克隆用于不同场景

```typescript
// 场景1：复制关键结果到其他目标
const originalKeyResult = goal.getKeyResultEntity("keyresult-uuid");
const clonedKeyResult = originalKeyResult.clone();

// 修改克隆版本的目标关联
const newKeyResult = KeyResult.forCreate({
  accountUuid: clonedKeyResult.accountUuid,
  goalUuid: "new-goal-uuid", // 新目标
  name: clonedKeyResult.name,
  unit: clonedKeyResult.unit,
  targetValue: clonedKeyResult.targetValue,
  weight: clonedKeyResult.weight
});

// 添加到新目标
newGoal.createKeyResult(newKeyResult);
```

## 🎨 在Vue组件中的使用

### 关键结果编辑组件

```vue
<template>
  <div class="key-result-form">
    <form @submit.prevent="handleSubmit">
      <input 
        v-model="keyResult.name" 
        placeholder="关键结果名称"
        required
      />
      
      <input 
        v-model.number="keyResult.targetValue" 
        type="number"
        placeholder="目标值"
        required
      />
      
      <input 
        v-model="keyResult.unit" 
        placeholder="单位"
        required
      />
      
      <input 
        v-model.number="keyResult.weight" 
        type="number"
        placeholder="权重 (%)"
        min="1" 
        max="100"
        required
      />
      
      <button type="submit">{{ isEditing ? '更新' : '创建' }}</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Goal } from '@/modules/goal/domain/entities/Goal';
import { KeyResult } from '@/modules/goal/domain/entities/KeyResult';

const props = defineProps<{
  goal: Goal;
  keyResultUuid?: string; // 编辑模式时传入
}>();

const emit = defineEmits<{
  success: [keyResultUuid: string];
  error: [message: string];
}>();

const keyResult = ref<KeyResult>();
const isEditing = computed(() => !!props.keyResultUuid);

onMounted(() => {
  if (isEditing.value) {
    // 编辑模式：获取关键结果的克隆版本
    keyResult.value = props.goal.getKeyResultForEdit(props.keyResultUuid!);
    if (!keyResult.value) {
      emit('error', '关键结果不存在');
      return;
    }
  } else {
    // 创建模式：创建新的关键结果实体
    keyResult.value = props.goal.createKeyResultForEdit({
      accountUuid: currentUser.value.uuid,
      unit: '个' // 默认单位
    });
  }
});

const handleSubmit = async () => {
  if (!keyResult.value) return;
  
  try {
    if (isEditing.value) {
      // 更新现有关键结果
      props.goal.updateKeyResult(keyResult.value);
    } else {
      // 创建新关键结果
      const uuid = props.goal.createKeyResult(keyResult.value);
      emit('success', uuid);
      return;
    }
    
    emit('success', keyResult.value.uuid);
  } catch (error) {
    emit('error', error.message);
  }
};
</script>
```

## 🏆 架构优势总结

### 1. **类型安全**
- ✅ 编译时类型检查
- ✅ IDE智能提示
- ✅ 避免拼写错误

### 2. **业务逻辑封装**
- ✅ 实体内部封装验证逻辑
- ✅ 聚合根专注聚合层面控制
- ✅ 单一职责原则

### 3. **代码复用**
- ✅ `forCreate()` 创建标准实例
- ✅ `clone()` 安全地复制数据
- ✅ 实体方法可在多处使用

### 4. **数据完整性**
- ✅ 构造函数保证必要字段
- ✅ 实体方法维护数据一致性
- ✅ 聚合根控制边界完整性

### 5. **测试友好**
- ✅ 实体可独立测试
- ✅ 聚合根业务规则可独立测试
- ✅ Mock和测试数据创建简单

### 6. **维护性**
- ✅ 修改实体逻辑只需改一处
- ✅ 重构时类型系统提供保障
- ✅ 业务规则变更影响范围清晰

## 🔄 迁移指南

### 步骤1：更新现有聚合根方法
```typescript
// 将参数从结构化数据改为实体对象
- createKeyResult(data: KeyResultData): string
+ createKeyResult(keyResult: KeyResult): string

- updateKeyResult(uuid: string, updates: Partial<KeyResultData>): void  
+ updateKeyResult(keyResult: KeyResult): void
```

### 步骤2：添加实体工厂方法
```typescript
// 在聚合根中添加便捷的创建方法
createKeyResultForEdit(params: CreateParams): KeyResult
getKeyResultForEdit(uuid: string): KeyResult | undefined
```

### 步骤3：更新业务逻辑调用
```typescript
// 旧方式
const uuid = goal.createKeyResult({ name: "test", ... });

// 新方式  
const keyResult = goal.createKeyResultForEdit({ ... });
keyResult.updateInfo({ name: "test" });
const uuid = goal.createKeyResult(keyResult);
```

这种方式让我们的DDD架构更加纯粹，实体承担更多责任，聚合根专注于聚合层面的控制，整体架构更加清晰和易维护！ 🎯
