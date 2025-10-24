# Validation 系统使用指南

本项目包含两套验证系统，它们各有不同的用途和使用场景。

## 系统架构概述

```
┌─ 前端 Vue 组件 ─┐
│  实时表单验证    │  ←→  composables/useXXXValidation.ts (前端快速验证)
│  用户体验反馈    │
└──────────────────┘
         ↓ 提交时
┌─ 业务服务层 ─────┐
│  数据保存前验证  │  ←→  services/validation/ (后端完整验证)
│  完整性检查      │
└──────────────────┘
```

## 1. validation/ - 后端完整验证系统

### 位置与文件

```
src/modules/Task/services/validation/
├── types.ts                    # 验证相关类型定义
├── ValidationUtils.ts          # 通用验证工具
├── TaskTemplateValidator.ts    # 主验证器
├── ValidatorFactory.ts         # 验证器工厂和高级功能
├── index.ts                    # 统一导出
├── validators/                 # 专门验证器
│   ├── BasicInfoValidator.ts
│   ├── TimeConfigValidator.ts
│   ├── RecurrenceValidator.ts
│   ├── ReminderValidator.ts
│   ├── MetadataValidator.ts
│   └── SchedulingPolicyValidator.ts
├── README.md                   # 详细文档
├── examples.ts                 # 使用示例
└── tests.ts                    # 测试文件
```

### 主要特点

- **完整性验证**: 对数据进行深度验证
- **多种验证模式**: create/update/strict/quick
- **详细报告**: 包含错误、警告、统计信息
- **类型安全**: 完整的TypeScript支持
- **可扩展**: 支持自定义验证器和规则

### 使用场景

1. **数据保存前验证**: 在taskTemplateService中使用
2. **API接口验证**: 确保数据完整性
3. **批量数据处理**: 验证导入的数据
4. **数据迁移**: 验证历史数据

### 使用示例

```typescript
// 在服务层使用
import { TaskTemplateValidator } from './validation';

async addTaskTemplate(template: TaskTemplate): Promise<TResponse<void>> {
  // 创建模式验证
  const validation = TaskTemplateValidator.validateForCreate(template);

  if (!validation.isValid) {
    return {
      success: false,
      message: `验证失败: ${validation.errors.join(", ")}`,
      data: undefined,
    };
  }

  // 保存数据...
}
```

## 2. composables/useXXXValidation.ts - 前端表单验证

### 位置与文件

```
src/modules/Task/composables/
├── useTaskTemplateFormValidation.ts  # 整体表单验证
├── useReminderValidation.ts          # 提醒配置验证
├── useTimeConfigValidation.ts        # 时间配置验证
└── useRecurrenceValidation.ts        # 重复规则验证
```

### 主要特点

- **实时反馈**: 用户输入时立即验证
- **Vue集成**: 与Vue组件紧密集成
- **轻量级**: 快速响应，不阻塞UI
- **渐进式**: 可以单独使用某个验证功能

### 使用场景

1. **表单实时验证**: 用户输入时的即时反馈
2. **UI状态控制**: 控制按钮启用/禁用状态
3. **用户提示**: 显示错误信息和警告
4. **表单提交前**: 快速检查

### 使用示例

```vue
<template>
  <v-form>
    <!-- 显示验证错误 -->
    <v-alert v-if="timeValidation.errors.length > 0" type="error">
      <ul>
        <li v-for="error in timeValidation.errors" :key="error">{{ error }}</li>
      </ul>
    </v-alert>

    <!-- 时间配置表单 -->
    <v-text-field v-model="timeInput" @update:model-value="validateTimeRealtime" />

    <!-- 提交按钮 -->
    <v-btn :disabled="!canSubmit" @click="handleSubmit"> 提交 </v-btn>
  </v-form>
</template>

<script setup>
import { useTimeConfigValidation } from '../composables/useTimeConfigValidation';

const timeValidation = useTimeConfigValidation();

const validateTimeRealtime = () => {
  timeValidation.validateTimeConfig(localTemplate.value.timeConfig);
};

const canSubmit = computed(() => {
  return timeValidation.isValid.value;
});

const handleSubmit = async () => {
  // 1. 前端快速验证
  if (!timeValidation.isValid.value) return;

  // 2. 调用后端完整验证
  const backendValidation = TaskTemplateValidator.validate(template);
  if (!backendValidation.isValid) {
    // 处理验证失败
    return;
  }

  // 3. 提交数据
  await submitData();
};
</script>
```

## 3. 两套系统的协作

### 验证流程

```
用户输入 → 前端验证 → UI反馈
    ↓
表单提交 → 前端验证 → 后端验证 → 数据保存
```

### 集成示例

参考文件: `src/modules/Task/components/examples/TaskTemplateFormValidationExample.vue`

```typescript
// 完整的验证流程
const handleSubmit = async () => {
  try {
    // 1. Vue表单验证
    const vueFormValid = await formRef.value?.validate();
    if (!vueFormValid?.valid) throw new Error('表单验证失败');

    // 2. 前端composable验证
    const frontendValid = timeValidation.validateTimeConfig(template.timeConfig);
    if (!frontendValid) throw new Error('前端验证失败');

    // 3. 后端完整验证
    const backendValidation = TaskTemplateValidator.validateForCreate(template);
    if (!backendValidation.isValid) {
      throw new Error(`后端验证失败: ${backendValidation.errors.join(', ')}`);
    }

    // 4. 提交数据
    await submitTemplate(template);
  } catch (error) {
    // 处理错误
  }
};
```

## 4. 当前使用状况

### 已集成的地方

1. **taskTemplateService.ts**: 使用后端验证系统
   - `addTaskTemplate()`: 创建验证
   - `updateTaskTemplate()`: 更新验证

2. **TaskTemplateForm.vue**: 部分使用前端验证
   - Vue内置验证规则
   - 基础的表单验证

### 需要完善的地方

1. **composables验证**: 大部分文件为空，需要实现
2. **组件集成**: TaskTemplateForm需要集成两套验证系统
3. **错误处理**: 统一的错误显示和处理机制
4. **用户体验**: 实时验证反馈优化

## 5. 推荐使用模式

### 模式1: 简单表单

```typescript
// 只使用前端验证，适合简单场景
const validation = useTimeConfigValidation();
const isValid = computed(() => validation.isValid.value);
```

### 模式2: 完整验证

```typescript
// 前端+后端验证，适合重要数据
const frontendValidation = useTimeConfigValidation();

const handleSubmit = async () => {
  // 前端快速检查
  if (!frontendValidation.isValid.value) return;

  // 后端完整验证
  const result = TaskTemplateValidator.validateForCreate(template);
  if (!result.isValid) {
    showError(result.errors);
    return;
  }

  await saveData();
};
```

### 模式3: 实时验证

```typescript
// 结合watch实现实时验证
watch(
  () => template.timeConfig,
  () => {
    timeValidation.validateTimeConfig(template.timeConfig);
  },
  { deep: true },
);
```

## 6. 最佳实践

1. **分层验证**: 前端负责用户体验，后端确保数据完整性
2. **渐进增强**: 先有基础验证，再添加高级功能
3. **错误友好**: 提供清晰的错误信息和修复建议
4. **性能优化**: 前端验证要快速，避免阻塞UI
5. **类型安全**: 充分利用TypeScript的类型检查

## 7. 扩展和自定义

### 自定义验证器

```typescript
// 创建自定义验证器
const customValidator = ValidatorFactory.createCustomValidator({
  name: 'MyCustomValidator',
  validate: (template) => {
    // 自定义验证逻辑
    return ValidationUtils.success();
  },
});
```

### 自定义验证规则

```typescript
// 使用规则构建器
const customRule = ValidationRuleBuilder.create()
  .addRule('title', (value) => value.length > 5, '标题至少5个字符')
  .addRule('priority', (value) => value >= 1 && value <= 4, '优先级范围1-4')
  .build();
```

这套验证系统设计为可扩展、类型安全、用户友好的解决方案，能够满足从简单表单到复杂业务场景的各种验证需求。
