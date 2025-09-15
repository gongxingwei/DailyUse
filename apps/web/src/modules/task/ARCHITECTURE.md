# Task 模块分层架构说明

## 概述

Task模块已成功实现了 **Composable + ApplicationService + Store** 分层架构，结合领域驱动设计(DDD)的聚合根控制模式。

## 架构层次

### 1. Composable层 (`useTaskAggregate.ts`)
- **职责**: 提供响应式接口，管理UI状态
- **特点**: 
  - 暴露响应式数据和操作方法给Vue组件
  - 管理操作状态（loading、error等）
  - 缓存聚合根实例在内存中
  - 协调ApplicationService和Store之间的数据流

### 2. ApplicationService层 (`TaskApplicationService` from domain-client)
- **职责**: 协调聚合根操作和业务流程
- **特点**:
  - 管理TaskTemplate聚合根的生命周期
  - 实现复杂的业务逻辑和规则验证
  - 处理跨聚合根的操作
  - 发布和处理领域事件

### 3. Store层 (`taskStore.ts`)
- **职责**: 纯数据存储和缓存管理
- **特点**:
  - 不包含业务逻辑
  - 提供数据查询和筛选方法
  - 管理缓存过期和同步策略
  - 支持批量数据操作

## 聚合根控制模式

### TaskTemplate聚合根
- 作为聚合根管理TaskInstance实体的完整生命周期
- 确保业务规则和数据一致性
- 提供变更跟踪和领域事件发布

### 主要操作方法

```typescript
// 加载聚合根
const aggregate = await loadTaskTemplateAggregate(templateUuid);

// 通过聚合根创建实例
const instanceUuid = await createTaskInstanceViaAggregate(templateUuid, accountUuid, request);

// 通过聚合根完成实例
await completeTaskInstanceViaAggregate(templateUuid, instanceUuid, completionData);
```

## 使用示例

```vue
<script setup>
import { useTaskAggregate } from '@/modules/task/presentation/composables/useTaskAggregate';

const {
  // 聚合根操作
  loadTaskTemplateAggregate,
  createTaskTemplateAggregate,
  createTaskInstanceViaAggregate,
  completeTaskInstanceViaAggregate,
  
  // 数据访问
  taskTemplateAggregates,
  taskTemplates,
  activeTaskTemplates,
  taskInstances,
  
  // 状态管理
  isLoading,
  error,
  currentOperation
} = useTaskAggregate();

// 创建任务模板聚合根
const handleCreateTemplate = async () => {
  try {
    const template = await createTaskTemplateAggregate(requestData, accountUuid);
    console.log('创建成功:', template);
  } catch (error) {
    console.error('创建失败:', error);
  }
};

// 通过聚合根创建实例
const handleCreateInstance = async () => {
  try {
    const instanceUuid = await createTaskInstanceViaAggregate(templateUuid, accountUuid, instanceData);
    console.log('实例创建成功:', instanceUuid);
  } catch (error) {
    console.error('实例创建失败:', error);
  }
};
</script>
```

## 向后兼容性

新的`useTaskAggregate`composable与现有的`useTask`composable并行存在，确保:
- 现有功能不受影响
- 渐进式迁移到新架构
- 新功能优先使用聚合根模式

## 架构优势

1. **清晰的职责分离**: 每层只负责自己的核心职责
2. **可测试性**: 各层可以独立测试
3. **聚合根控制**: 确保业务规则和数据一致性
4. **缓存策略**: 内存缓存聚合根，提高性能
5. **类型安全**: 完整的TypeScript类型支持
6. **响应式**: Vue3响应式系统集成

## 未来扩展

- 添加更多聚合根操作方法
- 实现完整的变更跟踪系统
- 集成领域事件处理
- 添加离线支持功能
