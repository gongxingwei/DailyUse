# 跨平台日志系统使用指南

## 概述

`@dailyuse/utils` 提供了跨平台日志系统，支持 **Node.js** (API/Desktop 主进程) 和 **浏览器** (Web/Desktop 渲染进程) 环境。

### 特性

✅ **跨平台** - 同一套 API 在 Node.js 和浏览器中工作  
✅ **多级别** - ERROR, WARN, INFO, HTTP, DEBUG  
✅ **多传输器** - 控制台、文件（Node.js 专用）  
✅ **上下文隔离** - 每个模块独立 logger  
✅ **可扩展** - 支持自定义传输器  
✅ **生产环境控制** - 可配置是否在生产环境启用

---

## 快速开始

### 1. 基础使用

```typescript
import { createLogger } from '@dailyuse/utils/logger';

// 创建 logger 实例
const logger = createLogger('MyModule');

// 记录不同级别的日志
logger.debug('This is debug info', { userId: 123 });
logger.info('User logged in', { username: 'john' });
logger.warn('API response slow', { duration: 3000 });
logger.error('Database connection failed', new Error('Connection timeout'));
```

### 2. 创建子 Logger

```typescript
const logger = createLogger('UserModule');
const authLogger = logger.child('Auth'); // UserModule:Auth
const profileLogger = logger.child('Profile'); // UserModule:Profile

authLogger.info('User authenticated');
profileLogger.info('Profile updated');
```

---

## 环境配置

### 🖥️ Node.js 环境 (API/Desktop)

**支持所有传输器**，包括文件日志：

```typescript
// apps/api/src/main.ts
import { logger } from '@dailyuse/utils';

// 配置日志系统
logger.LoggerFactory.configure({
  level: 'debug',
  enableInProduction: true,
  transports: [
    // 控制台输出
    new logger.ConsoleTransport({
      level: logger.LogLevel.DEBUG,
      colorize: true,
      timestamp: true,
    }),
    
    // 文件输出（仅 Node.js）
    new logger.FileTransport({
      filename: './logs/app.log',
      level: logger.LogLevel.INFO,
      json: true,
    }),
  ],
});

// 创建 logger
const appLogger = logger.createLogger('API');
appLogger.info('Application started');
```

### 🌐 浏览器环境 (Web/Desktop Renderer)

**仅支持控制台传输器**：

```typescript
// apps/web/src/main.ts
import { logger } from '@dailyuse/utils';

// 配置日志系统（浏览器环境）
logger.LoggerFactory.configure({
  level: import.meta.env.DEV ? 'debug' : 'warn',
  enableInProduction: false,
  transports: [
    new logger.ConsoleTransport({
      level: logger.LogLevel.DEBUG,
      colorize: true,
      timestamp: true,
    }),
  ],
});

const appLogger = logger.createLogger('Web');
appLogger.info('Vue app mounted');
```

---

## API 参考

### createLogger(context: string): ILogger

创建 Logger 实例。

```typescript
const logger = createLogger('MyService');
```

### ILogger 方法

```typescript
interface ILogger {
  debug(message: string, ...meta: any[]): void;
  info(message: string, ...meta: any[]): void;
  http(message: string, ...meta: any[]): void;
  warn(message: string, ...meta: any[]): void;
  error(message: string, error?: Error | any, ...meta: any[]): void;
  child(subContext: string): ILogger;
  setLevel(level: LogLevelString): void;
}
```

### LoggerFactory 静态方法

```typescript
// 全局配置
LoggerFactory.configure({
  level: 'info',
  enableInProduction: true,
  transports: [...],
});

// 添加传输器
LoggerFactory.addTransport(new FileTransport({ ... }));

// 创建 logger
const logger = LoggerFactory.create('Context');

// 清除缓存
LoggerFactory.clearCache();

// 关闭所有 logger
await LoggerFactory.closeAll();
```

---

## 传输器

### ConsoleTransport（跨平台）

输出到控制台，支持颜色和格式化。

```typescript
new ConsoleTransport({
  level: LogLevel.DEBUG,    // 最小日志级别
  colorize: true,           // 启用颜色（Node.js 彩色文本，浏览器 CSS）
  timestamp: true,          // 显示时间戳
});
```

**Node.js 输出**：
```
2024-01-15T10:30:00.000Z [INFO] [UserService] User logged in
```

**浏览器输出**：
```
2024-01-15T10:30:00.000Z [INFO] [UserService] User logged in
  Metadata: { userId: 123, username: 'john' }
```

### FileTransport（仅 Node.js）

输出到文件，支持 JSON 格式。

```typescript
new FileTransport({
  filename: './logs/app.log',
  level: LogLevel.INFO,
  json: true,  // JSON 格式
});
```

**JSON 格式输出**：
```json
{"timestamp":"2024-01-15T10:30:00.000Z","level":"info","message":"User logged in","context":"UserService","metadata":{"userId":123}}
```

**文本格式输出**：
```
2024-01-15T10:30:00.000Z [INFO] [UserService] User logged in {"userId":123}
```

---

## 实际应用示例

### 示例 1: API 服务日志

```typescript
// apps/api/src/modules/goal/application/services/GoalApplicationService.ts
import { createLogger } from '@dailyuse/utils/logger';

export class GoalApplicationService {
  private readonly logger = createLogger('GoalService');

  async createGoal(dto: CreateGoalDto) {
    this.logger.info('Creating goal', { title: dto.title });
    
    try {
      const goal = await this.goalDomainService.createGoal(dto);
      this.logger.info('Goal created successfully', { goalId: goal.id });
      return goal;
    } catch (error) {
      this.logger.error('Failed to create goal', error, { dto });
      throw error;
    }
  }
}
```

### 示例 2: Web 应用日志

```typescript
// apps/web/src/modules/goal/composables/useGoalActions.ts
import { createLogger } from '@dailyuse/utils/logger';

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

### 示例 3: Desktop 主进程日志

```typescript
// apps/desktop/electron/main.ts
import { logger } from '@dailyuse/utils';
import path from 'path';

// 配置文件日志
logger.LoggerFactory.configure({
  level: 'debug',
  enableInProduction: true,
  transports: [
    new logger.ConsoleTransport({
      level: logger.LogLevel.DEBUG,
      colorize: true,
    }),
    new logger.FileTransport({
      filename: path.join(app.getPath('logs'), 'main.log'),
      level: logger.LogLevel.INFO,
      json: true,
    }),
  ],
});

const mainLogger = logger.createLogger('Main');
mainLogger.info('Electron app started');
```

---

## 日志级别

| 级别 | 值 | 用途 |
|------|-----|------|
| ERROR | 0 | 错误信息（最高优先级） |
| WARN | 1 | 警告信息 |
| INFO | 2 | 常规信息 |
| HTTP | 3 | HTTP 请求日志 |
| DEBUG | 4 | 调试信息（最低优先级） |

**级别过滤规则**：设置为 `INFO` 时，只记录 ERROR、WARN、INFO 级别的日志。

---

## 生产环境配置

### 推荐配置

```typescript
const isProduction = process.env.NODE_ENV === 'production';

logger.LoggerFactory.configure({
  level: isProduction ? 'warn' : 'debug',
  enableInProduction: true,
  transports: isProduction
    ? [
        // 生产环境：只记录警告和错误到文件
        new logger.FileTransport({
          filename: './logs/error.log',
          level: logger.LogLevel.WARN,
          json: true,
        }),
      ]
    : [
        // 开发环境：控制台输出所有日志
        new logger.ConsoleTransport({
          level: logger.LogLevel.DEBUG,
          colorize: true,
        }),
      ],
});
```

---

## 自定义传输器

实现 `LogTransport` 接口创建自定义传输器：

```typescript
import type { LogTransport, LogEntry, LogLevel } from '@dailyuse/utils/logger';

export class RemoteTransport implements LogTransport {
  name = 'remote';
  level: LogLevel;
  private apiUrl: string;

  constructor(apiUrl: string, level: LogLevel = 1) {
    this.apiUrl = apiUrl;
    this.level = level;
  }

  async log(entry: LogEntry): Promise<void> {
    try {
      await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.error('[RemoteTransport] Failed to send log:', error);
    }
  }
}

// 使用
logger.LoggerFactory.addTransport(
  new RemoteTransport('https://api.example.com/logs', logger.LogLevel.ERROR)
);
```

---

## 常见问题

### Q1: 如何在浏览器中使用文件日志？

**A**: 浏览器环境不支持文件系统访问，`FileTransport` 会自动静默失败。如需持久化日志，请使用自定义传输器（如发送到远程服务器、localStorage 等）。

### Q2: 如何禁用生产环境日志？

**A**: 设置 `enableInProduction: false`：

```typescript
logger.LoggerFactory.configure({
  enableInProduction: false,
});
```

### Q3: 如何动态修改日志级别？

**A**: 使用 `setLevel` 方法：

```typescript
const logger = createLogger('MyService');

// 开发环境
logger.setLevel('debug');

// 生产环境
logger.setLevel('warn');
```

### Q4: 如何在关闭应用前清理日志？

**A**: 调用 `closeAll()`：

```typescript
// 应用退出前
await logger.LoggerFactory.closeAll();
```

---

## 性能建议

1. **避免频繁创建 Logger**  
   使用 `LoggerFactory.create(context, useCache: true)` 缓存实例

2. **生产环境提高日志级别**  
   设置为 `warn` 或 `error` 减少 I/O

3. **异步传输器**  
   自定义传输器的 `log()` 方法可返回 `Promise` 实现异步操作

4. **日志轮转**  
   对于 Node.js 项目，建议使用 `winston-daily-rotate-file` 等库进行日志轮转

---

## 类型定义

完整类型定义请参考：

```typescript
packages/utils/src/logger/types.ts
```

---

**作者**: DailyUse Team  
**更新时间**: 2024-01-15  
**版本**: 1.0.0
