# 日志系统提取完成总结

## 概述

已成功将日志系统提取为 **@dailyuse/utils** 包的一部分，实现跨平台（Node.js + 浏览器）复用。

---

## 实现文件

### 1. 核心类型定义

**文件**: `packages/utils/src/logger/types.ts`

- `LogLevel` 枚举：ERROR, WARN, INFO, HTTP, DEBUG
- `ILogger` 接口：定义统一的日志 API
- `LogTransport` 接口：传输器抽象
- `LoggerConfig` 配置类型

### 2. Logger 实现

**文件**: `packages/utils/src/logger/Logger.ts`

- 实现 `ILogger` 接口
- 支持多传输器
- 支持子 Logger (`child()`)
- 支持动态设置日志级别
- 生产环境控制开关

### 3. Logger 工厂

**文件**: `packages/utils/src/logger/LoggerFactory.ts`

- 全局配置管理
- Logger 实例缓存
- 添加全局传输器
- 批量关闭所有 Logger

### 4. 控制台传输器 (跨平台)

**文件**: `packages/utils/src/logger/transports/ConsoleTransport.ts`

- **Node.js**: 彩色终端输出 (ANSI 颜色码)
- **浏览器**: CSS 样式化控制台输出
- 自动检测运行环境
- 支持时间戳、上下文、元数据

### 5. 文件传输器 (仅 Node.js)

**文件**: `packages/utils/src/logger/transports/FileTransport.ts`

- 支持 JSON 和纯文本格式
- 异步文件写入
- 浏览器环境静默失败
- 动态导入 `fs` 模块

### 6. 统一导出

**文件**: `packages/utils/src/logger/index.ts`

导出所有核心功能：
```typescript
export * from './types';
export { Logger } from './Logger';
export { LoggerFactory, createLogger } from './LoggerFactory';
export { ConsoleTransport } from './transports/ConsoleTransport';
export { FileTransport } from './transports/FileTransport';
```

**文件**: `packages/utils/src/index.ts`

添加日志系统到 utils 导出：
```typescript
export * from './logger';
```

---

## 使用方式

### 快速开始

```typescript
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('MyModule');

logger.debug('Debug message', { userId: 123 });
logger.info('User logged in');
logger.warn('API response slow', { duration: 3000 });
logger.error('Database error', new Error('Connection timeout'));
```

### 全局配置

```typescript
import { LoggerFactory, ConsoleTransport, FileTransport, LogLevel } from '@dailyuse/utils';

LoggerFactory.configure({
  level: 'info',
  enableInProduction: true,
  transports: [
    new ConsoleTransport({
      level: LogLevel.DEBUG,
      colorize: true,
      timestamp: true,
    }),
    
    // 仅 Node.js 支持
    new FileTransport({
      filename: './logs/app.log',
      level: LogLevel.INFO,
      json: true,
    }),
  ],
});
```

---

## 跨平台支持

### ✅ Node.js (API/Desktop 主进程)

- **ConsoleTransport**: 彩色终端输出
- **FileTransport**: JSON/文本文件日志
- **自定义传输器**: 全功能支持

### ✅ 浏览器 (Web/Desktop 渲染进程)

- **ConsoleTransport**: CSS 样式控制台
- **FileTransport**: 自动禁用（静默失败）
- **自定义传输器**: 可使用 fetch/localStorage 等

---

## 核心特性

| 特性 | 说明 |
|------|------|
| 🌐 跨平台 | 同一套 API 在 Node.js 和浏览器中工作 |
| 📊 多级别 | ERROR, WARN, INFO, HTTP, DEBUG |
| 🚀 多传输器 | 控制台、文件、自定义（远程、数据库等） |
| 🏷️ 上下文隔离 | 每个模块独立 logger，支持子 logger |
| 🎨 彩色输出 | Node.js ANSI 颜色 + 浏览器 CSS 样式 |
| 📦 轻量级 | 零外部依赖（Node.js `fs` 为内置模块） |
| ⚙️ 可配置 | 灵活的全局和实例级配置 |
| 🔒 生产环境控制 | 可选禁用日志以提高性能 |

---

## 环境检测机制

### 浏览器检测

```typescript
this.isBrowser = typeof window !== 'undefined' && 
                 typeof window.document !== 'undefined';
```

### Node.js 检测

```typescript
this.isNode = typeof process !== 'undefined' && 
              process.versions != null && 
              process.versions.node != null;
```

---

## 实际应用场景

### 1. API 服务日志

```typescript
// apps/api/src/modules/goal/application/services/GoalApplicationService.ts
import { createLogger } from '@dailyuse/utils';

export class GoalApplicationService {
  private readonly logger = createLogger('GoalService');

  async createGoal(dto: CreateGoalDto) {
    this.logger.info('Creating goal', { title: dto.title });
    
    try {
      const goal = await this.goalDomainService.createGoal(dto);
      this.logger.info('Goal created successfully', { goalId: goal.id });
      return ApiResponse.success(goal);
    } catch (error) {
      this.logger.error('Failed to create goal', error, { dto });
      return ApiResponse.error('Failed to create goal');
    }
  }
}
```

### 2. Web 应用日志

```typescript
// apps/web/src/modules/goal/composables/useGoalActions.ts
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalActions');

export function useGoalActions() {
  const createGoal = async (data: CreateGoalInput) => {
    logger.debug('Creating goal from UI', { data });
    
    try {
      const result = await goalApi.create(data);
      logger.info('Goal created', { goalId: result.id });
      return result;
    } catch (error) {
      logger.error('Failed to create goal', error);
      throw error;
    }
  };

  return { createGoal };
}
```

### 3. Desktop 主进程日志

```typescript
// apps/desktop/electron/main.ts
import { LoggerFactory, FileTransport, LogLevel } from '@dailyuse/utils';
import { app } from 'electron';
import path from 'path';

LoggerFactory.configure({
  level: 'debug',
  enableInProduction: true,
  transports: [
    new FileTransport({
      filename: path.join(app.getPath('logs'), 'main.log'),
      level: LogLevel.INFO,
      json: true,
    }),
  ],
});

const logger = createLogger('ElectronMain');
logger.info('Electron app started');
```

---

## 日志输出示例

### Node.js 控制台

```
2024-01-15T10:30:15.234Z [INFO] [GoalService] Creating goal
  Metadata: { title: 'Learn TypeScript', accountUuid: 'abc-123' }
2024-01-15T10:30:15.456Z [ERROR] [GoalService] Failed to create goal
  Error: Error { message: 'Database connection failed', stack: '...' }
```

### 浏览器控制台

```
2024-01-15T10:30:15.234Z [INFO] [GoalActions] Creating goal from UI
  Metadata: { data: { title: 'Learn TypeScript' } }
```

### JSON 文件日志

```json
{"timestamp":"2024-01-15T10:30:15.234Z","level":"info","message":"Creating goal","context":"GoalService","metadata":{"title":"Learn TypeScript"}}
{"timestamp":"2024-01-15T10:30:15.456Z","level":"error","message":"Failed to create goal","context":"GoalService","error":{"message":"Database connection failed","stack":"..."}}
```

---

## 技术细节

### 异步传输器支持

传输器的 `log()` 方法可返回 `Promise`，Logger 会自动处理：

```typescript
export class RemoteTransport implements LogTransport {
  async log(entry: LogEntry): Promise<void> {
    await fetch('https://api.example.com/logs', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }
}
```

### 级别过滤

- Logger 级别：控制 Logger 实例记录哪些级别
- Transport 级别：控制传输器输出哪些级别

```typescript
// Logger 只记录 INFO 及以上（ERROR, WARN, INFO）
const logger = createLogger('Test');
logger.setLevel('info');

// 文件传输器只输出 WARN 及以上（ERROR, WARN）
new FileTransport({
  filename: './logs/important.log',
  level: LogLevel.WARN,
});
```

### 上下文继承

```typescript
const logger = createLogger('UserModule');
const authLogger = logger.child('Auth');       // UserModule:Auth
const profileLogger = logger.child('Profile'); // UserModule:Profile
```

---

## 性能优化

### 1. Logger 缓存

默认启用实例缓存，避免重复创建：

```typescript
const logger1 = LoggerFactory.create('MyService', true);
const logger2 = LoggerFactory.create('MyService', true);
// logger1 === logger2 (同一实例)
```

### 2. 生产环境禁用

```typescript
LoggerFactory.configure({
  enableInProduction: false, // 生产环境完全禁用日志
});
```

### 3. 提高日志级别

```typescript
LoggerFactory.configure({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
});
```

---

## 文档

- **完整指南**: `docs/logger-usage-guide.md` (450+ 行)
- **使用示例**: `docs/logger-examples.md` (300+ 行)
- **API 文档**: `packages/utils/src/logger/types.ts`

---

## 下一步建议

### 1. 集成到现有项目

✅ **API 项目**
```bash
# apps/api/src/main.ts
import { LoggerFactory, FileTransport } from '@dailyuse/utils';
```

✅ **Web 项目**
```bash
# apps/web/src/main.ts
import { LoggerFactory, ConsoleTransport } from '@dailyuse/utils';
```

✅ **Desktop 项目**
```bash
# apps/desktop/electron/main.ts (主进程)
# apps/desktop/src/main.ts (渲染进程)
```

### 2. 高级功能扩展

- [ ] 日志轮转（使用 winston-daily-rotate-file）
- [ ] 远程日志传输器（发送到日志服务）
- [ ] 数据库日志传输器
- [ ] 日志聚合和分析

### 3. 监控集成

- [ ] 集成 Sentry（错误追踪）
- [ ] 集成 LogRocket（会话重播）
- [ ] 集成 Datadog（APM 监控）

---

## 验证清单

- ✅ 类型定义完整 (`types.ts`)
- ✅ Logger 核心实现 (`Logger.ts`)
- ✅ Logger 工厂管理 (`LoggerFactory.ts`)
- ✅ 控制台传输器（跨平台）
- ✅ 文件传输器（Node.js）
- ✅ 导出到 @dailyuse/utils
- ✅ 环境检测逻辑
- ✅ 异步传输器支持
- ✅ 错误处理机制
- ✅ 完整文档（使用指南 + 示例）
- ✅ 零编译错误

---

## 总结

日志系统已成功提取为 **@dailyuse/utils** 的一部分，提供：

1. **跨平台支持** - Node.js 和浏览器统一 API
2. **灵活配置** - 全局和实例级配置
3. **多传输器** - 控制台、文件、自定义
4. **零依赖** - 仅使用内置 API
5. **完整文档** - 使用指南 + 实战示例

现在可以在 API、Web、Desktop 项目中统一使用 `@dailyuse/utils` 的日志功能，避免代码重复。

---

**作者**: DailyUse Team  
**日期**: 2024-01-15  
**版本**: 1.0.0
