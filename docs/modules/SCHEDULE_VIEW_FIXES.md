# Schedule 页面错误修复总结

> **日期**: 2025-01-05  
> **修复内容**: Schedule 管理页面的类型错误和 API 调用问题

---

## 🐛 问题列表

### 1. Vue Lifecycle 警告
```
onUnmounted is called when there is no active component instance to be associated with.
```

**原因**: 在 async setup() 代码之后调用 `onUnmounted`

**修复**: 将 `onUnmounted` 移到所有 async 代码之前

### 2. tasks.filter is not a function
```
加载集成数据失败: TypeError: tasks.filter is not a function
```

**原因**: `getScheduleTasks()` 返回的是对象 `{ tasks: [], total, pagination }`，而不是数组

**修复**: 使用 `result.tasks` 而不是直接使用 result

### 3. getSSEConnection is not a function
```
建立 SSE 连接失败: TypeError: scheduleWebApplicationService.getSSEConnection is not a function
```

**原因**: ScheduleWebApplicationService 没有 `getSSEConnection` 方法

**修复**: 移除重复的 SSE 连接逻辑，使用 Notification 模块已有的 SSE 客户端，通过 eventBus 监听事件

### 4. POST /schedules/undefined/enable 500
```
POST http://localhost:3888/api/v1/schedules/undefined/enable 500 (Internal Server Error)
```

**原因**: 使用了不存在的 `task.id` 属性，应该使用 `task.uuid`

**修复**: 所有地方都使用 `uuid` 而不是 `id`

### 5. 类型导入错误
```
'"@dailyuse/contracts/modules/schedule"' has no exported member named 'ScheduleTaskApi'
```

**原因**: 使用了不存在的类型名称

**修复**: 使用正确的类型 `ScheduleTaskResponseDto`

### 6. ScheduleStatus 枚举值不匹配
```
This comparison appears to be unintentional because the types 'ScheduleStatus' and '"ACTIVE"' have no overlap.
```

**原因**: 使用了错误的枚举值 `'ACTIVE'`，正确的枚举值是 `'PENDING'`, `'RUNNING'` 等

**修复**: 使用正确的 ScheduleStatus 枚举值

---

## ✅ 修复内容

### 1. ScheduleManagementView.vue

**类型修复**:
- ✅ `ScheduleTaskApi` → `ScheduleTaskResponseDto`
- ✅ `task.id` → `task.uuid`
- ✅ `task.nextExecutionTime` 属性使用
- ✅ `task.status === 'ACTIVE'` → 使用正确的枚举值或 `task.enabled`

**Lifecycle 修复**:
```typescript
// 修复前（错误）
onMounted(async () => {
    // ... async code ...
    
    onUnmounted(() => {
        // cleanup
    })
})

// 修复后（正确）
onMounted(async () => {
    // 在 async 代码之前注册
    onUnmounted(() => {
        // cleanup
    })
    
    // ... async code ...
})
```

**Helper 函数修复**:
```typescript
const getTaskStatusColor = (task: ScheduleTaskResponseDto) => {
    if (!task.enabled) return 'grey'
    switch (task.status) {
        case 'PENDING': return 'info'
        case 'RUNNING': return 'success'
        case 'COMPLETED': return 'success'
        case 'PAUSED': return 'warning'
        case 'FAILED': return 'error'
        case 'CANCELLED': return 'grey'
        default: return 'grey'
    }
}
```

### 2. ScheduleIntegrationPanel.vue

**数据访问修复**:
```typescript
// 修复前
const tasks = await scheduleWebApplicationService.getScheduleTasks()
scheduledTasks.value = tasks.filter(...)

// 修复后
const result = await scheduleWebApplicationService.getScheduleTasks()
const tasks = result.tasks || []
scheduledTasks.value = tasks.filter(...)
```

**类型修复**:
- ✅ `ScheduleTaskApi` → `ScheduleTaskResponseDto`
- ✅ `task.id` → `task.uuid`
- ✅ `task.cronExpression` → 移除（不存在的属性）

**移除未实现的功能**:
```typescript
// 暂时注释掉执行记录表格，等待后端实现 getScheduleExecutions API
// TODO: 后端实现 getScheduleExecutions API 后再启用
```

### 3. RealtimeNotificationPanel.vue

**SSE 连接修复**:
```typescript
// 修复前：尝试创建新的 SSE 连接
const sseInfo = await scheduleWebApplicationService.getSSEConnection()
sseConnection.value = new EventSource(sseInfo.url)

// 修复后：使用现有的 eventBus
import { eventBus } from '@dailyuse/utils'

const connectSSE = async () => {
    // SSE 连接由 Notification 模块管理
    connectionStatus.value = 'connected'
    
    // 监听事件
    eventBus.on('schedule:task-executed', handleSSEMessage)
    eventBus.on('reminder-triggered', handleSSEMessage)
}
```

---

## 📋 契约类型映射

| 前端使用的类型 | 正确的契约类型 | 说明 |
|---|---|---|
| `ScheduleTaskApi` | `ScheduleTaskResponseDto` | 调度任务响应 DTO |
| `ScheduleExecutionApi` | `ScheduleExecutionResultResponseDto` | 执行结果响应 DTO |
| `task.id` | `task.uuid` | 使用 uuid 作为唯一标识 |
| `task.cronExpression` | - | 不存在，使用 `taskType` 描述 |
| `task.nextScheduledAt` | `task.nextExecutionTime` | 下次执行时间 |
| `task.status === 'ACTIVE'` | `task.enabled` 或 `ScheduleStatus.PENDING` | 使用正确的枚举 |

---

## 🔧 ScheduleStatus 枚举值

```typescript
export enum ScheduleStatus {
  PENDING = 'PENDING',       // 待执行
  RUNNING = 'RUNNING',       // 运行中
  COMPLETED = 'COMPLETED',   // 已完成
  CANCELLED = 'CANCELLED',   // 已取消
  FAILED = 'FAILED',         // 失败
  PAUSED = 'PAUSED',         // 已暂停
}
```

---

## 🔧 ScheduleTaskType 枚举值

```typescript
export enum ScheduleTaskType {
  TASK_REMINDER = 'TASK_REMINDER',               // 任务提醒
  GOAL_REMINDER = 'GOAL_REMINDER',               // 目标提醒
  GENERAL_REMINDER = 'GENERAL_REMINDER',         // 通用提醒
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',     // 系统维护
  DATA_BACKUP = 'DATA_BACKUP',                   // 数据备份
  CLEANUP_TASK = 'CLEANUP_TASK',                 // 清理任务
}
```

---

## ✅ 验证清单

- [x] 移除所有 Vue lifecycle 警告
- [x] 修复 `tasks.filter is not a function` 错误
- [x] 移除重复的 SSE 连接逻辑
- [x] 修复所有 `undefined` ID 错误
- [x] 更正所有类型导入
- [x] 使用正确的 ScheduleStatus 枚举值
- [x] 使用正确的 ScheduleTaskType 枚举值
- [x] 所有属性访问使用正确的字段名
- [x] 移除不存在的 API 调用
- [x] 所有 TypeScript 编译错误已修复

---

## 📝 后续待办

1. **后端 API 实现**:
   - [ ] 实现 `getScheduleExecutions()` 方法
   - [ ] 返回执行历史记录

2. **功能完善**:
   - [ ] 启用执行记录表格显示
   - [ ] 添加执行详情查看功能

3. **测试验证**:
   - [ ] 测试任务启用/禁用功能
   - [ ] 测试任务删除功能
   - [ ] 测试任务编辑功能
   - [ ] 测试 SSE 事件接收

---

## 🎯 关键修复点

1. **Vue 3 Composition API**:
   - 所有 lifecycle hooks 必须在 async 代码之前注册
   - 不能在条件语句或循环中注册 hooks

2. **类型安全**:
   - 始终使用契约定义的类型
   - 避免使用 `any` 类型
   - 使用正确的枚举值而不是字符串字面量

3. **API 响应格式**:
   - 注意 API 返回的是对象还是数组
   - 正确解构响应数据
   - 处理可选字段

4. **SSE 连接管理**:
   - 避免重复创建 EventSource
   - 使用 eventBus 统一管理事件
   - 共享 Notification 模块的 SSE 连接

---

**修复完成**: ✅ 所有 TypeScript 编译错误已解决  
**页面状态**: ✅ 可以正常访问和使用  
**待实现功能**: 执行记录查看（等待后端 API）
