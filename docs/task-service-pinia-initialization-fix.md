# 任务应用服务 Pinia 初始化问题修复指南

## 问题描述

在模块顶层直接创建应用服务实例时，会遇到 Pinia 未初始化的错误：

```
[🍍]: "getActivePinia()" was called but there was no active Pinia. 
Are you trying to use a store before calling "app.use(pinia)"?
```

## 问题原因

1. **模块加载时机**：ES6 模块在应用启动时就会加载和执行
2. **Pinia 初始化延迟**：Pinia 在 Vue 应用创建并调用 `app.use(pinia)` 后才可用
3. **实例创建时机冲突**：应用服务在构造时就尝试获取 store，但此时 Pinia 还未初始化

## 解决方案

### 1. 延迟初始化模式

#### 修复前（❌ 错误）
```typescript
// 模块加载时就创建实例，此时 Pinia 可能未初始化
export const taskDomainApplicationService = new TaskDomainApplicationService();
```

#### 修复后（✅ 正确）
```typescript
// 延迟初始化单例
let _taskDomainApplicationServiceInstance: TaskDomainApplicationService | null = null;

export function getTaskDomainApplicationService(): TaskDomainApplicationService {
  if (!_taskDomainApplicationServiceInstance) {
    _taskDomainApplicationServiceInstance = new TaskDomainApplicationService();
  }
  return _taskDomainApplicationServiceInstance;
}
```

### 2. 状态仓库延迟获取

#### PiniaTaskStateRepository 修复

```typescript
export class PiniaTaskStateRepository implements ITaskStateRepository {
  private _taskStore: ReturnType<typeof useTaskStore> | null = null;

  // 延迟获取 taskStore，确保 Pinia 已经初始化
  private get taskStore() {
    if (!this._taskStore) {
      this._taskStore = useTaskStore();
    }
    return this._taskStore;
  }
  
  // ...其他方法
}
```

## 使用方式更新

### 旧用法 → 新用法

#### 1. 直接使用

```typescript
// ❌ 旧用法
import { taskDomainApplicationService } from '@/modules/Task/application/services/taskDomainApplicationService';
await taskDomainApplicationService.createTaskTemplate(data);

// ✅ 新用法
import { getTaskDomainApplicationService } from '@/modules/Task/application/services/taskDomainApplicationService';
const taskService = getTaskDomainApplicationService();
await taskService.createTaskTemplate(data);
```

#### 2. 在 userDataInitService 中

```typescript
// ❌ 旧用法
private static async initTaskData(username: string): Promise<void> {
  await taskDomainApplicationService.syncAllData();
}

// ✅ 新用法  
private static async initTaskData(username: string): Promise<void> {
  const taskService = getTaskDomainApplicationService();
  await taskService.syncAllData();
}
```

#### 3. 向后兼容模式

为了减少改动，提供了兼容性包装：

```typescript
// ✅ 兼容用法（推荐逐步迁移到函数形式）
import { taskDomainApplicationService } from '@/modules/Task/application/services/taskDomainApplicationService';
await taskDomainApplicationService.instance.createTaskTemplate(data);
```

## 最佳实践

### 1. 组件中使用

```vue
<script setup lang="ts">
import { getTaskDomainApplicationService } from '@/modules/Task/application/services/taskDomainApplicationService';

// 在组件中使用时，Pinia 已经初始化
const taskService = getTaskDomainApplicationService();

const handleCreateTask = async () => {
  const result = await taskService.createTaskTemplate({
    title: 'New Task',
    // ...其他字段
  });
  
  if (result.success) {
    console.log('任务创建成功');
  }
};
</script>
```

### 2. 在 Composition API 中

```typescript
import { getTaskDomainApplicationService } from '@/modules/Task/application/services/taskDomainApplicationService';

export function useTaskOperations() {
  const taskService = getTaskDomainApplicationService();
  
  const createTask = async (data: ITaskTemplate) => {
    return await taskService.createTaskTemplate(data);
  };
  
  const deleteTask = async (id: string) => {
    return await taskService.deleteTaskTemplate(id);
  };
  
  return {
    createTask,
    deleteTask
  };
}
```

### 3. 在服务类中

```typescript
export class SomeOtherService {
  private getTaskService() {
    return getTaskDomainApplicationService();
  }
  
  async doSomethingWithTasks() {
    const taskService = this.getTaskService();
    await taskService.syncAllData();
  }
}
```

## 错误处理

### 1. 仍然遇到 Pinia 错误

如果仍然遇到错误，检查以下几点：

```typescript
// 确保在 Vue 应用初始化后使用
export function useTaskService() {
  try {
    return getTaskDomainApplicationService();
  } catch (error) {
    if (error.message.includes('getActivePinia')) {
      console.error('Pinia 未初始化，请确保在 Vue 应用启动后调用');
      throw new Error('Task service is not available yet');
    }
    throw error;
  }
}
```

### 2. 测试环境中的使用

```typescript
// 测试中提供 mock 实现
import { createTaskDomainApplicationService } from '@/modules/Task/application/services/taskDomainApplicationService';

describe('SomeComponent', () => {
  let mockTaskService: TaskDomainApplicationService;
  
  beforeEach(() => {
    const mockStateRepo = createMockStateRepository();
    mockTaskService = createTaskDomainApplicationService(mockStateRepo);
  });
  
  // ...测试用例
});
```

## 迁移清单

### 全项目迁移步骤

1. **✅ 已完成**：修复 `PiniaTaskStateRepository` 延迟初始化
2. **✅ 已完成**：修复 `TaskDomainApplicationService` 单例模式
3. **✅ 已完成**：修复 `userDataInitService` 使用方式
4. **🔄 进行中**：检查其他文件中的导入和使用

### 需要检查的文件

```bash
# 搜索所有使用 taskDomainApplicationService 的文件
grep -r "taskDomainApplicationService" src/ --include="*.ts" --include="*.vue"

# 搜索可能需要更新的导入
grep -r "from.*taskDomainApplicationService" src/ --include="*.ts" --include="*.vue"
```

### 迁移验证

1. **启动应用**：确保应用正常启动，无 Pinia 错误
2. **功能测试**：验证任务相关功能正常工作
3. **状态同步**：确认数据在主进程和渲染进程间正确同步
4. **单元测试**：运行相关测试，确保无回归

## 总结

通过引入延迟初始化模式，我们解决了 Pinia 初始化时机问题：

- ✅ **解决了启动时的 Pinia 错误**
- ✅ **保持了原有的功能性**
- ✅ **提供了向后兼容性**
- ✅ **改善了测试友好性**

这种模式确保了应用服务只在实际需要时才创建，避免了模块加载时的初始化冲突。
