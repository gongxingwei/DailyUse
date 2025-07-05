# Task Composables 重构文档

## 概述

Task 模块的 composables 已经完全重构，遵循新的 DDD 架构原则。所有的业务逻辑现在通过 `taskDomainApplicationService` 进行，渲染进程不再包含任何领域服务。

## 新架构特点

### 1. 清晰的分层结构
- **Presentation Layer**: Composables 只负责 UI 状态管理和用户交互
- **Application Layer**: `taskDomainApplicationService` 负责业务协调和数据转换
- **Infrastructure Layer**: `taskIpcClient` 负责 IPC 通信
- **Domain Layer**: 领域实体和类型定义

### 2. 统一的数据流
```
UI Components → Composables → TaskDomainApplicationService → TaskIpcClient → Main Process
```

### 3. 类型安全
所有类型定义统一来源于 `domain/types/task.d.ts`，避免重复定义。

## Composables 列表

### 核心业务 Composables

#### 1. `useTaskManagement` - 任务管理总控
**位置**: `src/modules/Task/presentation/composables/useTaskManagement.ts`
**职责**: 
- 系统初始化和状态管理
- 整合所有子模块
- 数据加载和同步
- 统计信息计算

**主要功能**:
```typescript
const {
  // 状态
  isLoading,
  isInitialized,
  stats,
  
  // 子模块
  taskInstance,
  taskTemplate,
  metaTemplate,
  taskInstanceMgmt,
  
  // 全局操作
  initialize,
  refreshAllData,
  reset
} = useTaskManagement();
```

#### 2. `useTaskInstanceManagement` - 任务实例管理
**位置**: `src/modules/Task/presentation/composables/useTaskInstanceManagement.ts`
**职责**: 
- 任务实例的 CRUD 操作
- 批量操作
- 日期导航和过滤
- 状态变更管理

**主要功能**:
```typescript
const {
  // 计算属性
  dayTasks,
  completedTasks,
  incompleteTasks,
  
  // 单个操作
  completeTask,
  undoCompleteTask,
  deleteTask,
  startTask,
  cancelTask,
  
  // 批量操作
  batchCompleteTask,
  batchDeleteTask,
  
  // 工具方法
  refreshTasks,
  selectDay
} = useTaskInstanceManagement();
```

#### 3. `useTaskInstance` - 任务实例基础操作
**位置**: `src/modules/Task/presentation/composables/useTaskInstance.ts`
**职责**: 
- 基础的任务实例操作
- 单个任务的状态管理
- 简单的查询操作

#### 4. `useTaskTemplate` - 任务模板管理
**位置**: `src/modules/Task/presentation/composables/useTaskTemplate.ts`
**职责**: 
- 任务模板的 CRUD 操作
- 从元模板创建任务模板
- 模板查询和过滤

#### 5. `useMetaTemplate` - 元模板管理
**位置**: `src/modules/Task/presentation/composables/useMetaTemplate.ts`
**职责**: 
- 元模板的查询操作
- 元模板数据获取

#### 6. `useTaskReminderInit` - 提醒初始化
**位置**: `src/modules/Task/presentation/composables/useTaskReminderInit.ts`
**职责**: 
- 提醒系统初始化
- 通知处理
- 提醒状态监控

### 工具类 Composables

#### 7. `useTaskService` - 任务服务（已重构）
**位置**: `src/modules/Task/presentation/composables/useTaskService.ts`
**职责**: 
- 综合任务操作
- 模板创建流程
- 复杂业务编排

#### 8. `useNotification` - 通知管理
**位置**: `src/modules/Task/presentation/composables/useNotification.ts`
**职责**: 
- Snackbar 通知显示
- 消息类型管理

### 表单验证 Composables

#### 9. `useTaskTemplateForm` - 表单验证
**位置**: `src/modules/Task/presentation/composables/useTaskTemplateForm.ts`
**职责**: 
- 任务模板表单验证状态管理
- 跨字段验证

#### 10. `useBasicInfoValidation` - 基础信息验证
**位置**: `src/modules/Task/presentation/composables/useBasicInfoValidation.ts`
**职责**: 
- 标题和描述验证
- 基础字段规则检查

#### 11. `useTimeConfigValidation` - 时间配置验证
**位置**: `src/modules/Task/presentation/composables/useTimeConfigValidation.ts`
**职责**: 
- 时间配置验证
- 调度规则检查

#### 12. `useReminderValidation` - 提醒验证
**位置**: `src/modules/Task/presentation/composables/useReminderValidation.ts`
**职责**: 
- 提醒配置验证

#### 13. `useRecurrenceValidation` - 重复规则验证
**位置**: `src/modules/Task/presentation/composables/useRecurrenceValidation.ts`
**职责**: 
- 重复规则验证
- 循环配置检查

## 使用模式

### 1. 在组件中使用总控 Composable
```typescript
<script setup lang="ts">
import { useTaskManagement } from '@/modules/Task/presentation/composables/useTaskManagement';

const taskManagement = useTaskManagement();

// 访问子模块
const { completeTask } = taskManagement.taskInstanceMgmt;
const { createTaskTemplate } = taskManagement.taskTemplate;

// 访问统计信息
const stats = taskManagement.stats;
</script>
```

### 2. 在组件中使用专门的 Composable
```typescript
<script setup lang="ts">
import { useTaskInstanceManagement } from '@/modules/Task/presentation/composables/useTaskInstanceManagement';

const {
  dayTasks,
  completeTask,
  batchCompleteTask
} = useTaskInstanceManagement();
</script>
```

### 3. 表单验证使用模式
```typescript
<script setup lang="ts">
import { useTaskTemplateForm } from '@/modules/Task/presentation/composables/useTaskTemplateForm';
import { useBasicInfoValidation } from '@/modules/Task/presentation/composables/useBasicInfoValidation';

const form = useTaskTemplateForm();
const basicValidation = useBasicInfoValidation();

// 验证表单
const validateAndSubmit = async () => {
  if (await form.validateForm()) {
    // 提交表单
  }
};
</script>
```

## 架构优势

### 1. 单一职责
每个 composable 都有明确的职责边界，易于维护和测试。

### 2. 可组合性
通过组合不同的 composables，可以灵活构建各种功能。

### 3. 类型安全
统一的类型定义和 Mapper 确保类型安全。

### 4. 可测试性
纯函数式的 composable 设计便于单元测试。

### 5. 性能优化
通过计算属性和响应式设计，避免不必要的重复计算。

## 迁移指南

### 从旧架构迁移
1. 移除所有对本地领域服务的引用
2. 将 IPC 调用替换为 `taskDomainApplicationService` 调用
3. 使用新的 composables 替换旧的业务逻辑
4. 更新组件中的导入路径

### 示例迁移
```typescript
// 旧代码
import { TaskApplicationService } from '@/modules/Task/application/services/taskApplicationService';
const taskService = new TaskApplicationService();
await taskService.completeTask(taskId);

// 新代码
import { useTaskInstanceManagement } from '@/modules/Task/presentation/composables/useTaskInstanceManagement';
const { completeTask } = useTaskInstanceManagement();
await completeTask(taskInstance);
```

## 注意事项

1. **数据同步**: 所有数据操作都会自动同步到 store，组件无需手动刷新
2. **错误处理**: 每个操作都包含完整的错误处理和用户通知
3. **加载状态**: 所有异步操作都提供加载状态管理
4. **类型检查**: 使用 TypeScript 严格模式，确保类型安全

## 未来扩展

1. **缓存机制**: 可以在 composables 中添加智能缓存
2. **离线支持**: 通过 composables 层实现离线数据管理
3. **实时同步**: 添加 WebSocket 支持实现实时数据同步
4. **性能监控**: 在 composables 中添加性能监控和分析

这种架构为 Task 模块提供了清晰、可维护、可扩展的 composables 层，完全符合 DDD 架构原则和 Vue 3 Composition API 最佳实践。
