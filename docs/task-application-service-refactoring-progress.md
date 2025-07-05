# Task 应用服务重构进展

## 重构目标
将 `taskApplicationService.ts` 中的直接 IPC 调用改为使用封装好的 `taskIpcClient`，消除重复代码，统一 IPC 调用接口。

## 已完成的重构

### 1. 添加 taskIpcClient 导入
```typescript
import { taskIpcClient } from "../../infrastructure/ipc/taskIpcClient";
```

### 2. 已重构的方法

#### MetaTemplate 相关
- ✅ `syncDataFromMain()` - 使用 taskIpcClient 同步元模板数据
- ✅ `getAllMetaTemplates()` - 完全重构，支持所有数据获取策略
- ✅ `getMetaTemplate(id)` - 使用 taskIpcClient 获取单个元模板
- ✅ `getMetaTemplatesByCategory()` - 完全重构，支持所有数据获取策略
- ✅ `saveMetaTemplate()` - 使用 taskIpcClient，添加类型转换
- ✅ `deleteMetaTemplate()` - 使用 taskIpcClient，添加类型转换

#### TaskTemplate 相关
- ✅ `getTaskTemplate()` - 使用 taskIpcClient，添加领域对象转换
- ✅ `syncTaskTemplatesFromMain()` - 使用 taskIpcClient，批量转换为领域对象

#### TaskInstance 相关
- ✅ `syncTaskInstancesFromMain()` - 使用 taskIpcClient，批量转换为领域对象

### 3. 在 taskIpcClient 中添加的方法
- ✅ `saveMetaTemplate()` - 保存元模板
- ✅ `deleteMetaTemplate()` - 删除元模板

## 关键改进

### 1. 类型安全
- 从 `TaskResponse<T>` 转换为 `TResponse<T>`
- 统一错误处理格式
- 添加了适当的类型转换

### 2. 领域对象转换
- 使用 `TaskTemplate.fromCompleteData()` 转换 DTO
- 使用 `TaskInstance.fromCompleteData()` 转换 DTO
- 使用 `TaskMetaTemplate.fromCompleteData()` 转换 DTO

### 3. 数据策略支持
- 保持了原有的多种数据获取策略（离线优先、实时优先等）
- 统一了缓存更新逻辑

## 剩余需要重构的方法

### TaskTemplate 相关
- `getAllTaskTemplates()` - 需要转换为使用 taskIpcClient
- `getTaskTemplateForKeyResult()` - 需要使用 taskIpcClient
- `createTaskTemplate()` - 需要使用 taskIpcClient
- `saveTaskTemplate()` - 需要使用 taskIpcClient
- `deleteTaskTemplate()` - 需要使用 taskIpcClient
- `updateTaskTemplate()` - 需要使用 taskIpcClient

### TaskInstance 相关
- `getTaskInstance()` - 需要使用 taskIpcClient
- `getAllTaskInstances()` - 需要转换为使用 taskIpcClient
- `getTodayTasks()` - 需要使用 taskIpcClient
- `updateTaskInstance()` - 需要使用 taskIpcClient
- `deleteTaskInstance()` - 需要使用 taskIpcClient
- `completeTask()` - 需要使用 taskIpcClient
- `undoCompleteTask()` - 需要使用 taskIpcClient

### 其他操作
- 所有任务状态操作（开始、取消、重新安排等）
- 所有提醒相关操作
- 统计分析相关方法

## 下一步计划

1. **完善 taskIpcClient**：添加所有缺失的 IPC 方法
2. **批量重构**：逐个重构剩余的方法
3. **清理代码**：删除不再使用的 `fetchWithStrategy` 和 `persistWithSync` 方法
4. **测试验证**：确保所有功能正常工作
5. **文档更新**：更新使用文档和示例

## 重构模式

建立的重构模式：
1. 调用 `taskIpcClient.methodName()`
2. 检查 `response.success` 和 `response.data`
3. 使用相应的 `fromCompleteData()` 转换为领域对象
4. 更新 Store（如果启用响应式状态）
5. 返回适当格式的结果（TResponse 或领域对象）

这个模式确保了：
- 类型安全
- 统一的错误处理
- 正确的领域对象转换
- Store 状态同步
