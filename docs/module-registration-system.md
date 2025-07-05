# 模块注册系统使用指南

## 概述

新的模块注册系统提供了统一的方式来管理 Electron 主进程中的所有模块。它支持依赖关系管理、优先级排序、自动初始化和清理等功能。

## 系统架构

```
ModuleRegistry (核心注册表)
├── moduleManager.ts (模块定义和管理)
├── moduleRegistry.ts (注册表实现)
└── moduleDebugger.ts (调试工具)
```

## 添加新模块

### 1. 创建模块
首先在对应目录下创建模块的 `main.ts` 文件：

```typescript
// electron/modules/YourModule/main.ts
export function initializeYourModule(): void {
  console.log('Initializing Your Module...');
  // 初始化逻辑
}

export function cleanupYourModule(): void {
  console.log('Cleaning up Your Module...');
  // 清理逻辑
}
```

### 2. 注册模块
在 `electron/shared/moduleManager.ts` 中添加模块定义：

```typescript
import { initializeYourModule, cleanupYourModule } from '../modules/YourModule/main';

const yourModule: Module = {
  name: 'yourModule',
  initialize: initializeYourModule,
  cleanup: cleanupYourModule,
  dependencies: ['filesystem', 'notification'], // 可选：依赖的模块
  priority: 60 // 可选：优先级（数字越小越先初始化）
};

export function registerAllModules(): void {
  const modules: Module[] = [
    // ... 现有模块
    yourModule, // 添加新模块
  ];

  moduleRegistry.registerAll(modules);
}
```

### 3. 模块接口定义

```typescript
interface Module {
  name: string;                    // 模块唯一名称
  initialize: () => void | Promise<void>;  // 初始化函数
  cleanup?: () => void | Promise<void>;    // 清理函数（可选）
  dependencies?: string[];         // 依赖的模块名称（可选）
  priority?: number;              // 优先级，默认 100（可选）
}
```

## 模块示例

### 基础模块
```typescript
const basicModule: Module = {
  name: 'basic',
  initialize: () => {
    console.log('Basic module initialized');
  }
};
```

### 带依赖的模块
```typescript
const advancedModule: Module = {
  name: 'advanced',
  initialize: initializeAdvanced,
  cleanup: cleanupAdvanced,
  dependencies: ['basic', 'filesystem'],
  priority: 50
};
```

### 异步模块
```typescript
const asyncModule: Module = {
  name: 'async',
  initialize: async () => {
    console.log('Starting async initialization...');
    await someAsyncOperation();
    console.log('Async module ready');
  },
  cleanup: async () => {
    await someAsyncCleanup();
  }
};
```

## 当前模块列表

### 基础设施模块 (优先级 10-15)
- **filesystem** - 文件系统操作
- **git** - Git 操作

### 账户模块 (优先级 20-30)
- **user** - 用户管理
- **loginSession** - 登录会话
- **store** - 数据存储

### 系统服务模块 (优先级 40-45)
- **notification** - 通知服务
- **schedule** - 调度服务

### 业务模块 (优先级 50+)
- **task** - 任务管理

## 使用方式

### 在主进程中
```typescript
// electron/main.ts
import { initializeAllModules, cleanupAllModules } from './shared/moduleManager';

app.whenReady().then(async () => {
  createWindow();
  if (win) {
    await initializeAllModules(); // 初始化所有模块
  }
});

app.on('before-quit', async () => {
  await cleanupAllModules(); // 清理所有模块
});
```

### 在渲染进程中调试
```typescript
// 开发环境下，可以在控制台中使用
moduleDebugger.printModuleStatus();
await moduleDebugger.waitForModule('task');
await moduleDebugger.waitForAllModules();
```

## 调试功能

### 查看模块状态
```typescript
import ModuleDebugger from '@/shared/utils/moduleDebugger';

// 获取状态
const status = await ModuleDebugger.getModuleStatus();

// 打印状态到控制台
await ModuleDebugger.printModuleStatus();

// 检查特定模块
const isReady = await ModuleDebugger.isModuleReady('task');
```

### 等待模块就绪
```typescript
// 等待特定模块
const success = await ModuleDebugger.waitForModule('task', 5000);

// 等待所有模块
const allReady = await ModuleDebugger.waitForAllModules();
```

## 错误处理

### 依赖检查
系统会自动检查依赖关系：
- 缺少依赖时会抛出错误
- 循环依赖时会抛出错误
- 按依赖顺序自动排序初始化

### 初始化失败
- 单个模块失败不会影响其他模块
- 失败信息会记录到控制台
- 可以通过调试工具查看状态

### 清理保证
- 应用退出时自动清理
- 按初始化相反顺序清理
- 清理失败不会阻止应用退出

## 最佳实践

### 1. 模块设计
- 保持模块功能单一
- 明确定义依赖关系
- 提供清理函数

### 2. 错误处理
- 在初始化函数中添加 try-catch
- 记录详细的错误信息
- 避免抛出未捕获的异常

### 3. 性能考虑
- 避免在初始化中执行耗时操作
- 考虑使用异步初始化
- 合理设置优先级

### 4. 调试支持
- 在开发环境使用调试工具
- 定期检查模块状态
- 监控初始化时间

## 未来扩展

### 计划中的功能
- 热重载支持
- 模块性能监控
- 配置文件支持
- 条件加载

### 潜在新模块
- **goal** - 目标管理模块
- **habit** - 习惯跟踪模块
- **analytics** - 数据分析模块
- **sync** - 数据同步模块

这个模块注册系统为应用的模块化架构提供了坚实的基础，支持灵活的扩展和维护。
