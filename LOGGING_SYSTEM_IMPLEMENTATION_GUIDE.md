# API 日志系统实现指南

## 📅 日期
2025年10月3日

---

## 🎯 目标

为 DailyUse API 项目实现一个完整的日志系统，支持：
- 📝 多级别日志（DEBUG, INFO, WARN, ERROR）
- 📂 文件存储和轮转
- 🎨 控制台彩色输出
- 📊 结构化日志（JSON 格式）
- 🔍 请求追踪（Request ID）
- ⚡ 高性能（异步写入）

---

## 🏆 推荐方案：Winston + Morgan

### 为什么选择 Winston?

✅ **最成熟的 Node.js 日志库**（100k+ GitHub Stars）
✅ **灵活的传输层**（支持文件、控制台、数据库等）
✅ **日志级别控制**
✅ **日志格式化**（支持 JSON、自定义格式）
✅ **日志轮转**（配合 winston-daily-rotate-file）
✅ **高性能**（异步写入）

### 为什么配合 Morgan?

✅ **HTTP 请求日志中间件**
✅ **与 Winston 无缝集成**
✅ **自动记录请求信息**（方法、路径、状态码、响应时间）

---

## 📦 安装依赖

```bash
# 核心日志库
pnpm add winston winston-daily-rotate-file

# HTTP 请求日志中间件
pnpm add morgan

# 类型定义
pnpm add -D @types/morgan
```

---

## 🏗️ 实现架构

```
apps/api/src/
├── config/
│   └── logger.ts                 # Winston 配置
├── shared/
│   ├── middlewares/
│   │   ├── index.ts
│   │   └── requestLogger.ts      # Morgan 中间件
│   └── utils/
│       └── logger.ts             # 日志工具类
└── logs/                         # 日志文件目录
    ├── error/
    │   ├── error-2025-10-03.log
    │   └── ...
    ├── combined/
    │   ├── combined-2025-10-03.log
    │   └── ...
    └── http/
        ├── http-2025-10-03.log
        └── ...
```

---

## 📝 实现代码

### 1. Winston 配置文件

**文件**: `apps/api/src/config/logger.ts`

```typescript
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// 定义日志级别和颜色
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// 应用颜色设置
winston.addColors(colors);

// 根据环境设置日志级别
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// 自定义日志格式
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    
    // 如果有额外的元数据，添加到日志中
    const metaStr = Object.keys(meta).length > 0 
      ? `\n${JSON.stringify(meta, null, 2)}` 
      : '';
    
    return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`;
  })
);

// 控制台格式（带颜色）
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  customFormat
);

// JSON 格式（用于文件）
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// 日志目录
const logDir = path.join(process.cwd(), 'logs');

// 错误日志轮转配置
const errorRotateTransport = new DailyRotateFile({
  dirname: path.join(logDir, 'error'),
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  format: fileFormat,
  maxSize: '20m',
  maxFiles: '14d', // 保留 14 天
  zippedArchive: true,
});

// 组合日志轮转配置
const combinedRotateTransport = new DailyRotateFile({
  dirname: path.join(logDir, 'combined'),
  filename: 'combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  format: fileFormat,
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
});

// HTTP 请求日志轮转配置
const httpRotateTransport = new DailyRotateFile({
  dirname: path.join(logDir, 'http'),
  filename: 'http-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'http',
  format: fileFormat,
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
});

// 创建 Winston Logger 实例
export const logger = winston.createLogger({
  level: level(),
  levels,
  format: customFormat,
  transports: [
    // 控制台输出（仅开发环境）
    ...(process.env.NODE_ENV !== 'production'
      ? [
          new winston.transports.Console({
            format: consoleFormat,
          }),
        ]
      : []),
    
    // 错误日志文件
    errorRotateTransport,
    
    // 组合日志文件
    combinedRotateTransport,
    
    // HTTP 请求日志文件
    httpRotateTransport,
  ],
  
  // 异常处理
  exceptionHandlers: [
    new DailyRotateFile({
      dirname: path.join(logDir, 'exceptions'),
      filename: 'exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
  
  // 未捕获的 Promise 拒绝
  rejectionHandlers: [
    new DailyRotateFile({
      dirname: path.join(logDir, 'rejections'),
      filename: 'rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

// 导出日志方法
export default logger;
```

---

### 2. 日志工具类

**文件**: `apps/api/src/shared/utils/logger.ts`

```typescript
import { logger as winstonLogger } from '../../config/logger';

/**
 * 日志工具类
 * 提供便捷的日志方法
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(message: string): string {
    return `[${this.context}] ${message}`;
  }

  /**
   * DEBUG 级别日志
   */
  debug(message: string, ...meta: any[]): void {
    winstonLogger.debug(this.formatMessage(message), ...meta);
  }

  /**
   * INFO 级别日志
   */
  info(message: string, ...meta: any[]): void {
    winstonLogger.info(this.formatMessage(message), ...meta);
  }

  /**
   * HTTP 级别日志
   */
  http(message: string, ...meta: any[]): void {
    winstonLogger.http(this.formatMessage(message), ...meta);
  }

  /**
   * WARN 级别日志
   */
  warn(message: string, ...meta: any[]): void {
    winstonLogger.warn(this.formatMessage(message), ...meta);
  }

  /**
   * ERROR 级别日志
   */
  error(message: string, error?: Error | any, ...meta: any[]): void {
    if (error instanceof Error) {
      winstonLogger.error(this.formatMessage(message), {
        error: {
          message: error.message,
          stack: error.stack,
          ...error,
        },
        ...meta,
      });
    } else {
      winstonLogger.error(this.formatMessage(message), error, ...meta);
    }
  }

  /**
   * 创建子 Logger
   */
  child(subContext: string): Logger {
    return new Logger(`${this.context}:${subContext}`);
  }
}

/**
 * 创建 Logger 实例的工厂函数
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

// 导出默认 Winston Logger
export { winstonLogger as logger };
```

---

### 3. HTTP 请求日志中间件

**文件**: `apps/api/src/shared/middlewares/requestLogger.ts`

```typescript
import morgan from 'morgan';
import { logger } from '../../config/logger';
import type { Request, Response } from 'express';

// 自定义 token：请求 ID
morgan.token('request-id', (req: Request) => {
  return req.headers['x-request-id'] as string || 'N/A';
});

// 自定义 token：用户信息
morgan.token('user', (req: Request) => {
  const user = (req as any).user;
  return user ? user.uuid || user.username : 'anonymous';
});

// 自定义日志格式
const morganFormat = process.env.NODE_ENV === 'production'
  ? ':request-id :remote-addr :user :method :url :status :res[content-length] - :response-time ms'
  : ':request-id :method :url :status :res[content-length] - :response-time ms';

// 创建 Morgan 中间件
export const requestLogger = morgan(morganFormat, {
  stream: {
    write: (message: string) => {
      // 将 Morgan 的输出写入 Winston
      logger.http(message.trim());
    },
  },
  
  // 跳过某些路由（如健康检查）
  skip: (req: Request) => {
    return req.url === '/api/v1/health';
  },
});

// 添加 Request ID 的中间件
export function addRequestId(req: Request, res: Response, next: Function) {
  const requestId = req.headers['x-request-id'] || 
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId as string;
  res.setHeader('X-Request-ID', requestId);
  
  next();
}
```

---

### 4. 更新中间件导出

**文件**: `apps/api/src/shared/middlewares/index.ts`

```typescript
// ... 其他导出

export { requestLogger, addRequestId } from './requestLogger';
```

---

### 5. 集成到 Express 应用

**文件**: `apps/api/src/app.ts`

```typescript
import express, { type Express, ... } from 'express';
import { requestLogger, addRequestId } from './shared/middlewares';
import { logger } from './config/logger';

const app: Express = express();

// ... 其他中间件

// 添加 Request ID
app.use(addRequestId);

// HTTP 请求日志
app.use(requestLogger);

// ... 路由等

// 错误处理中间件（记录错误日志）
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  
  const status = Number(err?.status ?? 500);
  res.status(status).json({
    code: err?.code ?? 'INTERNAL_ERROR',
    message: err?.message ?? 'Internal Server Error',
  });
});

export default app;
```

---

## 🎨 使用示例

### 在服务中使用

```typescript
import { createLogger } from '../../shared/utils/logger';

export class GoalApplicationService {
  private logger = createLogger('GoalApplicationService');

  async initializeUserData(accountUuid: string): Promise<void> {
    this.logger.info(`开始初始化用户目标数据: ${accountUuid}`);
    
    try {
      // ... 业务逻辑
      
      this.logger.info(`用户目标数据初始化完成: ${accountUuid}`);
    } catch (error) {
      this.logger.error(`用户目标数据初始化失败`, error, {
        accountUuid,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  async createGoal(data: any): Promise<any> {
    const childLogger = this.logger.child('createGoal');
    
    childLogger.debug('接收到创建目标请求', { data });
    
    // ... 业务逻辑
    
    childLogger.info('目标创建成功', { goalUuid: result.uuid });
    
    return result;
  }
}
```

### 在控制器中使用

```typescript
import { createLogger } from '../../shared/utils/logger';

const logger = createLogger('GoalController');

export async function createGoal(req: Request, res: Response) {
  const requestId = req.headers['x-request-id'];
  
  logger.info('收到创建目标请求', { 
    requestId,
    accountUuid: req.user.uuid,
  });

  try {
    const result = await goalService.createGoal(req.body);
    
    logger.info('目标创建成功', { 
      requestId,
      goalUuid: result.uuid,
    });
    
    res.json(result);
  } catch (error) {
    logger.error('目标创建失败', error, { 
      requestId,
      body: req.body,
    });
    
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
```

---

## 📊 日志输出示例

### 控制台输出（开发环境）

```
2025-10-03 18:30:15 [INFO]: [GoalApplicationService] 开始初始化用户目标数据: dd21a44c-c696-457d-8c78-3283b59e7e96
2025-10-03 18:30:15 [DEBUG]: [GoalApplicationService:createGoal] 接收到创建目标请求
{
  "data": { "title": "学习 TypeScript", "dirUuid": "..." }
}
2025-10-03 18:30:16 [INFO]: [GoalApplicationService] 用户目标数据初始化完成: dd21a44c-c696-457d-8c78-3283b59e7e96
2025-10-03 18:30:16 [HTTP]: 1696339816123-abc123 POST /api/v1/goals 201 150 - 45 ms
```

### 文件输出（JSON 格式）

**logs/combined/combined-2025-10-03.log**:
```json
{
  "timestamp": "2025-10-03T18:30:15.123Z",
  "level": "info",
  "message": "[GoalApplicationService] 开始初始化用户目标数据: dd21a44c-c696-457d-8c78-3283b59e7e96"
}
{
  "timestamp": "2025-10-03T18:30:16.456Z",
  "level": "error",
  "message": "[GoalApplicationService] 用户目标数据初始化失败",
  "error": {
    "message": "Database connection failed",
    "stack": "Error: Database connection failed\n    at..."
  },
  "accountUuid": "dd21a44c-c696-457d-8c78-3283b59e7e96"
}
```

---

## 🔧 配置选项

### 环境变量

在 `.env` 文件中添加：

```env
# 日志级别 (error, warn, info, http, debug)
LOG_LEVEL=info

# 是否在生产环境输出到控制台
LOG_CONSOLE_ENABLED=false

# 日志文件最大大小
LOG_MAX_SIZE=20m

# 日志文件保留天数
LOG_MAX_FILES=14d
```

### 更新 logger.ts 使用环境变量

```typescript
const level = () => {
  return process.env.LOG_LEVEL || 
    (process.env.NODE_ENV === 'development' ? 'debug' : 'info');
};

const consoleEnabled = process.env.LOG_CONSOLE_ENABLED === 'true' ||
  process.env.NODE_ENV !== 'production';
```

---

## 📂 .gitignore 配置

```gitignore
# 日志文件
logs/
*.log
```

---

## 🚀 高级特性

### 1. 性能监控

```typescript
import { performance } from 'perf_hooks';

export class PerformanceLogger {
  private logger: Logger;

  constructor(context: string) {
    this.logger = createLogger(context);
  }

  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.logger.debug(`${name} completed in ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.logger.error(`${name} failed after ${duration.toFixed(2)}ms`, error);
      
      throw error;
    }
  }
}
```

### 2. 结构化日志查询

使用工具如 **ELK Stack** 或 **Loki** 来查询和分析日志：

```bash
# 安装 @elastic/elasticsearch
pnpm add @elastic/elasticsearch

# 添加 Elasticsearch Transport
import { ElasticsearchTransport } from 'winston-elasticsearch';

const esTransport = new ElasticsearchTransport({
  level: 'info',
  clientOpts: { node: 'http://localhost:9200' },
});

logger.add(esTransport);
```

### 3. 日志采样（高流量场景）

```typescript
// 只记录 10% 的 DEBUG 日志
const shouldLog = (level: string) => {
  if (level === 'debug') {
    return Math.random() < 0.1;
  }
  return true;
};
```

---

## 📊 日志级别使用指南

| 级别 | 使用场景 | 示例 |
|-----|---------|------|
| **ERROR** | 错误、异常 | 数据库连接失败、API 调用失败 |
| **WARN** | 警告、潜在问题 | 配置缺失但有默认值、性能低于预期 |
| **INFO** | 重要业务操作 | 用户注册、订单创建、支付完成 |
| **HTTP** | HTTP 请求 | API 请求日志 |
| **DEBUG** | 调试信息 | 函数参数、中间状态 |

---

## 🧪 测试日志系统

```typescript
import { createLogger } from './shared/utils/logger';

const logger = createLogger('LoggerTest');

logger.debug('这是一条 DEBUG 日志');
logger.info('这是一条 INFO 日志');
logger.http('这是一条 HTTP 日志');
logger.warn('这是一条 WARN 日志');
logger.error('这是一条 ERROR 日志', new Error('测试错误'));

// 测试子 Logger
const childLogger = logger.child('SubModule');
childLogger.info('来自子模块的日志');
```

---

## 📚 推荐阅读

- [Winston 官方文档](https://github.com/winstonjs/winston)
- [Morgan 官方文档](https://github.com/expressjs/morgan)
- [Node.js 最佳实践 - 日志](https://github.com/goldbergyoni/nodebestpractices#logging)

---

## ✅ 实施检查清单

- [ ] 安装依赖 (`winston`, `winston-daily-rotate-file`, `morgan`)
- [ ] 创建 `config/logger.ts`
- [ ] 创建 `shared/utils/logger.ts`
- [ ] 创建 `shared/middlewares/requestLogger.ts`
- [ ] 更新 `app.ts` 集成中间件
- [ ] 添加 `.gitignore` 规则
- [ ] 配置环境变量
- [ ] 更新现有代码使用新的日志系统
- [ ] 测试日志输出
- [ ] 验证日志轮转功能

---

**作者**: GitHub Copilot  
**日期**: 2025-10-03  
**版本**: 1.0  
**状态**: ✅ 实施方案完成
