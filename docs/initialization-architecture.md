# 应用初始化架构设计

## 概述

为了解决之前"从元模板创建任务模板"时出现"Meta template not found"错误，我们重新设计了应用的初始化架构。新架构将初始化过程分为不同的阶段，确保每个阶段的依赖关系和执行顺序都得到正确处理。

## 初始化阶段

### 1. APP_STARTUP - 应用启动阶段
- **时机**: `app.whenReady()` 后立即执行
- **目的**: 初始化基础设施和 IPC 处理器
- **特点**: 不依赖用户登录状态

**包含的任务:**
- 文件系统处理器注册
- Git 处理器注册
- 用户 IPC 处理器注册
- 登录会话 IPC 处理器注册
- 存储 IPC 处理器注册
- 通知服务初始化
- 日程服务初始化
- 任务 IPC 处理器注册

### 2. USER_LOGIN - 用户登录阶段
- **时机**: 用户成功登录后执行
- **目的**: 初始化依赖用户身份的数据和服务
- **特点**: 需要当前用户上下文

**包含的任务:**
- 设置任务模块的当前用户
- 初始化系统任务模板
- 初始化用户相关的数据结构

### 3. 其他阶段（未来扩展）
- `BEFORE_USER_LOGIN`: 登录前准备
- `USER_LOGOUT`: 用户登出清理
- `APP_SHUTDOWN`: 应用关闭清理

## 文件结构

```
electron/
├── shared/
│   └── initialization/
│       ├── initializationManager.ts    # 核心初始化管理器
│       └── appInitializer.ts          # 应用初始化入口
├── modules/
│   ├── Account/
│   │   └── initialization/
│   │       └── accountInitialization.ts  # 账户模块初始化任务
│   └── Task/
│       └── initialization/
│           └── taskInitialization.ts     # 任务模块初始化任务
└── main.ts                             # 主进程入口（已修改）
```

## 核心组件

### InitializationManager
- 管理所有初始化任务的注册和执行
- 处理任务依赖关系
- 支持按阶段分组执行
- 提供清理机制

### InitializationTask
```typescript
interface InitializationTask {
  name: string;                    // 任务名称
  phase: InitializationPhase;      // 执行阶段
  priority: number;                // 优先级（数字越小优先级越高）
  dependencies?: string[];         // 依赖的其他任务
  initialize: (context?) => Promise<void>;  // 初始化函数
  cleanup?: () => Promise<void>;   // 清理函数（可选）
}
```

## 使用方式

### 1. 注册初始化任务
```typescript
// 在模块的 initialization 文件中定义任务
const taskIpcInitTask: InitializationTask = {
  name: 'task-ipc-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 50,
  dependencies: ['filesystem'],
  initialize: async () => {
    // 初始化逻辑
  }
};

// 注册任务
const manager = InitializationManager.getInstance();
manager.registerTask(taskIpcInitTask);
```

### 2. 执行初始化
```typescript
// 应用启动时
await initializeApp();

// 用户登录时
await initializeUserSession(username);

// 应用关闭时
await cleanupApp();
```

## 解决的问题

1. **Meta template not found 错误**: 
   - 现在系统模板只在用户登录后初始化
   - 确保仓库有正确的用户上下文

2. **依赖关系混乱**: 
   - 明确定义了模块间的依赖关系
   - 按优先级和依赖顺序执行初始化

3. **初始化时机不当**: 
   - 区分了应用启动时和用户登录时的初始化
   - 避免了在没有用户上下文时执行用户相关操作

4. **代码分散**: 
   - 统一管理所有初始化逻辑
   - 便于维护和调试

## 向后兼容性

为了保持向后兼容，原有的初始化函数仍然保留，但内部委托给新的初始化系统：

```typescript
// 保留原有接口
export async function initializeTaskModule(): Promise<void> {
  await newInitializeTaskModule();
}

export async function initializeTaskModuleForUser(username: string): Promise<void> {
  await newInitializeTaskModuleForUser(username);
}
```

## 最佳实践

1. **模块化**: 每个模块在自己的 `initialization` 目录下定义初始化任务
2. **依赖明确**: 明确声明任务间的依赖关系
3. **阶段分离**: 将初始化逻辑按阶段分组
4. **错误处理**: 每个任务都应该有适当的错误处理
5. **日志记录**: 详细记录初始化过程，便于调试

## 未来扩展

1. **条件初始化**: 根据配置或环境条件决定是否执行某些任务
2. **并行执行**: 对于没有依赖关系的任务，可以并行执行
3. **重试机制**: 对于可能失败的任务，提供重试机制
4. **健康检查**: 初始化完成后进行健康检查
5. **热重载**: 开发环境下的模块热重载支持
