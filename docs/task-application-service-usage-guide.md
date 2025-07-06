# 任务应用服务使用指南

## 基本使用

### 1. 默认使用方式
```typescript
import { taskDomainApplicationService } from '@/modules/Task/application/services/taskDomainApplicationService';

// 直接使用默认实例（内部使用 Pinia 状态仓库）
const result = await taskDomainApplicationService.createTaskTemplate({
  title: '新任务模板',
  description: '描述',
  // ... 其他字段
});

if (result.success) {
  console.log('创建成功，状态已自动同步');
  // result.template 包含创建的领域对象
}
```

### 2. 依赖注入使用方式
```typescript
import { createTaskDomainApplicationService } from '@/modules/Task/application/services/taskDomainApplicationService';
import { PiniaTaskStateRepository } from '@/modules/Task/infrastructure/repositories/piniaTaskStateRepository';

// 显式创建状态仓库
const stateRepository = new PiniaTaskStateRepository();
const taskService = createTaskDomainApplicationService(stateRepository);

await taskService.createTaskTemplate(templateData);
```

## 测试使用

### 单元测试
```typescript
import { createTaskDomainApplicationService } from '@/modules/Task/application/services/taskDomainApplicationService';
import type { ITaskStateRepository } from '@/modules/Task/domain/repositories/ITaskStateRepository';

// 创建 mock 状态仓库
const mockStateRepository: ITaskStateRepository = {
  addTaskTemplate: jest.fn(),
  updateTaskTemplate: jest.fn(),
  removeTaskTemplate: jest.fn(),
  // ... 其他方法的 mock
  isAvailable: () => true
};

// 注入 mock 仓库
const taskService = createTaskDomainApplicationService(mockStateRepository);

// 执行测试
await taskService.createTaskTemplate(testData);

// 验证状态同步
expect(mockStateRepository.addTaskTemplate).toHaveBeenCalledWith(testData);
```

## 数据同步机制

### 自动同步
所有变更操作成功后会自动同步到状态仓库：

```typescript
// ✅ 自动同步的操作
await taskService.createTaskTemplate(data);     // 创建后自动添加到状态
await taskService.updateTaskTemplate(data);     // 更新后自动同步状态
await taskService.deleteTaskTemplate(id);       // 删除后自动从状态移除
await taskService.activateTaskTemplate(id);     // 状态变更后自动同步
```

### 手动同步
```typescript
// 🔄 手动触发全量同步（适用于应用初始化）
await taskService.syncAllData();
```

## 错误处理

### 状态仓库不可用
```typescript
// 当状态仓库不可用时，业务逻辑正常执行，但会跳过状态同步
const result = await taskService.createTaskTemplate(data);
// ⚠️ 控制台会输出警告："状态仓库不可用，跳过同步"
// ✅ result.success 仍然反映实际的业务操作结果
```

### 同步失败处理
```typescript
// 同步失败不会影响主业务流程
try {
  const result = await taskService.createTaskTemplate(data);
  // 即使状态同步失败，创建操作的结果仍然有效
  console.log('业务操作结果:', result.success);
} catch (error) {
  // 业务异常处理
  console.error('业务操作失败:', error);
}
```

## 扩展自定义状态仓库

### 1. 实现接口
```typescript
import type { ITaskStateRepository } from '@/modules/Task/domain/repositories/ITaskStateRepository';

export class CustomTaskStateRepository implements ITaskStateRepository {
  async addTaskTemplate(template: ITaskTemplate): Promise<void> {
    // 自定义实现：可能是 localStorage、IndexedDB、或远程缓存
    await this.customStorage.save('templates', template);
  }

  async updateTaskTemplate(template: ITaskTemplate): Promise<void> {
    await this.customStorage.update('templates', template);
  }

  // ... 实现其他必要方法

  isAvailable(): boolean {
    return this.customStorage.isConnected();
  }
}
```

### 2. 使用自定义仓库
```typescript
const customRepo = new CustomTaskStateRepository();
const taskService = createTaskDomainApplicationService(customRepo);
```

## 迁移指南

### 从直接使用 store 迁移

#### 迁移前
```typescript
// ❌ 旧方式：直接使用 store
import { useTaskStore } from '@/modules/Task/presentation/stores/taskStore';

const taskStore = useTaskStore();

async function createTask(data) {
  const response = await taskIpcClient.createTaskTemplate(data);
  if (response.success) {
    await taskStore.addTaskTemplate(response.data); // 手动同步
  }
  return response;
}
```

#### 迁移后
```typescript
// ✅ 新方式：使用应用服务
import { taskDomainApplicationService } from '@/modules/Task/application/services/taskDomainApplicationService';

async function createTask(data) {
  // 自动处理 IPC 调用和状态同步
  return await taskDomainApplicationService.createTaskTemplate(data);
}
```

### 批量操作迁移

#### 迁移前
```typescript
// ❌ 旧方式：手动处理多个操作和同步
async function initializeData() {
  const templates = await taskIpcClient.getAllTaskTemplates();
  const instances = await taskIpcClient.getAllTaskInstances();
  const metaTemplates = await taskIpcClient.getAllMetaTemplates();
  
  if (templates.success) taskStore.setTaskTemplates(templates.data);
  if (instances.success) taskStore.setTaskInstances(instances.data);
  if (metaTemplates.success) taskStore.setMetaTemplates(metaTemplates.data);
}
```

#### 迁移后
```typescript
// ✅ 新方式：一键同步
async function initializeData() {
  await taskDomainApplicationService.syncAllData();
}
```

## 最佳实践

### 1. 依赖注入
- 生产环境：使用默认实例
- 测试环境：注入 mock 仓库
- 特殊需求：注入自定义仓库

### 2. 错误处理
- 总是检查业务操作的 `success` 字段
- 状态同步失败不影响业务逻辑判断
- 适当记录和监控同步失败情况

### 3. 性能优化
- 应用启动时调用 `syncAllData()` 进行全量同步
- 避免频繁的单个数据同步，优先使用批量操作
- 在组件销毁时不需要手动清理，状态仓库会自动管理

### 4. 调试和监控
```typescript
// 开启详细日志以便调试
console.log('✅ 创建任务模板成功并同步到状态: template-id');
console.log('⚠️ 状态仓库不可用，跳过同步');
console.log('❌ 同步任务数据失败:', error);
```

## 常见问题

### Q: 状态同步失败会影响业务操作吗？
A: 不会。状态同步是额外的操作，失败后只会影响前端状态，不会影响数据库中的实际数据。

### Q: 如何确保状态与数据库一致？
A: 应用启动时调用 `syncAllData()`，关键操作后会自动同步。如有疑虑可手动调用同步方法。

### Q: 可以禁用状态同步吗？
A: 可以注入一个"空"的状态仓库实现，所有方法都是空操作。

### Q: 如何监控状态同步的性能？
A: 可以在自定义状态仓库实现中添加性能监控逻辑，或查看控制台的同步日志。
