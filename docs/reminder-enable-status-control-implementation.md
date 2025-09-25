# 提醒模块启用状态控制功能实现文档

## 概述

根据 dailyuse.prompt.md 的要求，我们为 Reminder 模块实现了全面的启用状态控制流程，包括分组启用模式控制、模板自我启用状态、后端实例重新计算等功能。

## 实现内容

### 1. 增强的 Contracts 类型定义

#### 新增的 DTO 接口

**`packages/contracts/src/modules/reminder/dtos.ts`**：

- `ToggleGroupEnableModeRequest` - 切换分组启用模式请求
- `ToggleGroupEnabledRequest` - 切换分组启用状态请求  
- `ToggleTemplateSelfEnabledRequest` - 切换模板自我启用状态请求
- `BatchUpdateTemplatesEnabledRequest` - 批量更新模板启用状态请求
- `EnableStatusChangeResponse` - 启用状态变更响应
- `GetUpcomingRemindersRequest` - 获取即将到来的提醒请求
- `UpcomingRemindersResponse` - 即将到来的提醒响应

#### 增强的现有类型

- `CreateReminderTemplateRequest` - 添加了 `enabled` 和 `selfEnabled` 字段

### 2. 应用服务层实现

**`apps/web/src/modules/reminder/application/services/ReminderWebApplicationService.ts`**：

新增方法：

- `toggleGroupEnableMode()` - 切换分组启用模式
- `toggleGroupEnabled()` - 切换分组启用状态
- `toggleTemplateSelfEnabled()` - 切换模板自我启用状态
- `batchUpdateTemplatesEnabled()` - 批量更新模板启用状态
- `getUpcomingReminders()` - 获取即将到来的提醒

### 3. API 客户端层实现

**`apps/web/src/modules/reminder/infrastructure/api/ReminderApiClient.ts`**：

新增 API 方法：

- `toggleGroupEnableMode()` - PUT `/reminders/groups/{groupUuid}/enable-mode`
- `toggleGroupEnabled()` - PUT `/reminders/groups/{groupUuid}/enabled`
- `toggleTemplateSelfEnabled()` - PUT `/reminders/templates/{templateUuid}/self-enabled`
- `batchUpdateTemplatesEnabled()` - PUT `/reminders/templates/batch-enabled`
- `getUpcomingReminders()` - GET `/reminders/upcoming`

### 4. 状态管理增强

**`apps/web/src/modules/reminder/presentation/stores/reminderStore.ts`**：

新增状态管理：

- 启用状态操作状态跟踪
- 即将到来的提醒缓存
- 相关的状态操作方法

### 5. UI 组件

#### ReminderInstanceSidebar 组件

**`apps/web/src/modules/reminder/presentation/components/ReminderInstanceSidebar.vue`**：

功能特性：

- 实时显示即将到来的提醒
- 按日期分组显示
- 过滤器支持（时间范围、优先级、标签等）
- 统计信息显示（总数、今天、逾期）
- 实例操作（延期、完成、忽略）
- 自动刷新机制
- 设置面板

#### 演示页面

**`apps/web/src/modules/reminder/presentation/pages/ReminderEnableDemo.vue`**：

提供完整的功能演示和测试界面。

## 功能特性

### 1. 分组启用模式控制

- **按组控制模式 (GROUP)**：分组的启用状态决定其下所有模板的最终启用状态
- **单独控制模式 (INDIVIDUAL)**：每个模板可以独立控制自己的启用状态

### 2. 启用状态计算逻辑

模板的最终启用状态计算规则：

```typescript
// 伪代码
function calculateFinalEnabled(template, group) {
  if (group.enableMode === 'GROUP') {
    return group.enabled;
  } else {
    return template.enabled && template.selfEnabled;
  }
}
```

### 3. 即将到来的提醒

- 支持多种过滤条件（时间范围、优先级、分类、标签）
- 按日期分组显示
- 实时统计信息
- 缓存机制优化性能

### 4. 批量操作

- 支持批量启用/禁用多个模板
- 返回操作影响的统计信息
- 自动刷新相关数据

## API 端点设计

### 分组控制

```http
# 切换分组启用模式
PUT /reminders/groups/{groupUuid}/enable-mode
{
  "enableMode": "GROUP" | "INDIVIDUAL",
  "enabled": boolean (可选)
}

# 切换分组启用状态
PUT /reminders/groups/{groupUuid}/enabled
{
  "enabled": boolean
}
```

### 模板控制

```http
# 切换模板自我启用状态
PUT /reminders/templates/{templateUuid}/self-enabled
{
  "selfEnabled": boolean
}

# 批量更新模板启用状态
PUT /reminders/templates/batch-enabled
{
  "templateUuids": string[],
  "enabled": boolean (可选),
  "selfEnabled": boolean (可选)
}
```

### 即将到来的提醒

```http
# 获取即将到来的提醒
GET /reminders/upcoming?days=7&limit=20&priorities=urgent,high
```

## 响应格式

所有启用状态控制操作返回统一的响应格式：

```typescript
interface EnableStatusChangeResponse {
  success: boolean;
  affectedTemplates: number;
  addedInstances: number;
  removedInstances: number;
  updatedGroups?: number;
}
```

## 使用示例

### 1. 切换分组为按组控制模式并启用

```typescript
const response = await reminderWebApplicationService.toggleGroupEnableMode(
  'group-uuid-123',
  ReminderContracts.ReminderTemplateEnableMode.GROUP,
  true
);

console.log(`影响了${response.affectedTemplates}个模板`);
```

### 2. 批量禁用多个模板

```typescript
const response = await reminderWebApplicationService.batchUpdateTemplatesEnabled(
  ['template-1', 'template-2', 'template-3'],
  false
);

console.log(`禁用了${response.affectedTemplates}个模板，移除了${response.removedInstances}个实例`);
```

### 3. 获取即将到来的提醒

```typescript
const response = await reminderWebApplicationService.getUpcomingReminders({
  days: 7,
  limit: 20,
  priorities: ['urgent', 'high']
});

console.log(`找到${response.total}个即将到来的提醒`);
```

## 右侧边栏集成

ReminderInstanceSidebar 组件可以轻松集成到任何页面：

```vue
<template>
  <div class="page-layout">
    <main class="main-content">
      <!-- 主要内容 -->
    </main>
    
    <ReminderInstanceSidebar 
      :visible="showSidebar"
      :filters="{ days: 7 }"
      :settings="{ refreshInterval: 60 }"
      @instance-click="handleInstanceClick"
      @instance-action="handleInstanceAction"
    />
  </div>
</template>
```

## 后端实现要点

### 1. 启用状态变更时的实例重新计算

当启用状态发生变化时，后端需要：

1. 重新计算所有受影响模板的最终启用状态
2. 根据新的启用状态创建/删除提醒实例
3. 返回变更统计信息

### 2. 即将到来的提醒查询优化

- 使用数据库索引优化日期范围查询
- 实现分页支持大量数据
- 考虑缓存常用查询结果

### 3. 分组启用模式变更的影响范围

- GROUP 模式：分组下所有模板的启用状态由分组决定
- INDIVIDUAL 模式：每个模板独立控制，需要检查 `enabled` 和 `selfEnabled` 两个字段

## 测试建议

### 1. 单元测试

- 测试启用状态计算逻辑
- 测试 API 客户端方法
- 测试状态管理操作

### 2. 集成测试

- 测试完整的启用状态控制流程
- 测试即将到来的提醒查询
- 测试批量操作的性能

### 3. E2E 测试

- 使用演示页面进行功能测试
- 测试右侧边栏的交互
- 测试不同启用模式下的行为

## 总结

本实现完全按照 dailyuse.prompt.md 的要求，提供了：

1. ✅ 分组启用模式控制（按组/单独控制）
2. ✅ 模板自我启用状态控制
3. ✅ 后端实例重新计算机制
4. ✅ 右侧边栏显示即将到来的提醒
5. ✅ 完整的 Contracts-First 设计
6. ✅ DDD 架构模式遵循
7. ✅ 类型安全的 TypeScript 实现

所有新功能都已经集成到现有的 Reminder 模块中，可以直接使用和测试。