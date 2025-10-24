# 日志系统快速参考

## 🚀 快速开始

### 1. 导入 Logger

```typescript
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('MyModule');
```

### 2. 基础使用

```typescript
logger.debug('Debug message', { detail: 'extra info' });
logger.info('User logged in', { userId: 123 });
logger.warn('API slow', { duration: 3000 });
logger.error('Database error', error, { query: 'SELECT *' });
```

---

## 📋 上下文命名规范

| 模块类型 | 命名示例                        |
| -------- | ------------------------------- |
| 应用服务 | `AccountService`, `GoalService` |
| 领域服务 | `GoalDomainService`             |
| 控制器   | `AccountController`             |
| 仓储     | `AccountRepository`             |
| 基础设施 | `EventSystem`, `Initializer`    |
| HTTP/API | `API`, `Express`                |
| Web 组件 | `WebApp`, `GoalActions`         |

---

## 🎨 日志级别

| 级别  | 用途     | 示例                                    |
| ----- | -------- | --------------------------------------- |
| DEBUG | 详细调试 | `logger.debug('Step 1', { data })`      |
| INFO  | 正常流程 | `logger.info('User logged in')`         |
| WARN  | 警告     | `logger.warn('API slow', { ms: 3000 })` |
| ERROR | 错误     | `logger.error('DB failed', error)`      |

---

## 💡 最佳实践

### ✅ 推荐

```typescript
// 结构化日志
logger.info('Account created', {
  accountUuid: account.uuid,
  username: account.username,
  type: account.type,
});

// 错误日志带元数据
logger.error('Failed to create account', error, {
  requestData: dto,
  timestamp: new Date().toISOString(),
});
```

### ❌ 不推荐

```typescript
// 字符串拼接
logger.info(`Account created: ${account.uuid}`);

// 缺少上下文
logger.error('Error occurred', error);
```

---

## 🔧 配置

### API 项目

```typescript
// apps/api/src/config/logger.config.ts
import { LoggerFactory, ConsoleTransport, FileTransport, LogLevel } from '@dailyuse/utils';

LoggerFactory.configure({
  level: 'info',
  enableInProduction: true,
  transports: [
    new ConsoleTransport({ level: LogLevel.DEBUG }),
    new FileTransport({ filename: './logs/app.log' }),
  ],
});
```

### Web 项目

```typescript
// apps/web/src/config/logger.config.ts
import { LoggerFactory, ConsoleTransport, LogLevel } from '@dailyuse/utils';

LoggerFactory.configure({
  level: 'debug',
  enableInProduction: false,
  transports: [new ConsoleTransport({ level: LogLevel.DEBUG })],
});
```

---

## 🌍 环境配置

### .env (API)

```env
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_FILE_LOGS=false
```

### .env (Web)

```env
VITE_LOG_LEVEL=debug
VITE_MODE=development
```

---

## 🎯 常用模式

### 服务类

```typescript
import { createLogger } from '@dailyuse/utils';

export class MyService {
  private readonly logger = createLogger('MyService');

  async doSomething() {
    this.logger.info('Starting operation');

    try {
      const result = await operation();
      this.logger.info('Operation completed', { result });
      return result;
    } catch (error) {
      this.logger.error('Operation failed', error);
      throw error;
    }
  }
}
```

### Composable (Vue)

```typescript
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('MyComposable');

export function useMyAction() {
  const doAction = async () => {
    logger.debug('Action triggered');

    try {
      const result = await api.call();
      logger.info('Action completed', { result });
      return result;
    } catch (error) {
      logger.error('Action failed', error);
      throw error;
    }
  };

  return { doAction };
}
```

---

## 📦 核心 API

```typescript
// 创建 logger
const logger = createLogger('Context');

// 日志方法
logger.debug(message: string, ...meta: any[]): void
logger.info(message: string, ...meta: any[]): void
logger.warn(message: string, ...meta: any[]): void
logger.error(message: string, error?: Error, ...meta: any[]): void

// 子 logger
const childLogger = logger.child('SubContext');

// 设置级别
logger.setLevel('debug');

// 全局配置
LoggerFactory.configure(config: LoggerConfig): void
LoggerFactory.addTransport(transport: LogTransport): void
LoggerFactory.clearCache(): void
```

---

## 🔍 调试技巧

### 临时提高日志级别

```typescript
// 临时启用 DEBUG 日志
logger.setLevel('debug');

// ... 调试代码 ...

// 恢复正常级别
logger.setLevel('info');
```

### 条件日志

```typescript
if (process.env.DEBUG_MODE === 'true') {
  logger.debug('Detailed debug info', {
    data: expensiveOperation(),
  });
}
```

---

## 📚 完整文档

- **使用指南**: `docs/logger-usage-guide.md`
- **实战示例**: `docs/logger-examples.md`
- **集成完成**: `LOGGER_INTEGRATION_COMPLETE.md`
- **集成指南**: `LOGGER_INTEGRATION_GUIDE.md`

---

**版本**: 1.0.0  
**更新**: 2025-10-03
