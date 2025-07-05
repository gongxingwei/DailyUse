# 渲染进程 Task 模块重构说明

## 概述

渲染进程的 Task 模块已重构为支持两种仓库模式：**Store 模式**和 **IPC 模式**，以适应不同的使用场景和数据同步需求。

## 架构变更

### 1. 仓库模式架构

```
TaskContainer (依赖注入容器)
├── Store 模式
│   ├── TaskTemplateStoreRepository
│   ├── TaskInstanceStoreRepository
│   └── TaskMetaTemplateStoreRepository
└── IPC 模式
    ├── TaskTemplateIpcRepository
    ├── TaskInstanceIpcRepository
    └── TaskMetaTemplateIpcRepository
```

### 2. 接口统一

所有仓库实现都遵循相同的接口契约：
- `ITaskTemplateRepository`
- `ITaskInstanceRepository`
- `ITaskMetaTemplateRepository`

每个接口都包含 `setCurrentUser(username: string): void` 方法以支持多用户隔离。

## 两种模式对比

### Store 模式 (默认)

**适用场景：**
- 需要响应式状态管理
- 频繁的 UI 交互
- 离线操作支持
- 本地缓存优化

**特点：**
- 使用 `useTaskStore()` 进行本地状态管理
- 支持 Vue 响应式系统
- 可以在网络断开时继续工作
- 数据变更立即反映到 UI

**数据流：**
```
UI组件 ↔ Store ↔ StoreRepository → 定期同步 → 主进程 → 数据库
```

### IPC 模式

**适用场景：**
- 需要实时数据同步
- 多窗口数据一致性
- 直接操作主进程数据库
- 服务器端数据集成

**特点：**
- 直接通过 IPC 与主进程通信
- 所有操作实时同步到数据库
- 多窗口间数据自动同步
- 网络状态直接影响可用性

**数据流：**
```
UI组件 → IpcRepository → IPC → 主进程 → 数据库
```

## 使用方法

### 基础使用

```typescript
import { TaskContainer, RepositoryMode } from '@/modules/Task/infrastructure/di/taskContainer';

// 使用默认 Store 模式
const container = TaskContainer.getInstance();
container.setCurrentUser('username');

const templateRepo = container.getTaskTemplateRepository();
const instanceRepo = container.getTaskInstanceRepository();
```

### 指定模式

```typescript
// Store 模式
const storeContainer = TaskContainer.getInstance(RepositoryMode.STORE);

// IPC 模式
const ipcContainer = TaskContainer.getInstance(RepositoryMode.IPC);
```

### 动态切换

```typescript
const container = TaskContainer.getInstance();

// 切换到 Store 模式（离线工作）
container.switchToStoreMode();

// 切换到 IPC 模式（实时同步）
container.switchToIpcMode();
```

### 在 Vue Composable 中使用

```typescript
// 在 useTaskService.ts 中
import { useTaskRepositories } from '@/modules/Task/infrastructure/config/taskModuleConfig';

export function useTaskService() {
  const { 
    templateRepository,
    instanceRepository,
    setCurrentUser,
    getCurrentMode 
  } = useTaskRepositories();

  // 使用仓库进行操作
  const loadTasks = async () => {
    const result = await instanceRepository.findAll();
    return result.data || [];
  };

  return {
    loadTasks,
    setCurrentUser,
    getCurrentMode
  };
}
```

## 新增文件

### 1. IPC 仓库实现
- `taskTemplateIpcRepository.ts` - TaskTemplate IPC 仓库
- `taskInstanceIpcRepository.ts` - TaskInstance IPC 仓库  
- `taskMetaTemplateIpcRepository.ts` - TaskMetaTemplate IPC 仓库

### 2. 配置和工具
- `taskModuleConfig.ts` - 配置示例和工具函数
- 更新的 `taskContainer.ts` - 支持双模式的依赖注入容器

## 修改的文件

### 1. 接口定义
- `iTaskTemplateRepository.ts` - 添加 `setCurrentUser` 方法和 `TResponse` 导入
- `iTaskInstanceRepository.ts` - 添加 `setCurrentUser` 方法和 `TResponse` 导入
- `iTaskMetaTemplateRepository.ts` - 添加 `setCurrentUser` 方法和 `TResponse` 导入

### 2. Store 仓库实现
- `taskTemplateStoreRepository.ts` - 添加 `setCurrentUser` 方法
- `taskInstanceStoreRepository.ts` - 添加 `setCurrentUser` 方法
- `taskMetaTemplateStoreRepository.ts` - 添加 `setCurrentUser` 方法

## 迁移建议

### 对于现有代码

1. **无需立即修改**：现有使用 Store 模式的代码继续工作
2. **渐进式迁移**：可以逐步将关键功能迁移到 IPC 模式
3. **用户隔离**：确保在应用启动时调用 `setCurrentUser()`

### 推荐策略

1. **开发阶段**：使用 Store 模式进行快速开发和调试
2. **生产环境**：根据实际需求选择合适的模式
3. **混合使用**：在同一应用中根据不同场景使用不同模式

## 注意事项

### 1. 数据一致性
- Store 模式需要定期同步数据
- IPC 模式保证实时一致性但依赖网络

### 2. 性能考虑
- Store 模式：本地操作快，但需要内存缓存
- IPC 模式：每次操作都有 IPC 开销

### 3. 错误处理
- IPC 模式需要处理网络中断和 IPC 失败
- Store 模式需要处理数据同步冲突

### 4. 用户体验
- Store 模式提供更流畅的交互体验
- IPC 模式提供更准确的数据状态

## 下一步规划

1. **数据同步机制**：完善 Store 模式的数据同步策略
2. **离线支持**：增强离线模式下的数据管理
3. **冲突解决**：实现数据冲突的自动解决机制
4. **性能优化**：优化 IPC 通信和批量操作
5. **监控和日志**：添加操作监控和错误追踪
