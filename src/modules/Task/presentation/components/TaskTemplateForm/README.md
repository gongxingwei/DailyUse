# TaskTemplateForm DDD 架构重构

## 概述

这是对 TaskTemplateForm 组件的 DDD（领域驱动设计）架构重构，将复杂的表单逻辑按照 DDD 原则进行分层和模块化。

## 架构分层

### 1. 表现层 (Presentation Layer)
- **TaskTemplateFormDDD.vue** - 主表单组件
- **TaskTemplateDialogDDD.vue** - 对话框组件，展示如何使用
- **widgets/** - 可复用的UI组件
- **sections/** - 表单区块组件

### 2. 应用层 (Application Layer)
- **TaskTemplateFormApplicationService.ts** - 协调表单操作和业务逻辑

### 3. 领域层 (Domain Layer)
- **TaskTemplateFormDomain.ts** - 表单相关的业务规则和验证逻辑

### 4. 基础设施层 (Infrastructure Layer)
- **composables/** - Vue组合式函数
- **services/** - 外部服务调用
- **utils/** - 工具函数

## 文件结构

```
src/modules/Task/
├── components/
│   ├── TaskTemplateFormDDD.vue           # 主表单组件
│   ├── TaskTemplateDialogDDD.vue         # 使用示例
│   └── TaskTemplateForm/
│       ├── widgets/                      # UI组件
│       │   ├── BasicInfoSection.vue     # 基础信息
│       │   ├── TimeConfigSection.vue    # 时间配置
│       │   ├── RecurrenceSection.vue    # 重复规则
│       │   ├── ReminderAlertsList.vue   # 提醒列表
│       │   ├── ReminderSnoozeSettings.vue # 稍后提醒
│       │   ├── SchedulingPolicySection.vue # 调度策略
│       │   ├── OtherSettingsSection.vue # 其他设置
│       │   └── WeekdaySelector.vue      # 星期选择器
│       └── sections/
│           └── ReminderSection.vue      # 提醒设置区块
├── application/
│   └── TaskTemplateFormApplicationService.ts # 应用服务
├── domain/
│   └── TaskTemplateFormDomain.ts        # 领域服务
└── composables/
    ├── useTaskTemplateForm.ts           # 表单管理
    ├── useTaskTemplateFormValidation.ts # 表单验证
    ├── useTimeConfigValidation.ts      # 时间配置验证
    ├── useRecurrenceValidation.ts      # 重复规则验证
    └── useReminderValidation.ts        # 提醒验证
```

## 核心特性

### 1. 关注点分离
- **UI组件**：只负责展示和用户交互
- **业务逻辑**：集中在Domain和Application层
- **验证逻辑**：按领域分离，可复用

### 2. 组件化
- 每个表单区块都是独立的组件
- 支持独立的验证和状态管理
- 易于测试和维护

### 3. 验证系统
- 多层次验证：前端验证 + 业务规则验证
- 实时验证反馈
- 错误和警告分离显示

### 4. 类型安全
- 完整的 TypeScript 类型定义
- 强类型的接口约束

## 使用方法

### 基本使用

```vue
<template>
  <TaskTemplateFormDDD
    v-model="template"
    :is-edit-mode="false"
  />
</template>

<script setup>
import TaskTemplateFormDDD from '@/modules/Task/presentation/components/TaskTemplateFormDDD.vue';
import { taskTemplateFormApplicationService } from '@/modules/Task/application/TaskTemplateFormApplicationService';

const template = ref(
  taskTemplateFormApplicationService.createDefaultTemplate()
);
</script>
```

### 带验证的完整使用

```vue
<template>
  <TaskTemplateDialogDDD
    :visible="showDialog"
    :template="currentTemplate"
    :is-edit-mode="isEdit"
    @save="handleSave"
    @cancel="showDialog = false"
  />
</template>

<script setup>
import TaskTemplateDialogDDD from '@/modules/Task/presentation/components/TaskTemplateDialogDDD.vue';

const handleSave = async (template) => {
  // 保存逻辑已在组件内处理
  console.log('模板已保存:', template);
};
</script>
```

## 验证系统

### 验证层级
1. **字段级验证** - 输入框的即时验证
2. **区块级验证** - 每个section的业务规则验证
3. **表单级验证** - 跨字段和整体业务规则验证

### 使用验证

```typescript
import { useTaskTemplateFormValidation } from '@/modules/Task/composables/useTaskTemplateFormValidation';

const formValidation = useTaskTemplateFormValidation(templateRef);

// 检查验证状态
if (formValidation.isFormReady.value) {
  // 表单可以提交
}

// 获取错误信息
const errors = formValidation.getSectionErrors('basic');
```

## 扩展指南

### 添加新的表单区块

1. 在 `widgets/` 目录创建新组件
2. 实现 `v-model` 和验证事件
3. 在主表单中引入和使用

### 添加新的验证规则

1. 在对应的验证composable中添加规则
2. 在 `TaskTemplateFormDomain.ts` 中调用
3. 更新类型定义

### 自定义业务逻辑

1. 在 `TaskTemplateFormApplicationService.ts` 中添加方法
2. 在组件中调用应用服务
3. 保持UI组件的纯净性

## 优势

1. **可维护性** - 清晰的分层结构，易于定位和修改
2. **可测试性** - 业务逻辑与UI分离，便于单元测试
3. **可复用性** - 组件化设计，可在不同场景复用
4. **可扩展性** - 遵循开闭原则，易于添加新功能
5. **类型安全** - 完整的TypeScript支持

## 迁移指南

从原有的 TaskTemplateForm.vue 迁移到 DDD 架构：

1. 替换组件引用：`TaskTemplateForm.vue` → `TaskTemplateFormDDD.vue`
2. 使用应用服务处理保存逻辑
3. 利用新的验证系统获得更好的用户体验

## 注意事项

1. 确保正确处理组件的生命周期
2. 注意验证状态的同步
3. 合理使用应用服务，避免在UI组件中处理复杂业务逻辑
