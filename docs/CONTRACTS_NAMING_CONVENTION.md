# Contracts 命名规范

## 📋 概述

本文档定义了 DailyUse 项目中所有模块的 Contract 类型命名规范，确保前后端接口一致性。

## 🎯 核心原则

### 1. 统一的命名模式

所有 Response 和 Request 类型遵循以下命名规范：

```
{Resource}{Operation}{Type}
```

**示例：**
- `ReminderTemplateResponse` - 单个资源响应
- `ReminderTemplateListResponse` - 列表响应
- `CreateReminderTemplateRequest` - 创建请求
- `UpdateReminderTemplateRequest` - 更新请求

### 2. DTO vs ClientDTO

- **DTO**: 服务端数据传输对象（纯数据，时间为 `number` 时间戳）
- **ClientDTO**: 客户端渲染对象（包含计算属性，适合前端使用）

```typescript
// DTO - 服务端使用
export interface ReminderTemplateDTO {
  uuid: string;
  name: string;
  createdAt: number;  // 时间戳
  // ...
}

// ClientDTO - 客户端使用
export interface ReminderTemplateClientDTO extends ReminderTemplateDTO {
  // 计算属性
  effectiveEnabled: boolean;
  nextTriggerTime?: number;
  formattedDate: string;
}
```

### 3. Response 结构

所有 Response 类型必须包含 `data` 字段：

```typescript
// ✅ 正确
export interface ReminderTemplateResponse {
  data: ReminderTemplateClientDTO;
}

export interface ReminderTemplateListResponse {
  data: {
    reminders: ReminderTemplateClientDTO[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// ❌ 错误 - 缺少 data 包装
export type ReminderTemplateResponse = ReminderTemplateClientDTO;
```

## 📚 标准类型定义

### Request 类型

#### 创建请求 (Create)

```typescript
export interface Create{Resource}Request {
  // 必需字段
  uuid: string;  // 前端生成
  name: string;
  
  // 可选字段
  description?: string;
  // ...
}
```

#### 更新请求 (Update)

```typescript
export interface Update{Resource}Request {
  // 所有字段可选
  name?: string;
  description?: string;
  // ...
}

// 或使用 Partial
export type Update{Resource}Request = Partial<
  Omit<{Resource}DTO, 'uuid' | 'accountUuid' | 'createdAt' | 'updatedAt'>
>;
```

#### 查询参数 (Query)

```typescript
export interface {Resource}QueryParams {
  // 过滤条件
  status?: Status | Status[];
  priority?: Priority | Priority[];
  
  // 分页
  page?: number;
  limit?: number;
  
  // 排序
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
  
  // 搜索
  searchQuery?: string;
}
```

### Response 类型

#### 单个资源响应

```typescript
export interface {Resource}Response {
  data: {Resource}ClientDTO;
}
```

#### 列表响应

```typescript
export interface {Resource}ListResponse {
  data: {
    {resources}: {Resource}ClientDTO[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}
```

#### 统计响应

```typescript
export interface {Resource}StatsResponse {
  data: {
    total: number;
    // 各种统计数据
    byStatus: Record<Status, number>;
    // ...
  };
}
```

## 🗂️ 各模块命名规范

### Reminder 模块

#### 资源类型
- `ReminderTemplate` - 提醒模板
- `ReminderTemplateGroup` - 提醒分组
- `ReminderInstance` - 提醒实例

#### Request 类型
```typescript
// 模板
CreateReminderTemplateRequest
UpdateReminderTemplateRequest
ToggleTemplateSelfEnabledRequest

// 分组
CreateReminderTemplateGroupRequest
UpdateReminderTemplateGroupRequest
ToggleGroupEnableModeRequest
ToggleGroupEnabledRequest

// 实例
CreateReminderInstanceRequest
UpdateReminderInstanceRequest
SnoozeReminderRequest

// 批量操作
BatchReminderOperationRequest
BatchUpdateTemplatesEnabledRequest

// 查询
ReminderQueryParamsDTO
GetUpcomingRemindersRequest
```

#### Response 类型
```typescript
// 单个资源
ReminderTemplateResponse
ReminderTemplateGroupResponse
ReminderInstanceResponse

// 列表
ReminderTemplateListResponse
ReminderTemplateGroupListResponse
ReminderInstanceListResponse

// 特殊响应
UpcomingRemindersResponse
ReminderStatsResponse
EnableStatusChangeResponse
```

### Task 模块

#### 资源类型
- `TaskTemplate` - 任务模板
- `TaskMetaTemplate` - 任务元模板
- `TaskInstance` - 任务实例

#### Request 类型
```typescript
// 模板
CreateTaskTemplateRequest
UpdateTaskTemplateRequest

// 元模板
CreateTaskMetaTemplateRequest
UpdateTaskMetaTemplateRequest

// 实例
CreateTaskInstanceRequest
UpdateTaskInstanceRequest
CompleteTaskRequest
RescheduleTaskRequest
UpdateTaskInstanceStatusRequest
```

#### Response 类型
```typescript
// 单个资源
TaskTemplateResponse
TaskMetaTemplateResponse
TaskInstanceResponse

// 列表
TaskTemplateListResponse
TaskMetaTemplateListResponse
TaskInstanceListResponse
```

### Schedule 模块

#### 资源类型
- `ScheduleTask` - 调度任务

#### Request 类型
```typescript
CreateScheduleTaskRequestDto
UpdateScheduleTaskRequestDto
ExecuteScheduleTaskRequestDto
QuickReminderRequestDto
SnoozeReminderRequestDto
BatchScheduleTaskOperationRequestDto
```

#### Response 类型
```typescript
ScheduleTaskResponseDto
ScheduleTaskListResponseDto
ScheduleExecutionResultResponseDto
ScheduleTaskStatisticsResponseDto
BatchScheduleTaskOperationResponseDto
ScheduleTaskLogResponseDto
UpcomingTasksResponseDto
```

### Goal 模块

#### 资源类型
- `Goal` - 目标
- `Milestone` - 里程碑

#### Request/Response 遵循相同模式

## ✅ 检查清单

在创建新的 Contract 类型时，请确保：

- [ ] 命名遵循 `{Resource}{Operation}{Type}` 模式
- [ ] Response 类型包含 `data` 字段包装
- [ ] 区分 DTO 和 ClientDTO
- [ ] 时间字段使用 `number` 类型（时间戳）
- [ ] 使用 TypeScript 类型工具（Pick, Omit, Partial）避免重复
- [ ] 为所有字段添加 JSDoc 注释
- [ ] 导出类型到模块的 `index.ts`

## 🔧 迁移指南

### 修复不一致的类型

#### 问题 1: 缺少 Response 类型

```typescript
// ❌ 错误 - 直接使用 DTO
async getTemplate(): Promise<ReminderTemplateDTO> {}

// ✅ 正确 - 使用 Response 类型
async getTemplate(): Promise<ReminderTemplateResponse> {}
```

**修复步骤：**
1. 在 `dtos.ts` 中添加 Response 类型定义
2. 更新所有使用该类型的代码

#### 问题 2: Response 结构不一致

```typescript
// ❌ 错误 - 没有 data 包装
export type ReminderTemplateResponse = ReminderTemplateClientDTO;

// ✅ 正确 - 有 data 包装
export interface ReminderTemplateResponse {
  data: ReminderTemplateClientDTO;
}
```

**修复步骤：**
1. 修改类型定义
2. 更新 API Client 解包逻辑
3. 更新 Service 层使用

#### 问题 3: 缺少必要字段

```typescript
// ❌ 错误 - EnableStatusChangeResponse 缺少字段
export interface EnableStatusChangeResponse {
  success: boolean;
  message: string;
}

// ✅ 正确 - 包含完整字段
export interface EnableStatusChangeResponse {
  data: {
    success: boolean;
    message: string;
    affectedTemplates: number;      // ✅ 添加
    addedInstances: number;          // ✅ 添加
    removedInstances: number;        // ✅ 添加
    updatedInstances: number;        // ✅ 添加
    details: { ... };                // ✅ 添加
  };
}
```

## 📝 代码生成模板

### 新资源类型模板

```typescript
// ==================== {ResourceName} ====================

/**
 * {ResourceName} DTO - 服务端数据传输对象
 */
export interface {ResourceName}DTO {
  uuid: string;
  accountUuid: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  // ... 其他字段
}

/**
 * {ResourceName} 客户端 DTO - 前端渲染对象
 */
export interface {ResourceName}ClientDTO extends {ResourceName}DTO {
  // 计算属性
}

/**
 * 创建 {ResourceName} 请求
 */
export interface Create{ResourceName}Request {
  uuid: string;
  name: string;
  // ... 必需字段
}

/**
 * 更新 {ResourceName} 请求
 */
export type Update{ResourceName}Request = Partial<
  Omit<{ResourceName}DTO, 'uuid' | 'accountUuid' | 'createdAt' | 'updatedAt'>
>;

/**
 * 单个 {ResourceName} 响应
 */
export interface {ResourceName}Response {
  data: {ResourceName}ClientDTO;
}

/**
 * {ResourceName} 列表响应
 */
export interface {ResourceName}ListResponse {
  data: {
    {resourceName}s: {ResourceName}ClientDTO[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}
```

## 🎓 最佳实践

### 1. 使用 TypeScript 工具类型

```typescript
// ✅ 推荐 - 使用 Pick/Omit/Partial
export type CreateRequest = Pick<DTO, 'uuid' | 'name' | 'description'>;
export type UpdateRequest = Partial<Omit<DTO, 'uuid' | 'createdAt'>>;

// ❌ 不推荐 - 手动重复定义
export interface CreateRequest {
  uuid: string;
  name: string;
  description: string;
}
```

### 2. 添加详细的 JSDoc 注释

```typescript
/**
 * 提醒模板响应
 * @description GET/POST/PUT /api/v1/reminders/templates/*
 * @example
 * ```typescript
 * const response: ReminderTemplateResponse = {
 *   data: {
 *     uuid: '123',
 *     name: 'Daily Standup',
 *     // ...
 *   }
 * };
 * ```
 */
export interface ReminderTemplateResponse {
  data: ReminderTemplateClientDTO;
}
```

### 3. 保持一致的字段命名

```typescript
// ✅ 一致 - 都用复数
reminders: ReminderTemplateClientDTO[];
templates: TaskTemplateDTO[];

// ❌ 不一致
reminder: ReminderTemplateClientDTO[];  // 单数
templates: TaskTemplateDTO[];           // 复数
```

## 🔍 自动化检查

可以使用 ESLint 规则检查命名一致性：

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        filter: {
          regex: 'Response$',
          match: true,
        },
        format: ['PascalCase'],
      },
    ],
  },
};
```

## 📅 更新日志

- **2025-10-04**: 初始版本，统一 Reminder/Task/Schedule/Goal 模块规范
- **2025-10-04**: 添加 Response 类型必须包含 `data` 字段的规则
- **2025-10-04**: 完善 EnableStatusChangeResponse 字段定义

---

**维护者**: DailyUse Team  
**最后更新**: 2025-10-04  
**版本**: 1.0.0
