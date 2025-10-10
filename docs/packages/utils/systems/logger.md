# 日志系统

> **位置**: `packages/utils/src/logger`  
> **适用范围**: API、Web、Desktop 项目  
> **依赖**: 无（零外部依赖）

---

## 📋 概述

DailyUse 的日志系统是一个跨平台、零依赖的日志解决方案，支持 Node.js 和浏览器环境。提供统一的 API、多级别日志、彩色输出、结构化日志和环境自适应配置。

### 核心特性

- ✅ **跨平台**: Node.js + 浏览器统一 API
- ✅ **零依赖**: 仅使用内置模块
- ✅ **多传输器**: 控制台、文件、自定义传输器
- ✅ **多级别**: ERROR, WARN, INFO, HTTP, DEBUG
- ✅ **彩色输出**: Node.js ANSI + 浏览器 CSS
- ✅ **结构化**: JSON 格式便于分析
- ✅ **环境感知**: 开发/生产环境自动适配

---

## 🏗️ 架构设计

### 核心组件

```
┌─────────────────────────────────────┐
│         LoggerFactory               │  配置工厂
│  - 全局配置                          │
│  - 环境检测                          │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│         Logger                      │  日志记录器
│  - debug()                          │
│  - info()                           │
│  - warn()                           │
│  - error()                          │
└────────────┬────────────────────────┘
             │
      ┌──────┴──────┐
      ↓             ↓
┌──────────┐  ┌──────────┐
│ Console  │  │   File   │  传输器
│Transport │  │Transport │
└──────────┘  └──────────┘
```

### 文件结构

```
packages/utils/src/logger/
├── Logger.ts                 # 核心日志记录器
├── LoggerFactory.ts          # 工厂类
├── types.ts                  # 类型定义
├── index.ts                  # 导出入口
└── transports/
    ├── ConsoleTransport.ts   # 控制台传输器
    └── FileTransport.ts      # 文件传输器
```

---

## 🚀 快速开始

### 1. 初始化日志系统

#### API 项目（Node.js）

```typescript
// apps/api/src/config/logger.config.ts
import { LoggerFactory, ConsoleTransport, FileTransport, LogLevel } from '@dailyuse/utils';
import path from 'node:path';

export function initializeLogger(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const logLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;

  const transports = [
    // 控制台输出（所有环境）
    new ConsoleTransport({
      level: LogLevel.DEBUG,
      colorize: true,
      timestamp: true,
    }),
  ];

  // 生产环境添加文件日志
  if (isProduction) {
    const logDir = path.join(process.cwd(), 'logs');
    
    transports.push(
      new FileTransport({
        filename: path.join(logDir, 'combined.log'),
        level: LogLevel.INFO,
        json: true,
      }),
      new FileTransport({
        filename: path.join(logDir, 'error.log'),
        level: LogLevel.ERROR,
        json: true,
      }),
    );
  }

  LoggerFactory.configure({
    level: logLevel,
    enableInProduction: true,
    transports,
  });
}
```

```typescript
// apps/api/src/index.ts
import { initializeLogger } from './config/logger.config';
import { createLogger } from '@dailyuse/utils';

// 初始化日志系统
initializeLogger();

// 创建日志记录器
const logger = createLogger('API');

logger.info('API server starting...', {
  environment: process.env.NODE_ENV,
  port: process.env.PORT,
});
```

#### Web 项目（浏览器）

```typescript
// apps/web/src/config/logger.config.ts
import { LoggerFactory, ConsoleTransport, LogLevel } from '@dailyuse/utils';

export function initializeLogger(): void {
  const isDevelopment = import.meta.env.MODE === 'development';
  const logLevel = import.meta.env.VITE_LOG_LEVEL || 'debug';

  LoggerFactory.configure({
    level: logLevel as LogLevel,
    enableInProduction: false, // 生产环境禁用日志
    transports: [
      new ConsoleTransport({
        level: LogLevel.DEBUG,
        colorize: true,
        timestamp: true,
      }),
    ],
  });
}
```

```typescript
// apps/web/src/main.ts
import { initializeLogger } from './config/logger.config';
import { createLogger } from '@dailyuse/utils';

// 初始化日志系统
initializeLogger();

// 创建日志记录器
const logger = createLogger('WebApp');

logger.info('Application starting...', {
  environment: import.meta.env.MODE,
  version: import.meta.env.VITE_APP_VERSION,
});
```

### 2. 使用日志记录器

```typescript
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalService');

// 基础日志
logger.debug('Entering createGoal method');
logger.info('Goal created successfully');
logger.warn('Goal directory not found, using default');
logger.error('Failed to create goal', error);

// 带元数据的日志
logger.info('Creating goal', {
  accountUuid: 'acc-123',
  goalName: 'Learn TypeScript',
  directoryId: 'dir-456',
});

// 错误日志（第二个参数是 Error 对象）
try {
  await createGoal(data);
} catch (error) {
  logger.error('Goal creation failed', error, {
    accountUuid: data.accountUuid,
    attemptedOperation: 'createGoal',
  });
}
```

---

## 📊 日志级别

### 级别优先级

```
ERROR (最高) → WARN → INFO → HTTP → DEBUG (最低)
```

### 使用场景

| 级别 | 数值 | 使用场景 | 示例 |
|------|------|---------|------|
| `ERROR` | 0 | 错误、异常、失败 | `logger.error('Database connection failed', error)` |
| `WARN` | 1 | 警告、非预期但可处理 | `logger.warn('Using deprecated API', { api: 'v1/users' })` |
| `INFO` | 2 | 重要业务操作、状态变化 | `logger.info('User logged in', { userId: '123' })` |
| `HTTP` | 3 | HTTP 请求/响应 | `logger.http('GET /api/goals', { status: 200 })` |
| `DEBUG` | 4 | 调试信息、详细流程 | `logger.debug('Validating input', { input })` |

### 级别配置

```typescript
// 开发环境：显示所有日志
LoggerFactory.configure({
  level: LogLevel.DEBUG,
});

// 生产环境：仅显示重要日志
LoggerFactory.configure({
  level: LogLevel.INFO,
});
```

---

## 🎨 日志格式

### 控制台输出（开发环境）

```
2025-10-03T10:30:15.234Z [INFO] [GoalService] Creating goal
  Metadata: { accountUuid: 'acc-123', goalName: 'Learn TypeScript' }
2025-10-03T10:30:15.456Z [INFO] [GoalService] Goal created successfully
  Metadata: { goalUuid: 'goal-456' }
2025-10-03T10:30:15.678Z [ERROR] [GoalService] Failed to save goal
  Error: Error { message: 'Database connection lost', stack: '...' }
  Metadata: { goalUuid: 'goal-456' }
```

### 文件输出（生产环境 JSON）

```json
{
  "timestamp": "2025-10-03T10:30:15.234Z",
  "level": "info",
  "context": "GoalService",
  "message": "Creating goal",
  "metadata": {
    "accountUuid": "acc-123",
    "goalName": "Learn TypeScript"
  }
}
{
  "timestamp": "2025-10-03T10:30:15.678Z",
  "level": "error",
  "context": "GoalService",
  "message": "Failed to save goal",
  "error": {
    "message": "Database connection lost",
    "stack": "Error: Database connection lost\n    at ..."
  },
  "metadata": {
    "goalUuid": "goal-456"
  }
}
```

---

## 🔧 传输器配置

### ConsoleTransport（控制台）

```typescript
new ConsoleTransport({
  level: LogLevel.DEBUG,        // 最低日志级别
  colorize: true,               // 彩色输出（Node.js）
  timestamp: true,              // 显示时间戳
  prettyPrint: true,            // 格式化输出
})
```

**彩色方案**:
- ERROR: 红色
- WARN: 黄色
- INFO: 绿色
- HTTP: 蓝色
- DEBUG: 青色

### FileTransport（文件）

```typescript
new FileTransport({
  filename: 'logs/app.log',     // 日志文件路径
  level: LogLevel.INFO,         // 最低日志级别
  json: true,                   // JSON 格式
  maxSize: 10 * 1024 * 1024,    // 最大文件大小 (10MB)
  maxFiles: 5,                  // 最多保留文件数
})
```

**文件组织**:
```
logs/
├── combined.log       # 所有日志（INFO 及以上）
├── error.log          # 仅错误日志
├── combined.log.1     # 滚动备份
└── error.log.1        # 滚动备份
```

---

## 💡 最佳实践

### 1. 使用描述性的上下文名称

```typescript
// ❌ 不推荐
const logger = createLogger('Service');

// ✅ 推荐
const logger = createLogger('GoalApplicationService');
const logger = createLogger('UserAuthController');
const logger = createLogger('DatabaseConnection');
```

### 2. 记录结构化元数据

```typescript
// ❌ 不推荐
logger.info(`Creating goal: ${goalName} for user: ${accountUuid}`);

// ✅ 推荐
logger.info('Creating goal', {
  accountUuid,
  goalName,
  directoryId,
  timestamp: Date.now(),
});
```

### 3. 错误日志包含完整上下文

```typescript
try {
  await goalService.createGoal(dto);
} catch (error) {
  // ✅ 包含 Error 对象和业务上下文
  logger.error('Failed to create goal', error, {
    accountUuid: dto.accountUuid,
    goalData: dto,
    operation: 'createGoal',
  });
  throw error;
}
```

### 4. 合理选择日志级别

```typescript
// 关键业务操作
logger.info('User logged in', { userId, sessionId });
logger.info('Payment processed', { orderId, amount });

// 详细调试信息
logger.debug('Validating input', { input });
logger.debug('Cache hit', { key, value });

// 警告（非阻塞问题）
logger.warn('Rate limit approaching', { current: 95, limit: 100 });
logger.warn('Using fallback configuration', { reason: 'config file not found' });

// 错误（操作失败）
logger.error('Database query failed', error, { query });
logger.error('API request timeout', error, { url, timeout });
```

### 5. 避免敏感信息

```typescript
// ❌ 不推荐（记录密码）
logger.info('User login attempt', {
  username: 'john',
  password: 'secret123',  // 敏感！
});

// ✅ 推荐（脱敏）
logger.info('User login attempt', {
  username: 'john',
  hasPassword: true,
});
```

### 6. 性能敏感场景使用条件日志

```typescript
// ✅ 仅在 DEBUG 级别启用时才计算昂贵的元数据
if (logger.isDebugEnabled()) {
  logger.debug('Complex calculation result', {
    result: expensiveCalculation(),
    details: generateDetailedReport(),
  });
}
```

---

## 🔍 实战示例

### Controller 中使用

```typescript
import { createLogger } from '@dailyuse/utils';
import type { Request, Response } from 'express';

const logger = createLogger('GoalController');

export class GoalController {
  static async createGoal(req: Request, res: Response) {
    const accountUuid = req.user?.accountUuid;
    const request = req.body;

    logger.info('Creating goal', { accountUuid, goalName: request.name });

    try {
      const goal = await goalService.createGoal(accountUuid, request);
      
      logger.info('Goal created successfully', {
        goalUuid: goal.uuid,
        accountUuid,
      });

      return Response.created(res, goal, 'Goal created successfully');
    } catch (error) {
      logger.error('Failed to create goal', error, {
        accountUuid,
        requestData: request,
      });

      return Response.error(res, 'Failed to create goal');
    }
  }
}
```

### Service 中使用

```typescript
import { createLogger } from '@dailyuse/utils';

export class GoalApplicationService {
  private readonly logger = createLogger('GoalApplicationService');

  async createGoal(accountUuid: string, dto: CreateGoalDto): Promise<Goal> {
    this.logger.debug('Validating goal creation request', { dto });

    // 验证输入
    if (!dto.name) {
      this.logger.warn('Goal name is required', { accountUuid });
      throw new ValidationError('Goal name is required');
    }

    this.logger.info('Creating goal in domain layer', {
      accountUuid,
      goalName: dto.name,
    });

    try {
      const goal = await this.goalDomainService.createGoal(dto);
      
      this.logger.info('Goal created successfully', {
        goalUuid: goal.uuid,
        accountUuid,
      });

      return goal;
    } catch (error) {
      this.logger.error('Goal creation failed in domain layer', error, {
        accountUuid,
        dto,
      });
      throw error;
    }
  }
}
```

### Vue Composable 中使用

```typescript
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('useGoalActions');

export function useGoalActions() {
  const createGoal = async (data: CreateGoalInput) => {
    logger.debug('User creating goal from UI', { data });

    try {
      const result = await goalApi.create(data);
      
      logger.info('Goal created successfully', {
        goalId: result.id,
        name: result.name,
      });

      return result;
    } catch (error) {
      logger.error('Failed to create goal', error, { data });
      throw error;
    }
  };

  return { createGoal };
}
```

---

## 🧪 测试集成

### 测试中禁用日志

```typescript
import { LoggerFactory, LogLevel } from '@dailyuse/utils';

describe('GoalService', () => {
  beforeAll(() => {
    // 测试时禁用日志或仅显示错误
    LoggerFactory.configure({
      level: LogLevel.ERROR,
      transports: [],
    });
  });

  it('should create goal', async () => {
    // 测试代码...
  });
});
```

### 验证日志输出

```typescript
import { createLogger, ConsoleTransport } from '@dailyuse/utils';

describe('Logger', () => {
  it('should log info message', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    const logger = createLogger('Test');

    logger.info('Test message', { data: 'value' });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO]'),
      expect.stringContaining('Test message'),
    );
  });
});
```

---

## 🌍 环境配置

### API 项目 (.env)

```env
# 日志级别 (error | warn | info | http | debug)
LOG_LEVEL=debug

# 开发环境启用文件日志（可选）
ENABLE_FILE_LOGS=false

# Node 环境
NODE_ENV=development
```

### Web 项目 (.env)

```env
# 日志级别
VITE_LOG_LEVEL=debug

# 环境
VITE_MODE=development

# 应用版本
VITE_APP_VERSION=1.0.0
```

---

## 📚 API 参考

### createLogger(context: string): Logger

创建日志记录器。

```typescript
const logger = createLogger('MyService');
```

### Logger 方法

| 方法 | 签名 | 说明 |
|------|------|------|
| `debug()` | `debug(message: string, metadata?: any)` | 调试日志 |
| `info()` | `info(message: string, metadata?: any)` | 信息日志 |
| `warn()` | `warn(message: string, metadata?: any)` | 警告日志 |
| `error()` | `error(message: string, error?: Error, metadata?: any)` | 错误日志 |
| `http()` | `http(message: string, metadata?: any)` | HTTP 日志 |

### LoggerFactory 方法

| 方法 | 签名 | 说明 |
|------|------|------|
| `configure()` | `configure(config: LoggerConfig)` | 配置日志系统 |
| `getConfig()` | `getConfig(): LoggerConfig` | 获取当前配置 |
| `reset()` | `reset()` | 重置配置 |

---

## 🔗 相关文档

- [[LOGGER_INTEGRATION_COMPLETE]] - 日志系统集成完成总结
- [[LOGGER_QUICK_REFERENCE]] - 快速参考卡
- `docs/logger-usage-guide.md` - 详细使用指南
- `docs/logger-examples.md` - 实战示例

---

## 📝 变更历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2025-10-03 | 初始版本，完整日志系统 |
| 1.1.0 | 2025-10-03 | 集成到 API 和 Web 项目 |

---

**维护者**: DailyUse Team  
**最后更新**: 2025-10-03
