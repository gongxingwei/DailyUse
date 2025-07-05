# Task 模块架构重构对比

## 架构变化对比

### 重构前的架构

```
TaskServiceClient (services/)
├── 直接调用 IPC
├── 返回 DTO (ITaskTemplate/ITaskInstance)
├── 手动错误处理
└── UI 组件需要手动转换数据
```

**问题：**
1. 职责混乱：单个服务文件承担了 IPC 调用、错误处理、数据返回等多种职责
2. 数据转换负担：UI 组件需要手动处理 DTO 到领域对象的转换
3. 重复代码：每个方法都要重复相同的错误处理逻辑
4. 违反 DDD 原则：业务服务没有放在 Application 层

### 重构后的 DDD 架构

```
Infrastructure Layer (infrastructure/)
├── TaskIpcClient
│   ├── 纯 IPC 调用
│   ├── 返回原始 TaskResponse<DTO>
│   └── 无业务逻辑

Application Layer (application/services/)
├── TaskDomainApplicationService
│   ├── 调用 IpcClient
│   ├── 使用 Mapper 自动转换 DTO ↔ 领域对象
│   ├── 统一错误处理
│   └── 返回强类型领域对象

Domain Layer (domain/entities/)
├── TaskTemplate/TaskInstance 领域对象
│   ├── UI 校验方法 (canActivate, canComplete)
│   ├── 操作预览方法 (previewAction)
│   └── 查询方法 (getAvailableActions)
└── Mapper 负责 DTO ↔ 领域对象转换
```

## 代码对比

### 重构前的调用方式

```typescript
// 在 UI 组件中
import { taskServiceClient } from '@/modules/Task/services/taskServiceClient_new';

// 1. 调用服务获取 DTO
const taskDTO = await taskServiceClient.getTaskInstance(taskId);

if (taskDTO) {
  // 2. 手动转换为领域对象
  const task = TaskInstanceMapper.fromDTO(taskDTO);
  
  // 3. 进行 UI 校验
  const canComplete = task.canComplete();
  
  if (canComplete.canComplete) {
    // 4. 调用业务操作
    const result = await taskServiceClient.completeTaskInstance(taskId);
    if (result.success) {
      // 5. 手动处理成功状态
    }
  }
}
```

### 重构后的调用方式

```typescript
// 在 UI 组件中
import { taskDomainApplicationService } from '@/modules/Task/application/services/taskDomainApplicationService';

// 1. 直接获取领域对象（自动转换）
const task = await taskDomainApplicationService.getTaskInstance(taskId);

if (task) {
  // 2. 直接使用领域对象的方法
  const canComplete = task.canComplete();
  
  if (canComplete.canComplete) {
    // 3. 调用业务操作（更简洁）
    const result = await taskDomainApplicationService.completeTaskInstance(taskId);
    if (result.success) {
      // 成功处理
    }
  }
}
```

## 架构优势

### 1. 职责分离清晰

| 层级 | 职责 | 文件位置 |
|------|------|----------|
| Infrastructure | IPC 通信 | `infrastructure/ipc/taskIpcClient.ts` |
| Application | 业务协调、数据转换 | `application/services/taskDomainApplicationService.ts` |
| Domain | 业务逻辑、UI 校验 | `domain/entities/taskTemplate.ts`, `taskInstance.ts` |
| Presentation | UI 交互 | `presentation/` |

### 2. 自动化数据转换

```typescript
// 重构前：手动转换
const response = await ipcCall();
const domainObject = Mapper.fromDTO(response.data);

// 重构后：自动转换
const domainObject = await applicationService.getEntity(); // 已经是领域对象
```

### 3. 更好的类型安全

```typescript
// 重构前：返回 DTO，需要手动转换
async getTaskTemplate(id: string): Promise<ITaskTemplate | null>

// 重构后：直接返回领域对象
async getTaskTemplate(id: string): Promise<TaskTemplate | null>
```

### 4. 统一的错误处理

```typescript
// 重构前：每个方法都要重复错误处理
async getTaskTemplate(id: string) {
  try {
    const response = await ipcCall();
    return response.success ? response.data : null;
  } catch (error) {
    console.error('Failed:', error);
    return null;
  }
}

// 重构后：Application Service 统一处理
async getTaskTemplate(id: string): Promise<TaskTemplate | null> {
  try {
    const response = await taskIpcClient.getTaskTemplate(id);
    return response.success && response.data ? 
      TaskTemplateMapper.fromDTO(response.data) : null;
  } catch (error) {
    console.error('Failed to get task template:', error);
    return null;
  }
}
```

## 使用体验提升

### 1. UI 组件更简洁

```typescript
// 重构前：需要处理 DTO 转换和多层错误处理
const handleComplete = async () => {
  try {
    const taskDTO = await taskServiceClient.getTaskInstance(taskId);
    if (taskDTO) {
      const task = TaskInstanceMapper.fromDTO(taskDTO);
      if (task.canComplete().canComplete) {
        const result = await taskServiceClient.completeTaskInstance(taskId);
        if (result.success) {
          // 成功处理
        } else {
          setError(result.message);
        }
      }
    }
  } catch (error) {
    setError('操作失败');
  }
};

// 重构后：直接使用领域对象
const handleComplete = async () => {
  const task = await taskDomainApplicationService.getTaskInstance(taskId);
  if (task && task.canComplete().canComplete) {
    const result = await taskDomainApplicationService.completeTaskInstance(taskId);
    if (result.success) {
      // 成功处理
    } else {
      setError(result.message);
    }
  }
};
```

### 2. 更好的智能提示

重构后，IDE 可以直接提示领域对象的所有方法，包括：
- `canComplete()`, `canStart()`, `canCancel()` 等校验方法
- `getAvailableActions()`, `previewAction()` 等预览方法
- `getReminderStats()`, `getNextReminder()` 等查询方法

### 3. 更安全的业务操作

```typescript
// 重构前：容易误用领域对象的业务方法
task.complete(); // ❌ 错误：直接调用业务方法

// 重构后：明确区分校验和操作
task.canComplete(); // ✅ 正确：UI 校验
await service.completeTaskInstance(task.id); // ✅ 正确：业务操作
```

## 迁移指南

### 1. 替换服务导入

```typescript
// 旧的导入
import { taskServiceClient } from '@/modules/Task/services/taskServiceClient_new';

// 新的导入
import { taskDomainApplicationService } from '@/modules/Task/application/services/taskDomainApplicationService';
```

### 2. 更新方法调用

| 旧方法 | 新方法 | 返回值变化 |
|--------|--------|-----------|
| `taskServiceClient.getTaskTemplate()` | `taskDomainApplicationService.getTaskTemplate()` | `ITaskTemplate` → `TaskTemplate` |
| `taskServiceClient.getAllTaskInstances()` | `taskDomainApplicationService.getAllTaskInstances()` | `ITaskInstance[]` → `TaskInstance[]` |

### 3. 移除手动转换代码

```typescript
// 移除这些手动转换
const task = TaskInstanceMapper.fromDTO(taskDTO);
const template = TaskTemplateMapper.fromDTO(templateDTO);

// 直接使用应用服务返回的领域对象
const task = await taskDomainApplicationService.getTaskInstance(id);
```

## 总结

重构后的架构符合 DDD 原则，实现了：

1. **更清晰的分层**：Infrastructure → Application → Domain → Presentation
2. **更好的封装**：自动化数据转换，隐藏 IPC 调用细节
3. **更强的类型安全**：直接返回领域对象，提供完整的业务方法
4. **更简洁的调用**：减少样板代码，提升开发体验
5. **更好的可维护性**：职责分离，便于测试和扩展

## 5. 新架构的核心改进

### 5.1 从元模板创建任务模板（新推荐方式）

```typescript
// 渲染进程 - 一步创建完整对象
const newTemplate = await taskDomainApplicationService.createTaskTemplateFromMetaTemplate(
  metaTemplateId,
  '任务标题',
  {
    description: '任务描述',
    priority: 4,
    tags: ['示例'],
    estimatedDuration: 90
  }
);

// 主进程直接返回完整的 TaskTemplate 对象
// 渲染进程无需复杂的构建过程，直接获得可用对象
```

### 5.2 统一的类型定义

**删除重复：**
- ✅ 删除 `shared/types/taskInterfaces.ts`
- ✅ 统一使用 `modules/Task/domain/types/task.d.ts`
- ✅ 所有引用已更新为统一路径

**简化接口：**
- ❌ 移除复杂的 `CreateTaskTemplateRequest`
- ✅ 新增简化的 `CreateTaskTemplateFromMetaTemplateOptions`
- ✅ 主进程直接生成完整对象，减少 DTO 转换复杂度

### 5.3 创建流程优化对比

| 方面 | 旧架构 | 新架构 |
|------|--------|--------|
| 创建方式 | 复杂的 CreateTaskTemplateRequest | 从元模板一步创建 |
| 对象完整性 | 需要多步构建 | 主进程返回完整对象 |
| 渲染进程职责 | 复杂业务构建 | 仅修改和展示 |
| 类型安全 | 多套重复接口 | 统一类型定义 |

## 6. 迁移完成情况

### 6.1 已完成的重构
- ✅ 删除 `shared/types/taskInterfaces.ts` 重复文件
- ✅ 更新所有文件的类型引用路径
- ✅ 新增 `TaskMetaTemplate.createTaskTemplate()` 方法
- ✅ 新增 `MainTaskApplicationService.createTaskTemplateFromMetaTemplate()` 方法
- ✅ 新增 IPC 路由：`task:templates:create-from-meta-template`
- ✅ 新增渲染进程应用服务方法
- ✅ 更新使用示例和文档

### 6.2 架构优化效果
- **类型统一**: 所有类型定义统一在 `domain/types/task.d.ts`
- **创建简化**: 主进程直接返回完整对象，渲染进程只做修改
- **职责清晰**: 主进程负责业务逻辑，渲染进程负责 UI 和轻量校验
- **减少重复**: 消除了多套类型定义的维护负担

### 6.3 下一步工作
- [ ] 为 TaskTemplate 添加属性 setter 方法，支持渲染进程直接修改
- [ ] 完善 TaskInstance 的类似创建流程
- [ ] 端到端测试所有 CRUD 操作
- [ ] 更新 Store 层以适配新的数据流
- [ ] 添加更多元模板管理功能
